<?php

use Illuminate\Support\Facades\Route;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

$frontend = function (): BinaryFileResponse {
    $frontend = public_path('frontend/index.html');

    abort_unless(is_file($frontend), 503, 'Compile o frontend com npm run build:web em projeto-final/projeto-final.');

    return response()->file($frontend, ['Cache-Control' => 'no-cache']);
};

Route::get('/login', $frontend)->name('login');
Route::get('/{pagina?}', $frontend)
    ->where('pagina', 'dashboard|usuarios|computadores|cadastro_usuario')
    ->name('frontend');
