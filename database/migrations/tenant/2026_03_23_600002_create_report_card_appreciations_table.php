<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('report_card_appreciations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('report_card_id')->constrained('report_cards')->cascadeOnDelete();
            $table->foreignId('subject_id')->constrained('subjects')->cascadeOnDelete();
            // Enseignant qui a rédigé l'appréciation
            $table->foreignId('teacher_id')->nullable()->constrained('teachers')->nullOnDelete();

            $table->text('appreciation');

            $table->foreignId('entered_by')->nullable()->constrained('users')->nullOnDelete();

            $table->timestamps();

            // Une seule appréciation par matière par bulletin
            $table->unique(['report_card_id', 'subject_id']);

            $table->index('report_card_id');
            $table->index('subject_id');
            $table->index('teacher_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('report_card_appreciations');
    }
};
