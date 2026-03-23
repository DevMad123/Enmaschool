<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('timetable_overrides', function (Blueprint $table) {
            $table->id();

            $table->foreignId('timetable_entry_id')->constrained('timetable_entries')->cascadeOnDelete();
            $table->date('date');
            $table->enum('type', ['cancellation', 'substitution', 'room_change', 'rescheduled']);

            $table->foreignId('substitute_teacher_id')->nullable()->constrained('teachers')->nullOnDelete();
            $table->foreignId('new_room_id')->nullable()->constrained('rooms')->nullOnDelete();
            $table->foreignId('rescheduled_to_slot_id')->nullable()->constrained('time_slots')->nullOnDelete();

            $table->text('reason')->nullable();
            $table->timestamp('notified_at')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Une seule dérogation par cours par date
            $table->unique(['timetable_entry_id', 'date']);

            $table->index('date');
            $table->index('type');
            $table->index('timetable_entry_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('timetable_overrides');
    }
};
