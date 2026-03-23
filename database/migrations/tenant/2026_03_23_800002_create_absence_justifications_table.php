<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Justification d'une ou plusieurs absences consécutives.
     *
     * Quand status = approved :
     *   → toutes les attendances 'absent' de l'élève dans la plage
     *     date_from → date_to sont mises à jour vers 'excused'
     *   → les compteurs de report_cards sont recalculés
     */
    public function up(): void
    {
        Schema::create('absence_justifications', function (Blueprint $table) {
            $table->id();

            $table->foreignId('enrollment_id')
                  ->constrained('enrollments')
                  ->cascadeOnDelete();

            $table->date('date_from');
            $table->date('date_to');

            $table->string('reason', 500);

            // Chemin vers le document justificatif (certificat médical, etc.)
            $table->string('document_path')->nullable();

            // pending = en attente | approved = validée | rejected = rejetée
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');

            $table->foreignId('reviewed_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('reviewed_at')->nullable();

            // Commentaire du validateur
            $table->text('review_note')->nullable();

            $table->foreignId('submitted_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamps();

            $table->index('enrollment_id');
            $table->index('date_from');
            $table->index('date_to');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('absence_justifications');
    }
};
