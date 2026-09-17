<?php

namespace App\Http\Controllers;

use App\Models\Usuario;
use Illuminate\Contracts\View\View;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    public function cadastro_usuario_html(): View
    {
        return view('cadastro_usuario');
    }

    public function cadastro_usuario(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'nome' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuario,email',
            'senha' => 'required|string|min:6',
            'cpf' => 'required|string|digits:11',
            'data_nascimento' => 'required|date_format:Y-m-d|before_or_equal:today',
        ]);
        $dados['senha'] = md5($dados['senha']);
        Usuario::create($dados);

        return response()->json(['erro' => 'n', 'mensagem' => 'UsuÃ¡rio cadastrado com sucesso'], 201);
    }
}

