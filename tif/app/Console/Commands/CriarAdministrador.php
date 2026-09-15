<?php

namespace App\Console\Commands;

use App\Models\Usuario;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Validator;

class CriarAdministrador extends Command
{
    protected $signature = 'admin:criar';

    protected $description = 'Cria um administrador pelo terminal do servidor';

    public function handle(): int
    {
        $dados = [
            'nome' => $this->ask('Nome'),
            'email' => $this->ask('Email'),
            'senha' => $this->secret('Senha (mínimo de 6 caracteres)'),
            'data_nascimento' => $this->ask('Data de nascimento (AAAA-MM-DD)'),
            'cpf' => $this->ask('CPF (11 dígitos)'),
        ];

        $validador = Validator::make($dados, [
            'nome' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:usuario,email',
            'senha' => 'required|string|min:6',
            'data_nascimento' => 'required|date_format:Y-m-d|before_or_equal:today',
            'cpf' => 'required|string|digits:11',
        ]);

        if ($validador->fails()) {
            foreach ($validador->errors()->all() as $erro) {
                $this->error($erro);
            }

            return self::FAILURE;
        }

        $dados['senha'] = md5($dados['senha']);
        $usuario = new Usuario($dados);
        $usuario->is_admin = true;
        $usuario->save();

        $this->info('Administrador criado com sucesso.');

        return self::SUCCESS;
    }
}
