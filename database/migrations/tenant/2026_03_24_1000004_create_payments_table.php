<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 10 — Frais scolaires
// payments : versements effectués par une famille.
//
// RÈGLES MÉTIER :
// - receipt_number unique, généré dans Payment::boot() : "{YEAR}-{SEQ_5DIGITS}"
// - Un paiement annulé (cancelled_at non null) ne compte PAS dans amount_paid
// - enrollment_id est redondant mais utile pour les requêtes de filtrage
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_fee_id')
                  ->constrained('student_fees')
                  ->cascadeOnDelete();
            $table->foreignId('enrollment_id')
                  ->constrained('enrollments')
                  ->cascadeOnDelete();
            $table->foreignId('academic_year_id')
                  ->constrained('academic_years')
                  ->cascadeOnDelete();
            $table->string('receipt_number')->unique();   // ex: "2025-00042"
            $table->decimal('amount', 12, 2);
            $table->enum('payment_method', [
                'cash', 'wave', 'orange_money', 'mtn',
                'bank_transfer', 'check', 'other',
            ]);
            $table->date('payment_date');
            $table->string('reference', 100)->nullable();  // référence mobile money / chèque
            $table->text('notes')->nullable();
            $table->string('pdf_path')->nullable();         // chemin vers le reçu PDF
            $table->foreignId('recorded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->timestamp('cancelled_at')->nullable();
            $table->foreignId('cancelled_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();
            $table->string('cancel_reason')->nullable();
            $table->timestamps();

            $table->index('student_fee_id');
            $table->index('enrollment_id');
            $table->index('payment_date');
            $table->index('payment_method');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
