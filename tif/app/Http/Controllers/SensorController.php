<?php

namespace App\Http\Controllers;

use App\Models\EquipamentosModel;
use App\Models\SensorLeitura;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SensorController extends Controller
{
    public function credencial(int $id): JsonResponse
    {
        $token = bin2hex(random_bytes(32));
        $equipamento = EquipamentosModel::findOrFail($id);
        $equipamento->dispositivo_token_hash = hash('sha256', $token);
        $equipamento->save();

        return response()->json(['token' => $token, 'mensagem' => 'Guarde a credencial no dispositivo. A credencial anterior foi revogada.']);
    }

    public function revogar(int $id): JsonResponse
    {
        $equipamento = EquipamentosModel::findOrFail($id);
        $equipamento->dispositivo_token_hash = null;
        $equipamento->save();

        return response()->json(['mensagem' => 'Credencial revogada.']);
    }

    public function receber(Request $request): JsonResponse
    {
        $dados = $request->validate([
            'sensor_nome' => 'required|string|max:50',
            'valor_digital' => 'required|boolean',
            'valor_analogico' => 'nullable|integer|min:0|max:65535',
            'id_equipamento' => 'prohibited',
        ]);
        $leitura = SensorLeitura::create([
            ...$dados, 'id_equipamento' => $request->attributes->get('equipamento')->id,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        return response()->json(['id' => $leitura->id, 'mensagem' => 'Leitura recebida.'], 201);
    }

    public function leituras(Request $request, int $id): JsonResponse
    {
        $request->validate(['page' => 'sometimes|integer|min:1']);
        EquipamentosModel::findOrFail($id);

        return response()->json(DB::table('leituras_sensor')->where('id_equipamento', $id)->orderByDesc('id')->paginate(30));
    }
}
