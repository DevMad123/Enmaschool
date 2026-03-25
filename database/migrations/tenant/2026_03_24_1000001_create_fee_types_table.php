<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 10 — Frais scolaires
// fee_types : catégories de frais configurées une fois, réutilisées chaque année.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_types', function (Blueprint $table): void {
            $table->id();
            $table->string('name', 150);
            $table->string('code', 20)->unique();         // 'SCOLARITE', 'INSCRIPTION', ...
            $table->text('description')->nullable();
            $table->boolean('is_mandatory')->default(true);
            // true  = obligatoire pour tous les élèves
            // false = optionnel (cantine, transport...)
            $table->boolean('is_recurring')->default(true);
            // true  = facturé chaque année
            // false = ponctuel (tenue scolaire, droit d'examen...)
            $table->enum('applies_to', ['all', 'maternelle', 'primaire', 'college', 'lycee'])
                  ->default('all');
            $table->unsignedSmallInteger('order')->default(0);
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index('is_mandatory');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_types');
    }
};
