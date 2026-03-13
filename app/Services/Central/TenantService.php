<?php
// ===== app/Services/Central/TenantService.php =====

declare(strict_types=1);

namespace App\Services\Central;

use App\Enums\ActivityType;
use App\Enums\SubscriptionStatus;
use App\Enums\TenantStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Mail\Central\WelcomeTenantMail;
use App\Models\Central\Domain;
use App\Models\Central\Plan;
use App\Models\Central\Subscription;
use App\Models\Central\SuperAdmin;
use App\Models\Central\Tenant;
use App\Models\Central\TenantProfile;
use Illuminate\Support\Facades\Mail;

class TenantService
{
    public function __construct(
        private readonly ModuleService      $moduleService,
        private readonly ActivityLogService $activityLogService
    ) {}

    // -------------------------------------------------------------------------
    // CRUD
    // -------------------------------------------------------------------------

    /**
     * Crée un nouveau tenant avec son profil, son domaine, sa subscription,
     * ses modules, et l'utilisateur school_admin dans le schema tenant.
     *
     * Structure de $data :
     *   Tenant   : name, slug, plan_id?, has_primary, has_maternelle,
     *              has_college, has_lycee
     *   Profil   : city?, country?, timezone?, language?, currency?,
     *              phone?, address?, email?, website?, logo?
     *   Admin    : admin_first_name, admin_last_name, admin_email,
     *              admin_password
     *   Contexte : created_by? (SuperAdmin id), created_by_name?
     */
    public function create(array $data): Tenant
    {
        // 1. Résoudre le plan (Starter par défaut)
        $plan = isset($data['plan_id'])
            ? Plan::findOrFail($data['plan_id'])
            : Plan::where('slug', 'starter')->firstOrFail();

        // 2. Créer le tenant
        //    → TenancyServiceProvider écoute TenantCreated et exécute
        //      synchroniquement CreateDatabase + MigrateDatabase
        $tenant = Tenant::create([
            'name'          => $data['name'],
            'slug'          => $data['slug'],
            'status'        => TenantStatus::Trial,
            'plan_id'       => $plan->id,
            'has_primary'   => $data['has_primary']   ?? false,
            'has_maternelle'=> $data['has_maternelle'] ?? false,
            'has_college'   => $data['has_college']   ?? false,
            'has_lycee'     => $data['has_lycee']     ?? false,
            'trial_ends_at' => now()->addDays($plan->trial_days ?? 30),
        ]);

        // 3. Profil
        TenantProfile::create([
            'tenant_id' => $tenant->id,
            'city'      => $data['city']     ?? null,
            'country'   => $data['country']  ?? 'CI',
            'timezone'  => $data['timezone'] ?? 'Africa/Abidjan',
            'language'  => $data['language'] ?? 'fr',
            'currency'  => $data['currency'] ?? 'XOF',
            'phone'     => $data['phone']    ?? null,
            'address'   => $data['address']  ?? null,
            'email'     => $data['email']    ?? null,
            'website'   => $data['website']  ?? null,
            'logo'      => $data['logo']     ?? null,
        ]);

        // 4. Domaine principal
        Domain::create([
            'tenant_id'  => $tenant->id,
            'domain'     => "{$tenant->slug}.enmaschool.test",
            'is_primary' => true,
        ]);

        // 5. Subscription trial
        Subscription::create([
            'tenant_id'     => $tenant->id,
            'plan_id'       => $plan->id,
            'status'        => SubscriptionStatus::Trial->value,
            'starts_at'     => now(),
            'trial_ends_at' => $tenant->trial_ends_at,
            'created_by'    => $data['created_by'] ?? null,
        ]);

        // 6. Initialiser les tenant_modules depuis le plan
        $this->moduleService->syncModulesFromPlan($tenant, $plan);

        // 7. Créer le school_admin dans le schema tenant
        //    (schema + migrations déjà créés par les events tenancy)
        $tenant->run(function () use ($data): void {
            foreach (UserRole::cases() as $roleEnum) {
                \Spatie\Permission\Models\Role::firstOrCreate([
                    'name'       => $roleEnum->value,
                    'guard_name' => 'web',
                ]);
            }

            $admin = \App\Models\Tenant\User::create([
                'first_name' => $data['admin_first_name'] ?? 'Admin',
                'last_name'  => $data['admin_last_name']  ?? 'École',
                'email'      => $data['admin_email'],
                'password'   => $data['admin_password'],
                'role'       => UserRole::SchoolAdmin,
                'status'     => UserStatus::Active,
            ]);

            $admin->assignRole(UserRole::SchoolAdmin->value);
        });

        // 8. Email de bienvenue (queued)
        if (isset($data['admin_email'])) {
            $adminName = trim(
                ($data['admin_first_name'] ?? 'Admin')
                . ' '
                . ($data['admin_last_name'] ?? '')
            );

            Mail::to($data['admin_email'])->queue(
                new WelcomeTenantMail(
                    tenant: $tenant,
                    adminEmail: $data['admin_email'],
                    adminName: $adminName,
                    tempPassword: $data['admin_password'] ?? '',
                )
            );
        }

        // 9. Log de l'activité
        $this->activityLogService->log([
            'log_type'      => 'central',
            'actor_type'    => 'super_admin',
            'actor_id'      => $data['created_by'] ?? 0,
            'actor_name'    => $data['created_by_name'] ?? 'Système',
            'activity_type' => ActivityType::Create,
            'description'   => "École créée : {$tenant->name}",
            'subject_type'  => Tenant::class,
            'subject_name'  => $tenant->name,
            'properties'    => [
                'tenant_id' => $tenant->id,
                'plan'      => $plan->name,
                'slug'      => $tenant->slug,
                'types'     => [
                    'primary'   => $tenant->has_primary,
                    'maternelle'=> $tenant->has_maternelle,
                    'college'   => $tenant->has_college,
                    'lycee'     => $tenant->has_lycee,
                ],
            ],
            'ip_address' => request()->ip(),
        ]);

        return $tenant->load(['profile', 'domains', 'plan']);
    }

    /**
     * Met à jour les informations d'un tenant et de son profil.
     *
     * $data peut contenir les mêmes champs Tenant + Profil que create().
     */
    public function update(Tenant $tenant, array $data): Tenant
    {
        $tenantFields = array_filter([
            'name'          => $data['name']          ?? null,
            'has_primary'   => $data['has_primary']   ?? null,
            'has_maternelle'=> $data['has_maternelle'] ?? null,
            'has_college'   => $data['has_college']   ?? null,
            'has_lycee'     => $data['has_lycee']     ?? null,
        ], fn ($v) => $v !== null);

        if (!empty($tenantFields)) {
            $tenant->update($tenantFields);
        }

        $profileFields = array_filter([
            'city'     => $data['city']     ?? null,
            'country'  => $data['country']  ?? null,
            'timezone' => $data['timezone'] ?? null,
            'language' => $data['language'] ?? null,
            'currency' => $data['currency'] ?? null,
            'phone'    => $data['phone']    ?? null,
            'address'  => $data['address']  ?? null,
            'email'    => $data['email']    ?? null,
            'website'  => $data['website']  ?? null,
            'logo'     => $data['logo']     ?? null,
        ], fn ($v) => $v !== null);

        if (!empty($profileFields)) {
            $tenant->profile?->update($profileFields);
        }

        return $tenant->fresh(['profile', 'domains', 'plan']);
    }

    /**
     * Active un tenant suspendu.
     */
    public function activate(Tenant $tenant, SuperAdmin $by): void
    {
        $tenant->update(['status' => TenantStatus::Active]);

        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: ActivityType::Update->value,
            description: "École activée : {$tenant->name}",
            extra: [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
            ]
        );
    }

    /**
     * Suspend un tenant.
     */
    public function suspend(Tenant $tenant, string $reason, SuperAdmin $by): void
    {
        $tenant->update(['status' => TenantStatus::Suspended]);

        // Suspendre la subscription active
        Subscription::where('tenant_id', $tenant->id)
            ->where('status', SubscriptionStatus::Active->value)
            ->update(['status' => SubscriptionStatus::Suspended->value]);

        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: ActivityType::Update->value,
            description: "École suspendue : {$tenant->name}",
            extra: [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
                'properties'  => ['reason' => $reason],
            ]
        );
    }

    // -------------------------------------------------------------------------
    // Stats
    // -------------------------------------------------------------------------

    /**
     * Retourne les statistiques d'un tenant (requête dans son schema).
     *
     * @return array{
     *   students_count: int,
     *   teachers_count: int,
     *   users_count: int,
     *   classes_count: int,
     *   storage_used_mb: int,
     * }
     */
    public function getStats(Tenant $tenant): array
    {
        return $tenant->run(function (): array {
            return [
                'students_count' => \App\Models\Tenant\User::where(
                    'role', UserRole::Student->value
                )->count(),
                'teachers_count' => \App\Models\Tenant\User::where(
                    'role', UserRole::Teacher->value
                )->count(),
                'users_count'    => \App\Models\Tenant\User::count(),
                'classes_count'  => 0, // Table classes implémentée en Phase 2
                'storage_used_mb'=> 0, // Implémenté avec filesystem stats
            ];
        });
    }

    /**
     * Retourne les statistiques globales de la plateforme.
     *
     * @return array{
     *   total_tenants: int,
     *   active_tenants: int,
     *   trial_tenants: int,
     *   total_students: int,
     *   total_teachers: int,
     *   total_users: int,
     *   revenue_monthly: float,
     * }
     */
    public function getAllStats(): array
    {
        $totalTenants  = Tenant::count();
        $activeTenants = Tenant::active()->count();
        $trialTenants  = Tenant::onTrial()->count();

        $revenueMonthly = (float) Subscription::whereIn('status', [
            SubscriptionStatus::Active->value,
        ])
            ->whereNull('ends_at')
            ->orWhere('ends_at', '>', now())
            ->sum('price_paid');

        $totalStudents = 0;
        $totalTeachers = 0;
        $totalUsers    = 0;

        foreach (Tenant::active()->get() as $tenant) {
            $stats = $tenant->run(fn (): array => [
                's' => \App\Models\Tenant\User::where('role', UserRole::Student->value)->count(),
                't' => \App\Models\Tenant\User::where('role', UserRole::Teacher->value)->count(),
                'u' => \App\Models\Tenant\User::count(),
            ]);

            $totalStudents += $stats['s'];
            $totalTeachers += $stats['t'];
            $totalUsers    += $stats['u'];
        }

        return [
            'total_tenants'   => $totalTenants,
            'active_tenants'  => $activeTenants,
            'trial_tenants'   => $trialTenants,
            'total_students'  => $totalStudents,
            'total_teachers'  => $totalTeachers,
            'total_users'     => $totalUsers,
            'revenue_monthly' => $revenueMonthly,
        ];
    }
}
