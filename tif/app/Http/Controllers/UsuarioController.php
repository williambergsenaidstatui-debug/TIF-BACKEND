<?php

namespace App\Http\Controllers;

use App\Models\EquipamentosModel;
use App\Models\Usuario;
use App\Models\VinculoModel;
use App\Services\Senhas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class UsuarioController extends Controller
{
    public function listar_usuarios(): JsonResponse
    {
        return response()->json(Usuario::orderBy('nome')->get());
    }

    public function cadastro_usuario(Request $request): JsonResponse
    {
        $dados = $request->validate($this->regras());
        $dados['senha'] = Hash::make($dados['senha']);
        Usuario::create($dados);

        return response()->json(['mensagem' => 'Usuário cadastrado com sucesso'], 201);
    }

    public function atualizar(Request $request, int $id): JsonResponse
    {
        $usuario = Usuario::findOrFail($id);
        $emailAnterior = $usuario->email;
        $dados = $request->validate($this->regras($usuario));
        DB::transaction(function () use ($usuario, $dados, $emailAnterior) {
            $usuario->update($dados);
            $usuario->tokens()->delete();
            DB::table('password_reset_tokens')->whereIn('email', [$emailAnterior, $usuario->email])->delete();
        });

        return response()->json(['mensagem' => 'Usuário atualizado. As sessões anteriores foram encerradas.']);
    }

    public function excluir(Request $request, int $id): JsonResponse
    {
        abort_if($id === $request->user()->id, 422, 'Você não pode excluir sua própria conta.');
        DB::transaction(function () use ($id) {
            $usuario = Usuario::lockForUpdate()->findOrFail($id);
            if ($usuario->is_admin) {
                throw ValidationException::withMessages(['usuario' => 'Contas administrativas não podem ser excluídas por esta operação.']);
            }
            if (EquipamentosModel::where('id_usuario', $id)->exists() || VinculoModel::where('id_usuario', $id)->whereNull('devolvido_em')->exists()) {
                throw ValidationException::withMessages(['usuario' => 'Registre todas as devoluções antes de excluir o usuário.']);
            }
            $usuario->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $usuario->email)->delete();
            $usuario->delete();
        });

        return response()->json(['mensagem' => 'Usuário excluído. O histórico foi preservado.']);
    }

    private function regras(?Usuario $usuario = null): array
    {
        $regras = [
            'nome' => 'required|string|max:255',
            'email' => ['required', 'email', 'max:255', Rule::unique('usuario', 'email')->ignore($usuario?->id)],
            'cpf' => 'required|string|digits:11',
            'data_nascimento' => 'required|date_format:Y-m-d|before_or_equal:today',
        ];
        if (! $usuario) {
            $regras['senha'] = ['required', 'string', ...Senhas::regras()];
        }

        return $regras;
    }
}
