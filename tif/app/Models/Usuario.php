<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class Usuario extends Authenticatable
{
    use HasApiTokens, HasFactory;

    protected $table = 'usuario';

    protected $hidden = ['senha'];

    protected function casts(): array
    {
        return ['is_admin' => 'boolean'];
    }

    protected $fillable = [
        'nome',
        'email',
        'senha',
        'data_nascimento',
        'cpf',
    ];
}
