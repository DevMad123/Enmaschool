<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('class_id')->constrained('classes')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->foreignId('period_id')->constrained('periods')->cascadeOnDelete();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->string('title', 200);
            $table->enum('type', ['dc', 'dm', 'composition', 'exam', 'interrogation', 'tp', 'other']);
            $table->date('date');
            $table->decimal('max_score', 5, 2)->default(20.00);
            $table->decimal('coefficient', 3, 1)->default(1.0);
            $table->boolean('is_published')->default(false);
            $table->boolean('is_locked')->default(false);
            $table->text('description')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index('class_id');
            $table->index('subject_id');
            $table->index('period_id');
            $table->index('academic_year_id');
            $table->index('date');
            $table->index('type');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
