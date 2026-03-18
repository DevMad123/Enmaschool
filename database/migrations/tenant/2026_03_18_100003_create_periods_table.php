<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('periods', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('academic_year_id')->constrained('academic_years')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['trimestre', 'semestre']);
            $table->unsignedSmallInteger('order');
            $table->date('start_date');
            $table->date('end_date');
            $table->boolean('is_current')->default(false);
            $table->boolean('is_closed')->default(false);
            $table->timestamps();

            $table->unique(['academic_year_id', 'order']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('periods');
    }
};
