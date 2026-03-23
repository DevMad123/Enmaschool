<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    // NB: Pas de soft_deletes — une inscription est un document officiel.
    //     En cas d'erreur → status = withdrawn + transfer_note.

    public function up(): void
    {
        Schema::create('enrollments', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('classe_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->date('enrollment_date');
            $table->string('enrollment_number')->nullable(); // numéro officiel : {YEAR}-{CLASSE_SHORT}-{SEQ}
            $table->boolean('is_active')->default(true);
            $table->enum('status', [
                'enrolled',        // inscrit normalement
                'transferred_in',  // arrivé par transfert
                'transferred_out', // parti par transfert
                'withdrawn',       // retiré par les parents
                'completed',       // année terminée
            ])->default('enrolled');
            $table->text('transfer_note')->nullable(); // motif de transfert ou retrait
            $table->foreignId('transferred_from')
                  ->nullable()
                  ->constrained('classes')
                  ->nullOnDelete(); // classe d'origine si transfert
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            // Un élève ne peut être inscrit que dans UNE seule classe par année scolaire
            $table->unique(['student_id', 'academic_year_id']);
        });

        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX enrollments_student_idx ON enrollments (student_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX enrollments_classe_idx ON enrollments (classe_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX enrollments_year_idx ON enrollments (academic_year_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX enrollments_status_idx ON enrollments (status)
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('enrollments');
    }
};
