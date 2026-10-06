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
        Schema::create('leituras_sensor', function (Blueprint $table) {
            $table->id();
            $table->string('sensor_nome', 50);
            $table->boolean('valor_digital');
            $table->integer('valor_analogico')->nullable();
            $table->timestamps();

            $table->index('sensor_nome');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Deleta a tabela caso a migration seja revertida
        Schema::dropIfExists('leituras_sensor');
    }
};
