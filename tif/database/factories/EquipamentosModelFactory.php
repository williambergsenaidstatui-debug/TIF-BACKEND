<?php

namespace Database\Factories;

use App\Models\EquipamentosModel;
use Illuminate\Database\Eloquent\Factories\Factory;

/** @extends Factory<EquipamentosModel> */
class EquipamentosModelFactory extends Factory
{
    protected $model = EquipamentosModel::class;

    public function definition(): array
    {
        return [
            'modelo' => 'PC',
            'marca' => 'Marca',
            'numero_serie' => fake()->unique()->uuid(),
            'data_aquisicao' => '2026-01-01',
            'categoria' => 'Computador',
            'status' => 'ativo',
        ];
    }
}
