<?php

declare(strict_types=1);

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('parents')) {
            DB::statement('ALTER TABLE parents ALTER COLUMN gender DROP NOT NULL');
        }
    }

    public function down(): void
    {
        if (Schema::hasTable('parents')) {
            DB::statement("UPDATE parents SET gender = 'other' WHERE gender IS NULL");
            DB::statement('ALTER TABLE parents ALTER COLUMN gender SET NOT NULL');
        }
    }
};
