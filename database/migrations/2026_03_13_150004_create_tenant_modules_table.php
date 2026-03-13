<?php
// ===== database/migrations/2026_03_13_150004_create_tenant_modules_table.php =====

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tenant_modules', function (Blueprint $table): void {
            $table->id();
            $table->foreignUuid('tenant_id')
                ->constrained('tenants')
                ->cascadeOnDelete();
            $table->string('module_key');
            $table->boolean('is_enabled')->default(true);
            $table->timestamp('enabled_at')->nullable();
            $table->timestamp('disabled_at')->nullable();
            $table->foreignId('enabled_by')
                ->nullable()
                ->constrained('super_admins')
                ->nullOnDelete();
            $table->foreignId('disabled_by')
                ->nullable()
                ->constrained('super_admins')
                ->nullOnDelete();
            $table->text('override_reason')->nullable();
            $table->timestamps();

            $table->unique(['tenant_id', 'module_key']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tenant_modules');
    }
};
