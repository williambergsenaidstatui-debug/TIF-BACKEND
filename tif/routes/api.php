<?php

use App\Http\Controllers\EquipamentosController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\UsuarioController;
use App\Http\Middleware\EnsureAdministrador;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::post('/login', [LoginController::class, 'login_api'])->middleware('throttle:5,1');

Route::middleware('auth:sanctum')->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::post('/logout', [LoginController::class, 'logout']);
    Route::get('/meus_equipamentos', [EquipamentosController::class, 'meus_equipamentos']);

    Route::middleware(EnsureAdministrador::class)->group(function () {
        Route::get('/listar_usuarios', [UsuarioController::class, 'listar_usuarios']);
        Route::post('/cadastro_usuario', [UsuarioController::class, 'cadastro_usuario']);
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
