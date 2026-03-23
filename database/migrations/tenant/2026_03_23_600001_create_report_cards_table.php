<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_cards', function (Blueprint $table) {
            $table->id();

            // Références
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            // NULL = bulletin annuel
            $table->foreignId('period_id')->nullable()->constrained('periods')->nullOnDelete();

            // type : 'period' = trimestriel/semestriel, 'annual' = fin d'année
            $table->string('type')->default('period'); // enum ReportCardType

            // Snapshot au moment de la génération
            $table->decimal('general_average', 5, 2)->nullable();
            $table->unsignedSmallInteger('general_rank')->nullable();
            $table->unsignedSmallInteger('class_size')->nullable();
            $table->decimal('class_average', 5, 2)->nullable();
            $table->unsignedSmallInteger('absences_justified')->default(0);
            $table->unsignedSmallInteger('absences_unjustified')->default(0);

            // Appréciation conseil de classe
            $table->text('general_appreciation')->nullable();
            // enum CouncilDecision : pass, repeat, conditional, transfer, excluded, honor
            $table->string('council_decision')->nullable();
            // enum HonorMention : encouragements, compliments, felicitations
            $table->string('honor_mention')->nullable();

            // Statut : draft, generated, published, archived
            $table->string('status')->default('draft');

            // PDF
            $table->string('pdf_path')->nullable();
            $table->timestamp('pdf_generated_at')->nullable();
            $table->string('pdf_hash')->nullable(); // SHA256

            // Méta
            $table->foreignId('generated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('published_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('published_at')->nullable();

            $table->timestamps();

            // Index
            $table->index('enrollment_id');
            $table->index('student_id');
            $table->index('class_id');
            $table->index('academic_year_id');
            $table->index('period_id');
            $table->index('status');

            // UNIQUE pour bulletins de période (period_id non NULL)
            $table->unique(['enrollment_id', 'period_id', 'type'], 'report_cards_period_unique');
        });

        // Contrainte partielle PostgreSQL pour les bulletins annuels (period_id IS NULL)
        // Un seul bulletin annuel par enrollment
        DB::statement(
            'CREATE UNIQUE INDEX report_cards_annual_unique
             ON report_cards(enrollment_id, type)
             WHERE period_id IS NULL AND type = \'annual\''
        );
    }

    public function down(): void
    {
        Schema::dropIfExists('report_cards');
    }
};
