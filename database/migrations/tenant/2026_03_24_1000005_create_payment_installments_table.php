<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

// Phase 10 — Frais scolaires
// payment_installments : échéancier de paiement planifié pour un student_fee.
// Permet de découper le paiement en plusieurs tranches à des dates données.
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_installments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_fee_id')
                  ->constrained('student_fees')
                  ->cascadeOnDelete();
            $table->unsignedTinyInteger('installment_number'); // 1, 2, 3...
            $table->decimal('amount_due', 12, 2);
            $table->date('due_date');
            $table->decimal('amount_paid', 12, 2)->default(0.00);
            $table->timestamp('paid_at')->nullable();
            $table->enum('status', ['pending', 'paid', 'overdue'])->default('pending');
            $table->timestamps();

            $table->unique(['student_fee_id', 'installment_number']);

            $table->index('student_fee_id');
            $table->index('due_date');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_installments');
    }
};
