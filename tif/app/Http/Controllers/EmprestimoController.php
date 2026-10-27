<?php

namespace App\Http\Controllers;

use App\Models\EquipamentosModel;
use App\Models\VinculoModel;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmprestimoController extends Controller
{
    private function consulta(Request $request): Builder
    {
        return VinculoModel::query()->when(! $request->user()->is_admin,
            fn (Builder $query) => $query->where('id_usuario', $request->user()->id));
    }

    public function historico(Request $request): JsonResponse
    {
        $dados = $request->validate(['page' => 'sometimes|integer|min:1', 'situacao' => 'sometimes|in:ativos,devolvidos,atrasados']);
        $query = $this->consulta($request);
        if (($dados['situacao'] ?? '') === 'devolvidos') {
            $query->whereNotNull('devolvido_em');
        } elseif (in_array($dados['situacao'] ?? '', ['ativos', 'atrasados'])) {
            $query->whereNull('devolvido_em');
        }
        if (($dados['situacao'] ?? '') === 'atrasados') {
            $query->whereDate('previsto_para', '<', today());
        }

        return response()->json($query->orderByDesc('id')->paginate(30));
    }

    public function alertas(Request $request): JsonResponse
    {
        $atrasados = $this->consulta($request)->whereNull('devolvido_em')->whereDate('previsto_para', '<', today());
        $manutencao = EquipamentosModel::where('status', 'Manutenção');
        if (! $request->user()->is_admin) {
            $manutencao->where('id_usuario', $request->user()->id);
        }

        return response()->json([
            'atrasados' => (clone $atrasados)->orderBy('previsto_para')->limit(100)->get(),
            'total_atrasados' => $atrasados->count(),
            'manutencao' => (clone $manutencao)->limit(100)->get(),
            'total_manutencao' => $manutencao->count(),
        ]);
    }
}
