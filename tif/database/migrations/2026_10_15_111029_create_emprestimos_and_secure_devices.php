<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('usuario', fn (Blueprint $table) => $table->softDeletes());
        Schema::table('equipamentos', function (Blueprint $table) {
            $table->softDeletes();
            $table->string('dispositivo_token_hash', 64)->nullable()->unique();
        });
        Schema::create('emprestimos', function (Blueprint $table) {
            $table->id();
            $table->foreignId('id_equipamento')->constrained('equipamentos')->restrictOnDelete();
            $table->foreignId('id_usuario')->constrained('usuario')->restrictOnDelete();
            $table->foreignId('equipamento_ativo_id')->nullable()->unique()->constrained('equipamentos')->restrictOnDelete();
            $table->foreignId('retirado_por')->nullable()->constrained('usuario')->restrictOnDelete();
            $table->foreignId('devolvido_por')->nullable()->constrained('usuario')->restrictOnDelete();
            $table->string('usuario_nome');
            $table->string('equipamento_serie');
            $table->string('operador_retirada')->nullable();
            $table->string('operador_devolucao')->nullable();
            $table->timestamp('retirado_em')->nullable();
            $table->date('previsto_para')->nullable();
            $table->timestamp('devolvido_em')->nullable();
            $table->boolean('legado')->default(false);
            $table->timestamps();
            $table->index(['id_usuario', 'devolvido_em']);
            $table->index(['devolvido_em', 'previsto_para']);
        });
        Schema::table('leituras_sensor', fn (Blueprint $table) => $table->foreignId('id_equipamento')->nullable()->constrained('equipamentos')->restrictOnDelete());

        // Não inventa datas nem operadores dos vínculos anteriores.
        DB::table('equipamentos')->whereNotNull('id_usuario')->orderBy('id')->each(function (object $equipamento) {
            DB::table('emprestimos')->insert([
                'id_equipamento' => $equipamento->id, 'equipamento_ativo_id' => $equipamento->id,
                'id_usuario' => $equipamento->id_usuario,
                'usuario_nome' => DB::table('usuario')->where('id', $equipamento->id_usuario)->value('nome'),
                'equipamento_serie' => $equipamento->numero_serie, 'legado' => true,
                'created_at' => now(), 'updated_at' => now(),
            ]);
        });
        DB::table('equipamentos')->whereNotNull('id_usuario')->update(['status' => 'Em uso']);
        DB::table('equipamentos')->whereNull('id_usuario')->whereIn('status', ['ativo', 'Ativo', 'Em uso'])->update(['status' => 'Disponível']);
    }

    public function down(): void
    {
        Schema::table('leituras_sensor', fn (Blueprint $table) => $table->dropConstrainedForeignId('id_equipamento'));
        Schema::dropIfExists('emprestimos');
        Schema::table('equipamentos', function (Blueprint $table) {
            $table->dropUnique(['dispositivo_token_hash']);
            $table->dropColumn('dispositivo_token_hash');
            $table->dropSoftDeletes();
        });
        Schema::table('usuario', fn (Blueprint $table) => $table->dropSoftDeletes());
    }
};
