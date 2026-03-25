<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 10 — Frais scolaires
// student_fees : frais individuels dus par un élève pour une année scolaire.
// Générés automatiquement à l'inscription (via EnrollmentObserver).
//
// RÈGLES MÉTIER :
// - UNIQUE(enrollment_id, fee_type_id) : un seul enregistrement par type par élève par année
// - amount_paid est recalculé à chaque paiement (SUM des payments non annulés)
// - amount_remaining = amount_due - discount_amount - amount_paid
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_fees', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('enrollment_id')
                  ->constrained('enrollments')
                  ->cascadeOnDelete();
            $table->foreignId('fee_schedule_id')
                  ->nullable()
                  ->constrained('fee_schedules')
                  ->nullOnDelete();
            $table->foreignId('fee_type_id')
                  ->constrained('fee_types')
                  ->cascadeOnDelete();
            $table->foreignId('academic_year_id')
                  ->constrained('academic_years')
                  ->cascadeOnDelete();
            $table->decimal('amount_due', 12, 2);
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->decimal('discount_amount', 12, 2)->default(0.00);
            $table->string('discount_reason')->nullable();
            $table->enum('status', ['pending', 'partial', 'paid', 'overdue', 'waived'])
                  ->default('pending');
            // pending = aucun paiement
            // partial = paiement partiel
            // paid    = soldé
            // overdue = en retard (date limite dépassée)
            // waived  = exonéré
            $table->date('due_date')->nullable();
            $table->text('notes')->nullable();
            $table->foreignId('created_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamps();

            // Un seul enregistrement par type de frais par élève par année
            $table->unique(['enrollment_id', 'fee_type_id']);

            $table->index('enrollment_id');
            $table->index('fee_type_id');
            $table->index('academic_year_id');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_fees');
    }
};
