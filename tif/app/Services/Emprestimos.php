<?php

namespace App\Services;

use App\Models\EquipamentosModel;
use App\Models\Usuario;
use App\Models\VinculoModel;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class Emprestimos
{
    public function retirar(array $dados, Usuario $operador): void
    {
        DB::transaction(function () use ($dados, $operador) {
            $equipamento = EquipamentosModel::lockForUpdate()->findOrFail($dados['id_equipamento']);
            $usuario = Usuario::lockForUpdate()->findOrFail($dados['id_usuario']);
            $atual = VinculoModel::where('equipamento_ativo_id', $equipamento->id)->lockForUpdate()->first();
            if ($equipamento->status === 'Manutenção') {
                throw ValidationException::withMessages(['id_equipamento' => 'Equipamento em manutenção não pode ser emprestado.']);
            }
            if ($equipamento->id_usuario !== null) {
                if (! $atual || (int) ($dados['substituir_usuario_id'] ?? 0) !== (int) $equipamento->id_usuario || $usuario->id === $equipamento->id_usuario) {
                    throw ValidationException::withMessages(['id_equipamento' => 'O responsável mudou ou já possui este equipamento. Atualize a lista e confirme a transferência.']);
                }
                $this->encerrar($atual, $operador);
            } elseif ($equipamento->status !== 'Disponível' || $atual) {
                throw ValidationException::withMessages(['id_equipamento' => 'Equipamento indisponível para empréstimo.']);
            }
            VinculoModel::create([
                'id_equipamento' => $equipamento->id, 'equipamento_ativo_id' => $equipamento->id,
                'id_usuario' => $usuario->id, 'usuario_nome' => $usuario->nome,
                'equipamento_serie' => $equipamento->numero_serie,
                'retirado_por' => $operador->id, 'operador_retirada' => $operador->nome,
                'retirado_em' => now(), 'previsto_para' => $dados['previsto_para'],
            ]);
            $equipamento->update(['id_usuario' => $usuario->id, 'status' => 'Em uso']);
        }, 3);
    }

    public function devolver(int $id, Usuario $operador): void
    {
        DB::transaction(function () use ($id, $operador) {
            $equipamento = EquipamentosModel::lockForUpdate()->findOrFail($id);
            $atual = VinculoModel::where('equipamento_ativo_id', $id)->lockForUpdate()->first();
            if (! $atual || $equipamento->id_usuario === null) {
                throw ValidationException::withMessages(['id_equipamento' => 'Não há empréstimo ativo para devolver.']);
            }
            $this->encerrar($atual, $operador);
            $equipamento->update(['id_usuario' => null, 'status' => 'Disponível']);
        }, 3);
    }

    private function encerrar(VinculoModel $emprestimo, Usuario $operador): void
    {
        $emprestimo->update([
            'equipamento_ativo_id' => null, 'devolvido_em' => now(),
            'devolvido_por' => $operador->id, 'operador_devolucao' => $operador->nome,
        ]);
    }
}
