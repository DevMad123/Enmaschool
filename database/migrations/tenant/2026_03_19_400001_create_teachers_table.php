<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Profil pédagogique d'un enseignant.
     * Complète le User (qui contient les infos d'identité et d'auth).
     * Un user avec role=teacher DEVRAIT avoir un profil Teacher (créé via UserObserver).
     */
    public function up(): void
    {
        Schema::create('teachers', function (Blueprint $table): void {
            $table->id();

            // Lien vers le user (1:1 — un user = un seul profil enseignant)
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();

            // Identité professionnelle
            $table->string('employee_number', 30)->nullable()->unique(); // ex: "ENS-2024-0042"
            $table->string('speciality', 150)->nullable();               // ex: "Mathématiques"
            $table->string('diploma', 200)->nullable();                  // ex: "Master CAPES"
            $table->date('hire_date')->nullable();

            // Contrat & charge horaire
            $table->enum('contract_type', ['permanent', 'contract', 'part_time', 'interim'])
                  ->default('contract');
            $table->unsignedSmallInteger('weekly_hours_max')->default(18);
            // La charge horaire effective est calculée dynamiquement via teacher_classes

            // Informations complémentaires
            $table->text('biography')->nullable(); // Bio courte affichée aux élèves (V2)

            // Statut
            $table->boolean('is_active')->default(true);

            $table->timestamps();
        });

        // Index de performance
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX teachers_is_active_idx ON teachers (is_active)
        ');
        // user_id et employee_number déjà indexés via unique()
    }

    public function down(): void
    {
        Schema::dropIfExists('teachers');
    }
};
