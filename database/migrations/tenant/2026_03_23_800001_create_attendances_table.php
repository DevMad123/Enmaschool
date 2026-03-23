<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Un seul enregistrement par élève par cours par date.
     * Mise à jour via updateOrCreate — jamais de doublons.
     */
    public function up(): void
    {
        Schema::create('attendances', function (Blueprint $table) {
            $table->id();

            // Relie automatiquement à student + class + year
            $table->foreignId('enrollment_id')
                  ->constrained('enrollments')
                  ->cascadeOnDelete();

            // NULL si saisie hors emploi du temps (journée entière)
            $table->foreignId('timetable_entry_id')
                  ->nullable()
                  ->constrained('timetable_entries')
                  ->nullOnDelete();

            $table->date('date');

            // Déduit automatiquement de la date + academic_year dans le Service
            $table->foreignId('period_id')
                  ->nullable()
                  ->constrained('periods')
                  ->nullOnDelete();

            $table->enum('status', ['present', 'absent', 'late', 'excused']);

            // Rempli si status = late (nb de minutes de retard)
            $table->unsignedSmallInteger('minutes_late')->nullable();

            // Utilisateur qui a saisi la présence
            $table->foreignId('recorded_by')
                  ->nullable()
                  ->constrained('users')
                  ->nullOnDelete();

            $table->timestamp('recorded_at')->nullable();

            // Remarque de l'enseignant
            $table->string('note', 300)->nullable();

            $table->timestamps();

            // Un seul enregistrement par élève par cours par date
            $table->unique(['enrollment_id', 'timetable_entry_id', 'date']);

            $table->index('enrollment_id');
            $table->index('timetable_entry_id');
            $table->index('date');
            $table->index('period_id');
            $table->index('status');
        });

        // Index partiel pour les saisies journée entière (timetable_entry_id IS NULL)
        DB::statement('
            CREATE UNIQUE INDEX attendances_daily_unique
            ON attendances(enrollment_id, date)
            WHERE timetable_entry_id IS NULL
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('attendances');
    }
};
