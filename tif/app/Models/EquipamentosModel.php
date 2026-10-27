<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class EquipamentosModel extends Model
{
    use HasFactory, SoftDeletes;

    protected $hidden = ['dispositivo_token_hash'];

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
