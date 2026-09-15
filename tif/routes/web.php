<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\UsuarioController;
use App\Http\Controllers\LoginController;

Route::get('/', function () {
    return view('welcome');
});
Route::get('/login', [LoginController::class, 'login_html']);

Route::get('/cadastro_usuario', [UsuarioController::class, 'cadastro_usuario_html']);