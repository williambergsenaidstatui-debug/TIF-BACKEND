<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Usuario;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Usuario::updateOrCreate(
            ['email' => 'admin@verify.com'],
            [
                'nome' => 'Administrador',
                'senha' => md5('123456'),
                'cpf' => '00000000000',
                'data_nascimento' => '2000-01-01',
                'is_admin' => true,
            ]
        );
    }
}