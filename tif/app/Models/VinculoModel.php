<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class VinculoModel extends Model
{
    protected $table = 'emprestimos';

    protected $guarded = ['id'];

    protected function casts(): array
    {
        return ['retirado_em' => 'datetime', 'previsto_para' => 'date', 'devolvido_em' => 'datetime', 'legado' => 'boolean'];
    }
}
