<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('time_slots', function (Blueprint $table) {
            $table->id();

            $table->string('name');                       // "1er cours", "Récréation"
            $table->unsignedTinyInteger('day_of_week');   // 1=Lundi … 6=Samedi
            $table->time('start_time');
            $table->time('end_time');
            $table->unsignedSmallInteger('duration_minutes');
            $table->boolean('is_break')->default(false);  // true = récréation/pause
            $table->unsignedSmallInteger('order');
            $table->boolean('is_active')->default(true);

            $table->timestamps();

            // Un seul créneau par jour + heure de départ
            $table->unique(['day_of_week', 'start_time']);

            $table->index('day_of_week');
            $table->index('order');
            $table->index('is_active');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('time_slots');
    }
};
