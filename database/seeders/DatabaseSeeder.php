<?php
// ===== database/seeders/DatabaseSeeder.php =====

declare(strict_types=1);

namespace Database\Seeders;

use App\Enums\TenantStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Central\Domain;
use App\Models\Central\Plan;
use App\Models\Central\SuperAdmin;
use App\Models\Central\Tenant;
use App\Models\Central\TenantProfile;
use App\Models\Tenant\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // -----------------------------------------------------------------
        // 1. Plans (central)
        // -----------------------------------------------------------------
        $starter = Plan::create([
            'name' => 'Starter',
            'slug' => 'starter',
            'price_monthly' => 0,
            'price_yearly' => 0,
            'trial_days' => 30,
            'max_students' => 200,
            'max_teachers' => 20,
            'max_storage_gb' => 1,
            'features' => ['grades', 'attendance', 'timetable', 'messaging'],
            'is_active' => true,
        ]);

        $pro = Plan::create([
            'name' => 'Pro',
            'slug' => 'pro',
            'price_monthly' => 25000,
            'price_yearly' => 250000,
            'trial_days' => 30,
            'max_students' => 1000,
            'max_teachers' => 100,
            'max_storage_gb' => 10,
            'features' => [
                'grades', 'attendance', 'timetable',
                'messaging', 'payments', 'reports', 'elearning',
            ],
            'is_active' => true,
        ]);

        $premium = Plan::create([
            'name' => 'Premium',
            'slug' => 'premium',
            'price_monthly' => 50000,
            'price_yearly' => 500000,
            'trial_days' => 30,
            'max_students' => null,
            'max_teachers' => null,
            'max_storage_gb' => 100,
            'features' => ['*'],
            'is_active' => true,
        ]);

        // -----------------------------------------------------------------
        // 2. Tenant demo (central)
        // -----------------------------------------------------------------
        $tenant = Tenant::create([
            'name' => 'École Demo Enma',
            'slug' => 'demo',
            'status' => TenantStatus::Active,
            'plan_id' => $pro->id,
            'has_primary' => true,
            'has_maternelle' => true,
            'has_college' => true,
            'has_lycee' => true,
        ]);

        // -----------------------------------------------------------------
        // 3. TenantProfile (central)
        // -----------------------------------------------------------------
        TenantProfile::create([
            'tenant_id' => $tenant->id,
            'city' => 'Abidjan',
            'country' => 'CI',
            'timezone' => 'Africa/Abidjan',
            'language' => 'fr',
            'currency' => 'XOF',
        ]);

        // -----------------------------------------------------------------
        // 4. Domain (central)
        // -----------------------------------------------------------------
        Domain::create([
            'domain' => 'demo.enmaschool.com',
            'tenant_id' => $tenant->id,
            'is_primary' => true,
        ]);

        // -----------------------------------------------------------------
        // 5. SuperAdmin (central)
        // -----------------------------------------------------------------
        SuperAdmin::create([
            'name' => 'Super Admin',
            'email' => 'superadmin@enmaschool.com',
            'password' => Hash::make('password'),
        ]);

        // -----------------------------------------------------------------
        // 6. Users inside tenant "demo" schema
        // -----------------------------------------------------------------
        $tenant->run(function (): void {
            // Create Spatie roles for this tenant schema
            foreach (UserRole::cases() as $roleEnum) {
                \Spatie\Permission\Models\Role::firstOrCreate(
                    ['name' => $roleEnum->value, 'guard_name' => 'web']
                );
            }

            $admin = User::create([
                'first_name' => 'Admin',
                'last_name' => 'École',
                'email' => 'admin@demo.com',
                'password' => Hash::make('password'),
                'role' => UserRole::SchoolAdmin,
                'status' => UserStatus::Active,
            ]);
            $admin->assignRole(UserRole::SchoolAdmin->value);

            $director = User::create([
                'first_name' => 'Jean',
                'last_name' => 'Directeur',
                'email' => 'directeur@demo.com',
                'password' => Hash::make('password'),
                'role' => UserRole::Director,
                'status' => UserStatus::Active,
            ]);
            $director->assignRole(UserRole::Director->value);

            $teacher = User::create([
                'first_name' => 'Marie',
                'last_name' => 'Professeur',
                'email' => 'prof@demo.com',
                'password' => Hash::make('password'),
                'role' => UserRole::Teacher,
                'status' => UserStatus::Active,
            ]);
            $teacher->assignRole(UserRole::Teacher->value);

            // Permissions Spatie (Phase 3)
            (new PermissionSeeder())->run();

            // Créneaux horaires (Phase 8)
            (new TimeSlotSeeder())->run();

            // Paramètres école (Phase Settings)
            (new SchoolSettingsSeeder())->run();
        });

        // -----------------------------------------------------------------
        // 7. Modules système + plan_modules
        // -----------------------------------------------------------------
        $this->call(SystemModuleSeeder::class);

        // -----------------------------------------------------------------
        // 8. Paramètres système
        // -----------------------------------------------------------------
        $this->call(SystemSettingsSeeder::class);
    }
}
