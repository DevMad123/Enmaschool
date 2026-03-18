<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_levels', function (Blueprint $table): void {
            $table->id();
            $table->string('code')->unique();
            $table->enum('category', ['maternelle', 'primaire', 'college', 'lycee']);
            $table->string('label');
            $table->string('short_label');
            $table->unsignedSmallInteger('order');
            $table->boolean('requires_serie')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_levels');
    }
};
