<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('equipamentos', function (Blueprint $table) {
            $table->string('modelo');
            $table->string('marca');
            $table->string('numero_serie')->unique();
            $table->date('data_aquisicao');
            $table->string('categoria');
            $table->string('status');
            $table->timestamps();
            $table->id();

        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('equipamentos');
    }
};
