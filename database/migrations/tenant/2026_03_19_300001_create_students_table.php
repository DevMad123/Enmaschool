<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('students', function (Blueprint $table): void {
            // Identité officielle
            $table->id();
            $table->string('matricule')->unique(); // format: {YEAR}{CAT_CODE}{SEQ_5DIGITS} ex: "2024PRI00042"
            $table->string('first_name', 100);
            $table->string('last_name', 100);
            $table->date('birth_date');
            $table->string('birth_place', 150)->nullable();
            $table->enum('gender', ['male', 'female']);
            $table->string('nationality', 100)->default('Ivoirienne');
            $table->string('birth_certificate_number', 50)->nullable();
            $table->string('photo')->nullable(); // chemin vers la photo

            // Adresse & Contact
            $table->text('address')->nullable();
            $table->string('city', 100)->nullable();
            $table->enum('blood_type', ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'])->nullable();

            // Informations scolaires
            $table->unsignedSmallInteger('first_enrollment_year')->nullable();
            $table->string('previous_school', 200)->nullable();
            $table->text('notes')->nullable(); // notes internes (admin seulement)

            // Statut
            $table->enum('status', ['active', 'inactive', 'transferred', 'graduated', 'expelled'])
                  ->default('active');

            // Méta
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->softDeletes();
            $table->timestamps();
        });

        // Index de performance
        // matricule déjà indexé via unique()
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX students_name_idx ON students (last_name, first_name)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX students_birth_date_idx ON students (birth_date)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX students_status_idx ON students (status)
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('students');
    }
};