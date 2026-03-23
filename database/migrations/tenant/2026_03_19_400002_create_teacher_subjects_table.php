<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Matières qu'un enseignant est qualifié pour enseigner.
     * Indépendant de l'année scolaire — c'est une qualification permanente.
     */
    public function up(): void
    {
        Schema::create('teacher_subjects', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();

            // true = matière principale de l'enseignant (sa spécialité déclarée)
            $table->boolean('is_primary')->default(false);

            $table->timestamps();

            // Un enseignant ne peut être qualifié qu'une seule fois par matière
            $table->unique(['teacher_id', 'subject_id']);
        });

        // Index de performance
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_subjects_teacher_id_idx ON teacher_subjects (teacher_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_subjects_subject_id_idx ON teacher_subjects (subject_id)
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_subjects');
    }
};
