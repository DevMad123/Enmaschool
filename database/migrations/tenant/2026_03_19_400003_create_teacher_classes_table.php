<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Affectation d'un enseignant à une classe pour une matière sur une année scolaire précise.
     *
     * Règle clé : UNIQUE(class_id, subject_id, academic_year_id)
     * → Une matière dans une classe = UN SEUL enseignant actif par année.
     *
     * Pas de soft_deletes : si on retire un enseignant → is_active = false.
     * L'historique est conservé (utile pour audit et reconstitution).
     *
     * Si on change d'enseignant pour une matière :
     *   1. is_active = false sur l'ancienne affectation
     *   2. Nouvelle ligne créée pour le nouvel enseignant
     * → La contrainte UNIQUE ne porte que sur les affectations actives (via index partiel).
     */
    public function up(): void
    {
        Schema::create('teacher_classes', function (Blueprint $table): void {
            $table->id();

            $table->foreignId('teacher_id')->constrained('teachers')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            // Heures/semaine pour CETTE affectation (peut surcharger class_subjects.hours_per_week)
            $table->decimal('hours_per_week', 3, 1)->nullable();

            // Statut de l'affectation
            $table->boolean('is_active')->default(true);

            // Méta d'affectation
            $table->date('assigned_at')->nullable();
            $table->foreignId('assigned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();

            $table->timestamps();
        });

        // Index de performance
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_classes_teacher_id_idx ON teacher_classes (teacher_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_classes_class_id_idx ON teacher_classes (class_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_classes_subject_id_idx ON teacher_classes (subject_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teacher_classes_academic_year_id_idx ON teacher_classes (academic_year_id)
        ');

        // Contrainte d'unicité : une matière = un seul enseignant ACTIF par classe par an
        // Index partiel sur is_active = true (PostgreSQL)
        \Illuminate\Support\Facades\DB::statement('
            CREATE UNIQUE INDEX teacher_classes_unique_active_assignment
            ON teacher_classes (class_id, subject_id, academic_year_id)
            WHERE is_active = true
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('teacher_classes');
    }
};
