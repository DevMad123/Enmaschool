<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('school_settings', function (Blueprint $table): void {
            $table->id();
            $table->string('key')->unique();
            $table->text('value');
            $table->enum('type', ['string', 'integer', 'boolean', 'json', 'float']);
            $table->enum('group', ['general', 'academic', 'grading', 'attendance', 'fees', 'notifications']);
            $table->string('label');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('school_settings');
    }
};
