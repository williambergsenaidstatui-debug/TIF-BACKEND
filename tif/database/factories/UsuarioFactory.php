<?php

namespace Database\Factories;

use App\Models\Usuario;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<Usuario> */
class UsuarioFactory extends Factory
{
    protected $model = Usuario::class;

    public function definition(): array
    {
        return [
            'nome' => fake()->name(),
            'email' => fake()->unique()->safeEmail(),
            'senha' => md5('senha-teste'),
            'data_nascimento' => '2000-01-01',
            'cpf' => fake()->numerify('###########'),
            'is_admin' => false,
        ];
    }

    public function administrador(): static
    {
        return $this->state(fn (array $attributes): array => ['is_admin' => true]);
    }
}
