<?php

namespace App\Http\Controllers;

use App\Models\EquipamentosModel;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class EquipamentosController extends Controller
{
    public function cadastro_equipamento(Request $request): JsonResponse
    {
        EquipamentosModel::create($request->validate($this->regras()));

        return response()->json(['erro' => 'n', 'mensagem' => 'Equipamento cadastrado com sucesso'], 201);
    }

    public function listar_equipamentos(): JsonResponse
    {
        return response()->json(EquipamentosModel::all());
    }

    public function atualizar_equipamento(Request $request, int $id): JsonResponse
    {
        $equipamento = EquipamentosModel::findOrFail($id);
        $equipamento->update($request->validate($this->regras($equipamento)));

        return response()->json(['erro' => 'n', 'mensagem' => 'Equipamento atualizado com sucesso']);
    }

    public function deletar_equipamento(int $id): JsonResponse
    {
        EquipamentosModel::findOrFail($id)->delete();

        return response()->json(['erro' => 'n', 'mensagem' => 'Equipamento deletado com sucesso']);
    }

    public function vincular_equipamento_usuario(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'id_usuario' => 'required|integer|exists:usuario,id',
            'id_equipamento' => 'required|integer|exists:equipamentos,id',
        ]);
        $equipamento = EquipamentosModel::findOrFail($dados['id_equipamento']);
        $equipamento->id_usuario = $dados['id_usuario'];
        $equipamento->save();

        return response()->json(['erro' => 'n', 'mensagem' => 'Equipamento vinculado ao usuário com sucesso']);
    }

    public function desvincular_equipamento_usuario(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'id_equipamento' => 'required|integer|exists:equipamentos,id',
        ]);
        $equipamento = EquipamentosModel::findOrFail($dados['id_equipamento']);
        $equipamento->id_usuario = null;
        $equipamento->save();

        return response()->json(['erro' => 'n', 'mensagem' => 'Equipamento desvinculado do usuário com sucesso']);
    }

    public function listar_equipamentos_usuario(int $id_usuario): JsonResponse
    {
        return response()->json(EquipamentosModel::where('id_usuario', $id_usuario)->get());
    }

    public function meus_equipamentos(Request $request): JsonResponse
    {
        return $this->listar_equipamentos_usuario($request->user()->id);
    }

    public function buscar_equipamento(int $id): JsonResponse
    {
        return response()->json(EquipamentosModel::findOrFail($id));
    }

    public function buscar_equipamento_por_numero_serie(string $numero_serie): JsonResponse
    {
        return response()->json(EquipamentosModel::where('numero_serie', $numero_serie)->firstOrFail());
    }

    public function listar_equipamentos_disponiveis(): JsonResponse
    {
        return response()->json(EquipamentosModel::whereNull('id_usuario')->get());
    }

    /** @return array<string, mixed> */
    private function regras(?EquipamentosModel $equipamento = null): array
    {
        $numeroSerie = Rule::unique('equipamentos', 'numero_serie');
        if ($equipamento) {
            $numeroSerie->ignore($equipamento);
        }

        return [
            'modelo' => 'required|string|max:255',
            'marca' => 'required|string|max:255',
            'categoria' => 'required|string|max:255',
            'numero_serie' => ['required', 'string', 'max:255', $numeroSerie],
            'data_aquisicao' => 'required|date_format:Y-m-d',
            'status' => 'required|string|max:255',
        ];
    }
}
