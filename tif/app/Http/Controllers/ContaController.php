<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\Senhas;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class ContaController extends Controller
{
    public function recuperar(Request $request): JsonResponse
    {
        $dados = $request->validate(['email' => 'required|email|max:255']);
        Password::sendResetLink($dados);

        return response()->json(['mensagem' => 'Se o e-mail estiver cadastrado, você receberá um link de recuperação.']);
    }

    public function redefinir(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'email' => 'required|email|max:255',
            'token' => 'required|string|max:255',
            'password' => ['required', 'string', 'confirmed', ...Senhas::regras()],
        ]);
        $resultado = DB::transaction(function () use ($dados) {
            Usuario::where('email', $dados['email'])->lockForUpdate()->first();

            return Password::reset($dados, function (Usuario $usuario, string $senha) {
                Senhas::atualizar($usuario, $senha);
                $usuario->tokens()->delete();
                event(new PasswordReset($usuario));
            });
        }, 3);
        if ($resultado !== Password::PASSWORD_RESET) {
            throw ValidationException::withMessages(['token' => 'Link inválido ou expirado. Solicite outra recuperação.']);
        }

        return response()->json(['mensagem' => 'Senha redefinida. Entre novamente.']);
    }

    public function alterarSenha(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'senha_atual' => 'required|string',
            'password' => ['required', 'string', 'confirmed', 'different:senha_atual', ...Senhas::regras()],
        ]);
        DB::transaction(function () use ($request, $dados) {
            $usuario = Usuario::lockForUpdate()->findOrFail($request->user()->id);
            if (! Senhas::confere($usuario, $dados['senha_atual'])) {
                throw ValidationException::withMessages(['senha_atual' => 'Senha atual incorreta.']);
            }
            Senhas::atualizar($usuario, $dados['password']);
            $usuario->tokens()->delete();
            DB::table('password_reset_tokens')->where('email', $usuario->email)->delete();
        });

        return response()->json(['mensagem' => 'Senha alterada. Entre novamente em seus dispositivos.']);
    }
}
