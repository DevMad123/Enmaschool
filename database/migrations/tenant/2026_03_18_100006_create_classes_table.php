<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('classes', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->foreignId('school_level_id')->constrained('school_levels')->restrictOnDelete();
            $table->foreignId('main_teacher_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->string('serie')->nullable();
            $table->string('section');
            $table->string('display_name');
            $table->unsignedSmallInteger('capacity')->default(40);
            $table->boolean('is_active')->default(true);
            $table->softDeletes();
            $table->timestamps();
        });

        // Partial unique indexes for PostgreSQL:
        // When serie IS NULL: unique on (academic_year_id, school_level_id, section)
        // When serie IS NOT NULL: unique on (academic_year_id, school_level_id, serie, section)
        DB::statement('
            CREATE UNIQUE INDEX classes_null_serie_unique
            ON classes (academic_year_id, school_level_id, section)
            WHERE serie IS NULL AND deleted_at IS NULL
        ');

        DB::statement('
            CREATE UNIQUE INDEX classes_with_serie_unique
            ON classes (academic_year_id, school_level_id, serie, section)
            WHERE serie IS NOT NULL AND deleted_at IS NULL
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('classes');
    }
};
