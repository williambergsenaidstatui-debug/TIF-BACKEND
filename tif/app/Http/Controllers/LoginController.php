<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use App\Services\Senhas;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class LoginController extends Controller
{
    public function login_api(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'email' => 'required|string|email|max:255',
            'senha' => 'required|string|max:4096',
        ]);
        $expiraEm = now()->addDays(2);
        $resultado = DB::transaction(function () use ($dados, $expiraEm): ?array {
            $usuario = Usuario::where('email', $dados['email'])->lockForUpdate()->first();
            if (! $usuario || ! Senhas::confere($usuario, $dados['senha'])) {
                return null;
            }
            if (preg_match('/^[a-f0-9]{32}$/i', $usuario->senha) || Hash::needsRehash($usuario->senha)) {
                Senhas::atualizar($usuario, $dados['senha']);
            }
            $usuario->tokens()->delete();

            return ['usuario' => $usuario, 'token' => $usuario->createToken('login', ['*'], $expiraEm)->plainTextToken];
        }, 3);
        if (! $resultado) {
            return response()->json(['erro' => 's', 'mensagem' => 'Email ou senha inválidos'], 401);
        }

        return response()->json([
            'erro' => 'n', 'mensagem' => 'Login realizado com sucesso',
            ...$resultado, 'token_type' => 'Bearer', 'expires_at' => $expiraEm->toIso8601String(),
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['erro' => 'n', 'mensagem' => 'Logout realizado com sucesso']);
    }
}
