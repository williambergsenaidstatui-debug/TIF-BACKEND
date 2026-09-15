<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class EquipamentosModel extends Model
{
    use HasFactory;

    protected $table = 'equipamentos';

    protected $fillable = [
        'modelo',
        'marca',
        'numero_serie',
        'data_aquisicao', // Vírgula adicionada aqui
        'categoria',      // Duplicidade removida
        'status',
        'id_usuario', // Adicionado para referência ao usuário
    ];
}
