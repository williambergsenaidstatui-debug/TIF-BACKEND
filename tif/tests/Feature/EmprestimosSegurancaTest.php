<?php

namespace Tests\Feature;

use App\Models\EquipamentosModel;
use App\Models\Usuario;
use App\Models\VinculoModel;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Facades\Password;
use Illuminate\Testing\TestResponse;
use Tests\TestCase;

class EmprestimosSegurancaTest extends TestCase
{
    use RefreshDatabase;

    private function requisitar(string $metodo, string $url, array $dados = [], ?string $token = null): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->json($metodo, '/api'.$url, $dados, $token ? ['Authorization' => 'Bearer '.$token] : []);
    }

    private function administrador(): string
    {
        return Usuario::factory()->administrador()->create()->createToken('teste')->plainTextToken;
    }

    private function retirada(EquipamentosModel $equipamento, Usuario $usuario): array
    {
        return ['id_equipamento' => $equipamento->id, 'id_usuario' => $usuario->id, 'previsto_para' => today()->addWeek()->toDateString()];
    }

    public function test_retirada_transferencia_devolucao_preservam_datas_e_operadores(): void
    {
        $token = $this->administrador();
        $equipamento = EquipamentosModel::factory()->create();
        $usuario = Usuario::factory()->create();
        $outro = Usuario::factory()->create();
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($equipamento, $usuario), $token)->assertOk();
        $primeiro = VinculoModel::firstOrFail();
        $this->assertNotNull($primeiro->retirado_em);
        $this->assertNotNull($primeiro->retirado_por);
        $this->assertDatabaseHas('equipamentos', ['id' => $equipamento->id, 'status' => 'Em uso']);
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($equipamento, $outro), $token)->assertUnprocessable();
        $this->requisitar('POST', '/vincular_equipamento', [...$this->retirada($equipamento, $outro), 'substituir_usuario_id' => $usuario->id], $token)->assertOk();
        $this->assertNotNull($primeiro->fresh()->devolvido_em);
        $this->assertNotNull($primeiro->fresh()->devolvido_por);
        $this->assertDatabaseCount('emprestimos', 2);
        $this->assertSame(1, VinculoModel::whereNotNull('equipamento_ativo_id')->count());
        $this->requisitar('POST', '/vincular_equipamento', [...$this->retirada($equipamento, $usuario), 'substituir_usuario_id' => $usuario->id], $token)->assertUnprocessable();
        $this->requisitar('POST', '/desvincular_equipamento', ['id_equipamento' => $equipamento->id], $token)->assertOk();
        $this->requisitar('POST', '/desvincular_equipamento', ['id_equipamento' => $equipamento->id], $token)->assertUnprocessable();
        $this->assertDatabaseHas('equipamentos', ['id' => $equipamento->id, 'id_usuario' => null, 'status' => 'Disponível']);
        $this->assertSame(0, VinculoModel::whereNull('devolvido_em')->count());
    }

    public function test_manutencao_e_previsao_obrigatoria_sao_validadas_no_servidor(): void
    {
        $token = $this->administrador();
        $usuario = Usuario::factory()->create();
        $manutencao = EquipamentosModel::factory()->create(['status' => 'Manutenção']);
        $disponivel = EquipamentosModel::factory()->create();
        $this->requisitar('GET', '/listar_equipamentos_disponiveis', [], $token)->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $disponivel->id);
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($manutencao, $usuario), $token)->assertUnprocessable();
        $this->requisitar('POST', '/vincular_equipamento', ['id_equipamento' => $disponivel->id, 'id_usuario' => $usuario->id], $token)->assertUnprocessable();
        $this->requisitar('POST', '/vincular_equipamento', [...$this->retirada($disponivel, $usuario), 'previsto_para' => today()->subDay()->toDateString()], $token)->assertUnprocessable();
        $this->assertDatabaseCount('emprestimos', 0);
        $this->requisitar('POST', '/cadastro_equipamento', [...$disponivel->toArray(), 'numero_serie' => 'outro', 'status' => 'Em uso'], $token)->assertUnprocessable();
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($disponivel, $usuario), $token)->assertOk();
        $this->requisitar('PUT', '/atualizar_equipamento/'.$disponivel->id, [...$disponivel->toArray(), 'status' => 'Manutenção'], $token)->assertUnprocessable();
    }

    public function test_historico_e_alertas_respeitam_o_dono_e_o_prazo(): void
    {
        $token = $this->administrador();
        $usuario = Usuario::factory()->create();
        $outro = Usuario::factory()->create();
        $equipamento = EquipamentosModel::factory()->create();
        $segundo = EquipamentosModel::factory()->create();
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($equipamento, $usuario), $token)->assertOk();
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($segundo, $outro), $token)->assertOk();
        EquipamentosModel::factory()->create(['status' => 'Manutenção']);
        $usuarioToken = $usuario->createToken('teste')->plainTextToken;
        $this->requisitar('GET', '/alertas', [], $usuarioToken)->assertJsonPath('total_atrasados', 0);
        $this->travel(8)->days();
        $this->requisitar('GET', '/emprestimos?id_usuario='.$outro->id, [], $usuarioToken)->assertJsonPath('total', 1)->assertJsonPath('data.0.id_usuario', $usuario->id);
        $this->requisitar('GET', '/alertas', [], $usuarioToken)->assertJsonPath('total_atrasados', 1)->assertJsonPath('total_manutencao', 0);
        $this->requisitar('GET', '/alertas', [], $token)->assertJsonPath('total_atrasados', 2)->assertJsonPath('total_manutencao', 1);
        $this->requisitar('POST', '/desvincular_equipamento', ['id_equipamento' => $equipamento->id], $token)->assertOk();
        $this->requisitar('GET', '/emprestimos?situacao=devolvidos', [], $usuarioToken)->assertJsonPath('total', 1);
        $this->requisitar('GET', '/alertas', [], $usuarioToken)->assertJsonPath('total_atrasados', 0);
    }

    public function test_exclusao_preserva_historico_e_revoga_sessoes_sem_perder_devolucoes(): void
    {
        $token = $this->administrador();
        $usuario = Usuario::factory()->create();
        $usuarioToken = $usuario->createToken('teste')->plainTextToken;
        $equipamento = EquipamentosModel::factory()->create();
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($equipamento, $usuario), $token)->assertOk();
        $this->requisitar('DELETE', '/usuarios/'.$usuario->id, [], $token)->assertUnprocessable();
        $this->requisitar('DELETE', '/excluir_equipamento/'.$equipamento->id, [], $token)->assertUnprocessable();
        $this->requisitar('POST', '/desvincular_equipamento', ['id_equipamento' => $equipamento->id], $token)->assertOk();
        $this->requisitar('DELETE', '/usuarios/'.$usuario->id, [], $token)->assertOk();
        $this->requisitar('DELETE', '/excluir_equipamento/'.$equipamento->id, [], $token)->assertOk();
        $this->assertSoftDeleted($usuario);
        $this->assertSoftDeleted($equipamento);
        $this->requisitar('GET', '/user', [], $usuarioToken)->assertUnauthorized();
        $this->requisitar('GET', '/emprestimos', [], $token)->assertJsonPath('data.0.usuario_nome', $usuario->nome)->assertJsonPath('data.0.equipamento_serie', $equipamento->numero_serie);
        $this->requisitar('POST', '/vincular_equipamento', $this->retirada($equipamento, $usuario), $token)->assertUnprocessable();
    }

    public function test_edicao_nao_promove_usuario_e_revoga_sessao_e_reset_antigos(): void
    {
        $admin = $this->administrador();
        $usuario = Usuario::factory()->create();
        $token = $usuario->createToken('teste')->plainTextToken;
        Password::createToken($usuario);
        $dados = ['nome' => 'Nome editado', 'email' => 'novo@example.com', 'cpf' => '12345678901', 'data_nascimento' => '2000-01-01', 'is_admin' => true, 'senha' => 'senha-injetada'];
        $this->requisitar('PUT', '/usuarios/'.$usuario->id, $dados, $token)->assertForbidden();
        $this->requisitar('PUT', '/usuarios/'.$usuario->id, $dados, $admin)->assertOk();
        $this->assertFalse($usuario->fresh()->is_admin);
        $this->assertSame(md5('senha-teste'), $usuario->fresh()->senha);
        $this->assertDatabaseCount('password_reset_tokens', 0);
        $this->requisitar('GET', '/user', [], $token)->assertUnauthorized();
        $this->requisitar('DELETE', '/usuarios/'.Usuario::where('is_admin', true)->first()->id, [], $admin)->assertUnprocessable();
    }

    public function test_login_migra_md5_e_novas_senhas_usam_hash_seguro(): void
    {
        $usuario = Usuario::factory()->create();
        $this->requisitar('POST', '/login', ['email' => $usuario->email, 'senha' => 'errada'])->assertUnauthorized();
        $this->assertSame(md5('senha-teste'), $usuario->fresh()->senha);
        $this->requisitar('POST', '/login', ['email' => $usuario->email, 'senha' => 'senha-teste'])->assertOk();
        $this->assertTrue(Hash::check('senha-teste', $usuario->fresh()->senha));
        $this->assertNotSame(md5('senha-teste'), $usuario->fresh()->senha);
        $this->requisitar('POST', '/login', ['email' => $usuario->email, 'senha' => 'senha-teste'])->assertOk();
    }

    public function test_cadastro_rejeita_senha_fraca_e_senha_que_seria_truncada(): void
    {
        $admin = $this->administrador();
        $dados = ['nome' => 'Teste', 'email' => 'teste@example.com', 'cpf' => '12345678901', 'data_nascimento' => '2000-01-01'];
        $this->requisitar('POST', '/cadastro_usuario', [...$dados, 'senha' => '123456'], $admin)->assertUnprocessable()->assertJsonValidationErrors('senha');
        $this->requisitar('POST', '/cadastro_usuario', [...$dados, 'senha' => ['valor-invalido']], $admin)->assertUnprocessable()->assertJsonValidationErrors('senha');
        $this->requisitar('POST', '/cadastro_usuario', [...$dados, 'senha' => str_repeat('á', 36).'A1'], $admin)->assertUnprocessable()->assertJsonValidationErrors('senha');
        $this->assertDatabaseMissing('usuario', ['email' => $dados['email']]);
    }

    public function test_alterar_senha_exige_atual_confirma_nova_e_revoga_todos_os_tokens(): void
    {
        $usuario = Usuario::factory()->create();
        $token = $usuario->createToken('teste')->plainTextToken;
        $outro = $usuario->createToken('outro')->plainTextToken;
        $dados = ['senha_atual' => 'errada', 'password' => 'Nova-senha-1234', 'password_confirmation' => 'Nova-senha-1234'];
        $this->requisitar('PUT', '/minha_senha', $dados, $token)->assertUnprocessable();
        $this->requisitar('PUT', '/minha_senha', [...$dados, 'senha_atual' => 'senha-teste', 'password_confirmation' => 'outra'], $token)->assertUnprocessable();
        $this->requisitar('PUT', '/minha_senha', [...$dados, 'senha_atual' => 'senha-teste'], $token)->assertOk();
        $this->assertTrue(Hash::check('Nova-senha-1234', $usuario->fresh()->senha));
        $this->requisitar('GET', '/user', [], $token)->assertUnauthorized();
        $this->requisitar('GET', '/user', [], $outro)->assertUnauthorized();
    }

    public function test_recuperacao_nao_revela_contas_e_token_expira_e_so_funciona_uma_vez(): void
    {
        Notification::fake();
        $usuario = Usuario::factory()->create();
        $sessao = $usuario->createToken('teste')->plainTextToken;
        $conhecido = $this->requisitar('POST', '/recuperar_senha', ['email' => $usuario->email])->assertOk();
        $inexistente = $this->requisitar('POST', '/recuperar_senha', ['email' => 'ausente@example.com'])->assertOk();
        $this->assertSame($conhecido->json(), $inexistente->json());
        $token = '';
        Notification::assertSentTo($usuario, ResetPassword::class, function (ResetPassword $notification) use (&$token, $usuario) {
            $token = $notification->token;
            $url = $notification->toMail($usuario)->actionUrl;
            $this->assertStringContainsString('/redefinir-senha?', $url);

            return true;
        });
        $this->assertNotSame($token, DB::table('password_reset_tokens')->value('token'));
        $dados = ['email' => $usuario->email, 'token' => 'invalido', 'password' => 'Nova-senha-1234', 'password_confirmation' => 'Nova-senha-1234'];
        $this->requisitar('POST', '/redefinir_senha', $dados)->assertUnprocessable();
        $this->requisitar('POST', '/redefinir_senha', [...$dados, 'token' => $token])->assertOk();
        $this->assertTrue(Hash::check($dados['password'], $usuario->fresh()->senha));
        $this->requisitar('GET', '/user', [], $sessao)->assertUnauthorized();
        $this->requisitar('POST', '/redefinir_senha', [...$dados, 'token' => $token])->assertUnprocessable();
        $expirado = Password::createToken($usuario);
        $this->travel(61)->minutes();
        $this->requisitar('POST', '/redefinir_senha', [...$dados, 'token' => $expirado])->assertUnprocessable();
    }

    public function test_dispositivo_http_tem_credencial_exclusiva_rotacionavel_e_nao_acessa_administracao(): void
    {
        $admin = $this->administrador();
        $usuario = Usuario::factory()->create()->createToken('teste')->plainTextToken;
        $equipamento = EquipamentosModel::factory()->create();
        $url = '/equipamentos/'.$equipamento->id.'/credencial';
        $this->requisitar('POST', $url, [], $usuario)->assertForbidden();
        $this->requisitar('POST', $url)->assertUnauthorized();
        $token = $this->requisitar('POST', $url, [], $admin)->assertOk()->json('token');
        $this->assertSame(hash('sha256', $token), $equipamento->fresh()->dispositivo_token_hash);
        $this->requisitar('GET', '/listar_equipamentos', [], $admin)->assertJsonMissingPath('0.dispositivo_token_hash');
        $dados = ['sensor_nome' => 'porta', 'valor_digital' => false, 'valor_analogico' => 100];
        $this->requisitar('POST', '/sensores/leituras', $dados)->assertUnauthorized();
        $this->requisitar('POST', '/sensores/leituras', $dados, $usuario)->assertUnauthorized();
        $this->requisitar('POST', '/sensores/leituras', [...$dados, 'id_equipamento' => 999], $token)->assertUnprocessable();
        $this->requisitar('POST', '/sensores/leituras', [...$dados, 'valor_digital' => 'texto'], $token)->assertUnprocessable();
        $this->requisitar('POST', '/sensores/leituras', $dados, $token)->assertCreated();
        $this->assertDatabaseHas('leituras_sensor', ['id_equipamento' => $equipamento->id, 'valor_digital' => false, 'valor_analogico' => 100]);
        $this->requisitar('GET', '/equipamentos/'.$equipamento->id.'/leituras', [], $admin)->assertJsonPath('total', 1);
        $this->requisitar('GET', '/equipamentos/'.$equipamento->id.'/leituras', [], $usuario)->assertForbidden();
        $this->requisitar('GET', '/listar_usuarios', [], $token)->assertUnauthorized();
        $novo = $this->requisitar('POST', $url, [], $admin)->assertOk()->json('token');
        $this->requisitar('POST', '/sensores/leituras', $dados, $token)->assertUnauthorized();
        $this->requisitar('POST', '/sensores/leituras', $dados, $novo)->assertCreated();
        $this->requisitar('DELETE', $url, [], $admin)->assertOk();
        $this->requisitar('POST', '/sensores/leituras', $dados, $novo)->assertUnauthorized();
    }

    public function test_migracao_importa_vinculos_sem_inventar_datas_e_operadores(): void
    {
        $usuario = Usuario::factory()->create();
        $equipamento = EquipamentosModel::factory()->create(['id_usuario' => $usuario->id]);
        $migration = require database_path('migrations/2026_10_15_111029_create_emprestimos_and_secure_devices.php');
        $migration->down();
        $migration->up();
        $this->assertDatabaseHas('emprestimos', [
            'id_equipamento' => $equipamento->id, 'id_usuario' => $usuario->id,
            'retirado_em' => null, 'retirado_por' => null, 'previsto_para' => null, 'legado' => true,
        ]);
        $this->assertDatabaseHas('equipamentos', ['id' => $equipamento->id, 'status' => 'Em uso']);
    }

    public function test_api_envia_cabecalhos_de_seguranca_e_producao_exige_https(): void
    {
        $this->requisitar('GET', '/user')->assertUnauthorized()->assertHeader('Referrer-Policy', 'no-referrer')->assertHeader('X-Content-Type-Options', 'nosniff');
        $this->app['env'] = 'production';
        $this->requisitar('POST', '/login', ['email' => 'teste@example.com', 'senha' => 'teste'])->assertStatus(400);
    }

    public function test_https_so_aceita_cabecalho_de_proxy_cadastrado(): void
    {
        $this->app['env'] = 'production';
        config(['trustedproxy.proxies' => ['192.0.2.10']]);
        $dados = ['email' => 'ausente@example.com', 'senha' => 'senha-teste'];
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.11', 'HTTP_X_FORWARDED_PROTO' => 'https'])
            ->postJson('/api/login', $dados)->assertStatus(400);
        $this->withServerVariables(['REMOTE_ADDR' => '192.0.2.10', 'HTTP_X_FORWARDED_PROTO' => 'https'])
            ->postJson('/api/login', $dados)->assertUnauthorized();
    }
}
