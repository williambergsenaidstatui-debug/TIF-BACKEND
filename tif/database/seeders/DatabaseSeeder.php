<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        $this->command?->info('Crie o administrador com php artisan admin:criar. Nenhuma senha padrão é cadastrada.');
    }
}
