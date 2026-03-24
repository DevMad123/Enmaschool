<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('level_subjects', function (Blueprint $table) {
            $table->id();
            $table->foreignId('school_level_id')->constrained('school_levels')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            $table->decimal('coefficient', 3, 1)->nullable()->comment('Override du coefficient par défaut de la matière');
            $table->decimal('hours_per_week', 3, 1)->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->unique(['school_level_id', 'subject_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('level_subjects');
    }
};
