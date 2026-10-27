<?php

namespace App\Services;

use App\Models\Usuario;
use Closure;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules\Password;

class Senhas
{
    public static function regras(): array
    {
        return ['max:72', Password::min(12)->letters()->numbers(), function (string $atributo, mixed $valor, Closure $falhar): void {
            if (is_string($valor) && strlen($valor) > 72) {
                $falhar('A senha excede 72 bytes. Use menos caracteres especiais.');
            }
        }];
    }

    public static function confere(Usuario $usuario, string $senha): bool
    {
        if (strlen($senha) > 72) {
            return false;
        }
        if (preg_match('/^[a-f0-9]{32}$/i', $usuario->senha)) {
            return hash_equals(strtolower($usuario->senha), md5($senha));
        }

        return Hash::check($senha, $usuario->senha);
    }

    public static function atualizar(Usuario $usuario, string $senha): void
    {
        $usuario->senha = Hash::make($senha);
        $usuario->save();
    }
}
