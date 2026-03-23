<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subject_averages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('enrollment_id')->constrained('enrollments')->cascadeOnDelete();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();

            $table->decimal('annual_average', 5, 2)->nullable();
            $table->decimal('weighted_average', 5, 2)->nullable();
            $table->decimal('coefficient', 3, 1);
            $table->boolean('is_passing')->nullable();
            $table->unsignedSmallInteger('rank')->nullable();
            $table->decimal('class_average', 5, 2)->nullable();
            $table->jsonb('period_averages')->nullable();
            $table->timestamp('calculated_at')->nullable();
            $table->timestamps();

            $table->unique(['enrollment_id', 'subject_id', 'academic_year_id']);
            $table->index('enrollment_id');
            $table->index('student_id');
            $table->index('class_id');
            $table->index('subject_id');
            $table->index('academic_year_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subject_averages');
    }
};
