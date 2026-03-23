<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_parents', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('student_id')->constrained('students')->cascadeOnDelete();
            $table->foreignId('parent_id')->constrained('parents')->cascadeOnDelete();
            $table->boolean('is_primary_contact')->default(false); // contact principal
            $table->boolean('can_pickup')->default(true);          // autorisé à récupérer l'enfant
            $table->timestamps();

            $table->unique(['student_id', 'parent_id']);
        });

        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX student_parents_student_idx ON student_parents (student_id)
        ');
        \Illuminate\Support\Facades\DB::statement('
            CREATE INDEX student_parents_parent_idx ON student_parents (parent_id)
        ');
    }

    public function down(): void
    {
        Schema::dropIfExists('student_parents');
    }
};
