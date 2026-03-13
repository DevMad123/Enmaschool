<?php
// ===== database/migrations/2026_03_13_150002_create_plan_modules_table.php =====

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('plan_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignId('plan_id')
                ->constrained('plans')
                ->cascadeOnDelete();
            $table->string('module_key');
            $table->foreign('module_key')
                ->references('key')
                ->on('system_modules')
                ->cascadeOnDelete();
            $table->boolean('is_enabled')->default(true);
            $table->timestamps();

            $table->unique(['plan_id', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('plan_modules');
    }
};
