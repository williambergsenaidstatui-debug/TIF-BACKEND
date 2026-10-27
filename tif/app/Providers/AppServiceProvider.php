<?php

namespace App\Providers;

use App\Models\Usuario;
use Illuminate\Auth\Notifications\ResetPassword;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        ResetPassword::createUrlUsing(
            fn (Usuario $usuario, string $token): string => rtrim(config('app.url'), '/').'/redefinir-senha?'.http_build_query(['token' => $token, 'email' => $usuario->email])
        );
    }
}
