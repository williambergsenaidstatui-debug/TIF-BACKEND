<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sensor extends Model
{
    // Vincula a Model à tabela exata criada na sua migration
    protected $table = 'leituras_sensor';

    protected $fillable = [
        'sensor_nome',
        'valor_digital',
        'valor_analogico',
    ];

    // Garante que o PHP entenda o 0 e 1 do banco como true/false
    protected $casts = [
        'valor_digital' => 'boolean',
        'valor_analogico' => 'integer',
    ];
}
