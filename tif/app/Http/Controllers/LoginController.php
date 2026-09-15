<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LoginController extends Controller
{
    public function login_html(): View
    {
        return view('Login');
    }

    public function login_api(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'email' => 'required|string|email|max:255',
            'senha' => 'required|string',
        ]);
        $usuario = Usuario::where('email', $dados['email'])->first();

        if (! $usuario || ! hash_equals($usuario->senha, md5($dados['senha']))) {
            return response()->json(['erro' => 's', 'mensagem' => 'Email ou senha inválidos'], 401);
        }

        $expiraEm = now()->addDays(2);
        $token = DB::transaction(function () use ($usuario, $expiraEm): string {
            $usuario->tokens()->delete();

            return $usuario->createToken('login', ['*'], $expiraEm)->plainTextToken;
        });

        return response()->json([
            'erro' => 'n',
            'mensagem' => 'Login realizado com sucesso',
            'token' => $token,
            'token_type' => 'Bearer',
            'expires_at' => $expiraEm->toIso8601String(),
            'usuario' => $usuario,
        ]);
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['erro' => 'n', 'mensagem' => 'Logout realizado com sucesso']);
    }
}
