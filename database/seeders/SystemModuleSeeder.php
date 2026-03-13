<?php
// ===== database/seeders/SystemModuleSeeder.php =====

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\ModuleKey;
use App\Models\Central\Plan;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SystemModuleSeeder extends Seeder
{
    public function run(): void
    {
        // -----------------------------------------------------------------
        // 1. Insérer tous les modules système
        // -----------------------------------------------------------------
        $modules = collect(ModuleKey::cases())->map(function (ModuleKey $module, int $index): array {
            return [
                'key'           => $module->value,
                'name'          => $module->label(),
                'description'   => null,
                'icon'          => $module->icon(),
                'is_core'       => $module->isCore(),
                'is_active'     => true,
                'available_for' => json_encode($module->availableFor()),
                'order'         => $index + 1,
                'created_at'    => now(),
                'updated_at'    => now(),
            ];
        })->all();

        DB::table('system_modules')->upsert(
            $modules,
            ['key'],
            ['name', 'description', 'icon', 'is_core', 'is_active', 'available_for', 'order', 'updated_at']
        );

        // -----------------------------------------------------------------
        // 2. Insérer les plan_modules pour chaque plan
        // -----------------------------------------------------------------
        $planModules = [
            'starter' => [
                ModuleKey::Grades,
                ModuleKey::Attendance,
                ModuleKey::Timetable,
                ModuleKey::Messaging,
            ],
            'pro' => [
                ModuleKey::Grades,
                ModuleKey::Attendance,
                ModuleKey::Timetable,
                ModuleKey::Messaging,
                ModuleKey::Payments,
                ModuleKey::Reports,
                ModuleKey::Elearning,
            ],
            'premium' => ModuleKey::cases(),
        ];

        foreach ($planModules as $slug => $planKeys) {
            $plan = Plan::where('slug', $slug)->first();

            if ($plan === null) {
                continue;
            }

            $rows = array_map(fn (ModuleKey $module): array => [
                'plan_id'    => $plan->id,
                'module_key' => $module->value,
                'is_enabled' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ], $planKeys);

            DB::table('plan_modules')->upsert(
                $rows,
                ['plan_id', 'module_key'],
                ['is_enabled', 'updated_at']
            );
        }
    }
}
