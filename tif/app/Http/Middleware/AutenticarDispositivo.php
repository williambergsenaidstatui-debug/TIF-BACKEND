<?php

namespace App\Http\Middleware;

use App\Models\EquipamentosModel;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class AutenticarDispositivo
{
    public function handle(Request $request, Closure $next): Response
    {
        $token = $request->bearerToken();
        abort_unless(is_string($token) && strlen($token) === 64, 401, 'Credencial do dispositivo inválida.');
        $equipamento = EquipamentosModel::where('dispositivo_token_hash', hash('sha256', $token))->first();
        abort_unless($equipamento, 401, 'Credencial do dispositivo inválida.');
        $request->attributes->set('equipamento', $equipamento);

        return $next($request);
    }
}
