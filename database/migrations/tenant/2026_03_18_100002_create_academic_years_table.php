<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('academic_years', function (Blueprint $table): void {
            $table->id();
            $table->string('name');
            $table->enum('status', ['draft', 'active', 'closed'])->default('draft');
            $table->date('start_date');
            $table->date('end_date');
            $table->enum('period_type', ['trimestre', 'semestre']);
            $table->boolean('is_current')->default(false);
            $table->decimal('passing_average', 4, 2)->default(10.00);
            $table->enum('promotion_type', ['automatic', 'manual', 'by_average'])->default('by_average');
            $table->timestamp('closed_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('academic_years');
    }
};
