<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 10 — Frais scolaires
// fee_schedules : grille tarifaire par type de frais, par niveau scolaire et par année.
// NULL school_level_id = tarif par défaut (tous les niveaux sans tarif spécifique).
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('fee_schedules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('academic_year_id')
                  ->constrained('academic_years')
                  ->cascadeOnDelete();
            $table->foreignId('fee_type_id')
                  ->constrained('fee_types')
                  ->cascadeOnDelete();
            $table->foreignId('school_level_id')
                  ->nullable()
                  ->constrained('school_levels')
                  ->nullOnDelete();
            // NULL = tarif par défaut (s'applique à tous les niveaux sans tarif spécifique)
            $table->decimal('amount', 12, 2);               // montant en XOF
            $table->boolean('installments_allowed')->default(true);
            $table->unsignedTinyInteger('max_installments')->default(3);
            $table->date('due_date')->nullable();            // date limite de paiement
            $table->text('notes')->nullable();
            $table->timestamps();

            // Un seul tarif par couple (année, type, niveau)
            $table->unique(['academic_year_id', 'fee_type_id', 'school_level_id']);

            $table->index('academic_year_id');
            $table->index('fee_type_id');
            $table->index('school_level_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('fee_schedules');
    }
};
