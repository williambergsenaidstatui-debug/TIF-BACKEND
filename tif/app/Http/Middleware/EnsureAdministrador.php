<?php

namespace App\Http\Middleware;

use App\Models\Usuario;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureAdministrador
{
    public function handle(Request $request, Closure $next): Response
    {
        $usuario = $request->user();
        abort_unless($usuario instanceof Usuario && $usuario->is_admin, 403, 'Acesso restrito ao administrador.');

        return $next($request);
    }
}
