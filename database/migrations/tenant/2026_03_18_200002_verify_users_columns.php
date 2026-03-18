<?php
// ===== database/migrations/tenant/2026_03_18_200002_verify_users_columns.php =====
// already exists — no changes needed
// Columns avatar, phone, settings (jsonb), last_login_at were added in Phase 0

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up(): void
    {
        // No changes — columns already present from initial users migration
    }

    public function down(): void
    {
        // No changes
    }
};
