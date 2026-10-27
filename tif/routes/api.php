<?php

use App\Http\Controllers\ContaController;
use App\Http\Controllers\EmprestimoController;
use App\Http\Controllers\EquipamentosController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\SensorController;
use App\Http\Controllers\UsuarioController;
use App\Http\Middleware\AutenticarDispositivo;
use App\Http\Middleware\EnsureAdministrador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [LoginController::class, 'login_api'])->middleware('throttle:5,1');
Route::post('/recuperar_senha', [ContaController::class, 'recuperar'])->middleware('throttle:3,1');
Route::post('/redefinir_senha', [ContaController::class, 'redefinir'])->middleware('throttle:5,1');
Route::post('/sensores/leituras', [SensorController::class, 'receber'])->middleware(['throttle:120,1', AutenticarDispositivo::class]);

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/meus_equipamentos', [EquipamentosController::class, 'meus_equipamentos']);
    Route::get('/emprestimos', [EmprestimoController::class, 'historico']);
    Route::get('/alertas', [EmprestimoController::class, 'alertas']);
    Route::put('/minha_senha', [ContaController::class, 'alterarSenha'])->middleware('throttle:5,1');

    Route::middleware(EnsureAdministrador::class)->group(function () {
        Route::get('/listar_usuarios', [UsuarioController::class, 'listar_usuarios']);
        Route::post('/cadastro_usuario', [UsuarioController::class, 'cadastro_usuario']);
        Route::put('/usuarios/{id}', [UsuarioController::class, 'atualizar'])->whereNumber('id');
        Route::delete('/usuarios/{id}', [UsuarioController::class, 'excluir'])->whereNumber('id');
        Route::post('/equipamentos/{id}/credencial', [SensorController::class, 'credencial'])->whereNumber('id')->middleware('throttle:10,1');
        Route::delete('/equipamentos/{id}/credencial', [SensorController::class, 'revogar'])->whereNumber('id');
        Route::get('/equipamentos/{id}/leituras', [SensorController::class, 'leituras'])->whereNumber('id');
        Route::post('/cadastro_equipamento', [EquipamentosController::class, 'cadastro_equipamento']);
        Route::get('/listar_equipamentos', [EquipamentosController::class, 'listar_equipamentos']);
        Route::put('/atualizar_equipamento/{id}', [EquipamentosController::class, 'atualizar_equipamento'])->whereNumber('id');
        Route::delete('/excluir_equipamento/{id}', [EquipamentosController::class, 'deletar_equipamento'])->whereNumber('id');
        Route::get('/buscar_equipamento/{id}', [EquipamentosController::class, 'buscar_equipamento'])->whereNumber('id');
        Route::get('/buscar_equipamento_por_numero_serie/{numero_serie}', [EquipamentosController::class, 'buscar_equipamento_por_numero_serie']);
        Route::post('/vincular_equipamento', [EquipamentosController::class, 'vincular_equipamento_usuario']);
        Route::post('/desvincular_equipamento', [EquipamentosController::class, 'desvincular_equipamento_usuario']);
        Route::get('/listar_equipamentos_por_usuario/{id_usuario}', [EquipamentosController::class, 'listar_equipamentos_usuario'])->whereNumber('id_usuario');
        Route::get('/listar_equipamentos_disponiveis', [EquipamentosController::class, 'listar_equipamentos_disponiveis']);
    });
});
