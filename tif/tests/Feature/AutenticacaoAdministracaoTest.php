<?php

namespace Tests\Feature;

use App\Models\EquipamentosModel;
use App\Models\Usuario;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Testing\TestResponse;
use Laravel\Sanctum\PersonalAccessToken;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class AutenticacaoAdministracaoTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_emits_a_working_sanctum_token_and_hides_password(): void
    {
        $usuario = Usuario::factory()->create();
        $response = $this->postJson('/api/login', ['email' => $usuario->email, 'senha' => 'senha-teste']);
        $response->assertOk()->assertJsonPath('token_type', 'Bearer')->assertJsonMissingPath('usuario.senha');
        $token = $response->json('token');
        $this->assertNotNull(PersonalAccessToken::findToken($token));
        $this->api('GET', '/api/user', [], $token)->assertOk()->assertJsonPath('id', $usuario->id)->assertJsonMissingPath('senha');
        $this->assertDatabaseCount('token_usuario', 0);
    }

    public function test_invalid_credentials_and_excessive_attempts_are_rejected(): void
    {
        $usuario = Usuario::factory()->create();
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/login', ['email' => $usuario->email, 'senha' => 'errada'])->assertUnauthorized();
        }
        $this->postJson('/api/login', ['email' => $usuario->email, 'senha' => 'errada'])->assertStatus(429);
        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    public function test_expired_tokens_and_logout_are_enforced(): void
    {
        $usuario = Usuario::factory()->create();
        $expirado = $usuario->createToken('expirado', ['*'], now()->subMinute())->plainTextToken;
        $this->api('GET', '/api/user', [], $expirado)->assertUnauthorized();
        $token = $usuario->createToken('ativo', ['*'], now()->addDays(2))->plainTextToken;
        $this->api('POST', '/api/logout', [], $token)->assertOk();
        $this->api('GET', '/api/user', [], $token)->assertUnauthorized();
    }

    public function test_new_login_revokes_previous_token_and_expires_after_two_days(): void
    {
        $usuario = Usuario::factory()->create();
        $anterior = $usuario->createToken('anterior')->plainTextToken;
        $response = $this->postJson('/api/login', ['email' => $usuario->email, 'senha' => 'senha-teste'])->assertOk();
        $this->api('GET', '/api/user', [], $anterior)->assertUnauthorized();
        $token = $response->json('token');
        $this->api('GET', '/api/user', [], $token)->assertOk();
        $this->travel(2)->days();
        $this->travel(1)->seconds();
        $this->api('GET', '/api/user', [], $token)->assertUnauthorized();
    }

    #[DataProvider('rotasAdministrativas')]
    public function test_management_requires_an_authenticated_administrator(string $method, string $uri): void
    {
        $this->api($method, $uri)->assertUnauthorized();
        $usuario = Usuario::factory()->create();
        $token = $usuario->createToken('usuario')->plainTextToken;
        $this->api($method, $uri, ['is_admin' => true, 'id_usuario' => $usuario->id], $token)->assertForbidden();
        $this->assertDatabaseCount('equipamentos', 0);
        $this->assertDatabaseCount('usuario', 1);
    }

    public static function rotasAdministrativas(): array
    {
        return [
            ['POST', '/api/cadastro_usuario'],
            ['POST', '/api/cadastro_equipamento'],
            ['GET', '/api/listar_equipamentos'],
            ['PUT', '/api/atualizar_equipamento/1'],
            ['DELETE', '/api/excluir_equipamento/1'],
            ['GET', '/api/buscar_equipamento/1'],
            ['GET', '/api/buscar_equipamento_por_numero_serie/serie'],
            ['POST', '/api/vincular_equipamento'],
            ['POST', '/api/desvincular_equipamento'],
            ['GET', '/api/listar_equipamentos_por_usuario/1'],
            ['GET', '/api/listar_equipamentos_disponiveis'],
        ];
    }

    public function test_admin_can_create_users_without_granting_admin_from_request(): void
    {
        $admin = Usuario::factory()->administrador()->create();
        $token = $admin->createToken('admin')->plainTextToken;
        $dados = [
            'nome' => 'Usuario',
            'email' => 'usuario@example.com',
            'senha' => 'senha-teste',
            'cpf' => '12345678901',
            'data_nascimento' => '2000-01-01',
            'is_admin' => true,
        ];
        $this->api('POST', '/api/cadastro_usuario', $dados, $token)->assertCreated();
        $this->assertDatabaseHas('usuario', ['email' => $dados['email'], 'is_admin' => false, 'senha' => md5('senha-teste')]);
        $this->api('POST', '/api/cadastro_usuario', $dados, $token)->assertUnprocessable()->assertJsonValidationErrors('email');
    }

    public function test_admin_can_manage_equipment_and_links(): void
    {
        $admin = Usuario::factory()->administrador()->create();
        $usuario = Usuario::factory()->create();
        $token = $admin->createToken('admin')->plainTextToken;
        $dados = EquipamentosModel::factory()->make()->toArray();
        $this->api('POST', '/api/cadastro_equipamento', $dados, $token)->assertCreated();
        $equipamento = EquipamentosModel::firstOrFail();
        $this->api('PUT', '/api/atualizar_equipamento/'.$equipamento->id, [...$dados, 'modelo' => 'Novo'], $token)->assertOk();
        $this->api('GET', '/api/buscar_equipamento/'.$equipamento->id, [], $token)->assertOk()->assertJsonPath('modelo', 'Novo');
        $this->api('GET', '/api/buscar_equipamento_por_numero_serie/'.$equipamento->numero_serie, [], $token)->assertOk();
        $this->api('POST', '/api/vincular_equipamento', ['id_usuario' => $usuario->id, 'id_equipamento' => $equipamento->id], $token)->assertOk();
        $this->assertDatabaseHas('equipamentos', ['id' => $equipamento->id, 'id_usuario' => $usuario->id]);
        $this->api('GET', '/api/listar_equipamentos_disponiveis', [], $token)->assertOk()->assertJsonCount(0);
        $this->api('GET', '/api/listar_equipamentos_por_usuario/'.$usuario->id, [], $token)->assertOk()->assertJsonCount(1);
        $this->api('POST', '/api/desvincular_equipamento', ['id_equipamento' => $equipamento->id], $token)->assertOk();
        $this->assertDatabaseHas('equipamentos', ['id' => $equipamento->id, 'id_usuario' => null]);
        $this->api('DELETE', '/api/excluir_equipamento/'.$equipamento->id, [], $token)->assertOk();
        $this->assertDatabaseCount('equipamentos', 0);
    }

    public function test_invalid_links_are_rejected_and_user_only_sees_own_equipment(): void
    {
        $usuario = Usuario::factory()->create();
        $outro = Usuario::factory()->create();
        $admin = Usuario::factory()->administrador()->create();
        $proprio = EquipamentosModel::factory()->create(['id_usuario' => $usuario->id]);
        EquipamentosModel::factory()->create(['id_usuario' => $outro->id]);
        EquipamentosModel::factory()->create();
        $token = $usuario->createToken('usuario')->plainTextToken;
        $this->api('GET', '/api/meus_equipamentos?id_usuario='.$outro->id, [], $token)->assertOk()->assertJsonCount(1)->assertJsonPath('0.id', $proprio->id);
        $adminToken = $admin->createToken('admin')->plainTextToken;
        $this->api('POST', '/api/vincular_equipamento', ['id_usuario' => 999999, 'id_equipamento' => $proprio->id], $adminToken)->assertUnprocessable();
        $this->assertDatabaseHas('equipamentos', ['id' => $proprio->id, 'id_usuario' => $usuario->id]);
        $usuario->delete();
        $this->assertDatabaseHas('equipamentos', ['id' => $proprio->id, 'id_usuario' => null]);
    }

    public function test_administrator_can_be_created_from_terminal(): void
    {
        $this->artisan('admin:criar')
            ->expectsQuestion('Nome', 'Administrador')
            ->expectsQuestion('Email', 'admin@example.com')
            ->expectsQuestion('Senha (mínimo de 6 caracteres)', 'senha-teste')
            ->expectsQuestion('Data de nascimento (AAAA-MM-DD)', '2000-01-01')
            ->expectsQuestion('CPF (11 dígitos)', '12345678901')
            ->expectsOutput('Administrador criado com sucesso.')
            ->assertSuccessful();
        $this->assertDatabaseHas('usuario', ['email' => 'admin@example.com', 'is_admin' => true]);
    }

    private function api(string $method, string $uri, array $dados = [], ?string $token = null): TestResponse
    {
        $this->app['auth']->forgetGuards();

        return $this->json($method, $uri, $dados, $token ? ['Authorization' => 'Bearer '.$token] : []);
    }
}
