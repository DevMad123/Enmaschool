<?php
// ===== app/Http/Controllers/Central/DashboardController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\ActivityLogResource;
use App\Http\Resources\Central\TenantResource;
use App\Models\Central\ActivityLog;
use App\Models\Central\Subscription;
use App\Models\Central\Tenant;
use App\Models\Central\TenantModule;
use App\Services\Central\SubscriptionService;
use App\Services\Central\TenantService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly TenantService       $tenantService,
        private readonly SubscriptionService $subscriptionService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/dashboard/stats
    // -------------------------------------------------------------------------

    public function stats(): JsonResponse
    {
        $now       = Carbon::now();
        $startMonth = $now->copy()->startOfMonth();

        // ---- Tenants --------------------------------------------------------
        $totalTenants     = Tenant::count();
        $activeTenants    = Tenant::where('status', 'active')->count();
        $trialTenants     = Tenant::where('status', 'trial')->count();
        $suspendedTenants = Tenant::where('status', 'suspended')->count();
        $newThisMonth     = Tenant::where('created_at', '>=', $startMonth)->count();

        // ---- Revenue --------------------------------------------------------
        $monthlyArr = (float) Subscription::whereIn('status', ['active'])
            ->where(function ($q): void {
                $q->whereNull('ends_at')->orWhere('ends_at', '>', now());
            })
            ->sum('price_paid');

        // Essais expirant dans les 7 prochains jours
        $trialsExpiring = $this->subscriptionService->getExpiringTrials(7);
        $trialsExpiringSoon = $trialsExpiring->map(function (Subscription $sub): array {
            return [
                'tenant' => [
                    'id'   => $sub->tenant_id,
                    'name' => $sub->tenant?->name,
                    'slug' => $sub->tenant?->slug,
                ],
                'days_left' => $sub->daysLeft(),
            ];
        })->values()->all();

        // ---- Modules les plus utilisés -------------------------------------
        $mostUsedModules = TenantModule::where('is_enabled', true)
            ->select('module_key', DB::raw('COUNT(*) as tenants_count'))
            ->groupBy('module_key')
            ->orderByDesc('tenants_count')
            ->limit(5)
            ->get()
            ->map(fn ($row) => [
                'module'        => $row->module_key,
                'tenants_count' => (int) $row->tenants_count,
            ])->all();

        // ---- Activité récente & tenants récents ----------------------------
        $recentActivity = ActivityLog::orderByDesc('created_at')
            ->limit(10)
            ->get();

        $recentTenants = Tenant::with(['profile', 'plan', 'currentSubscription'])
            ->orderByDesc('created_at')
            ->limit(5)
            ->get();

        // ---- Users total (aggregate léger via tenant stats) ----------------
        // Pour éviter d'itérer tous les tenants dans le dashboard (coûteux),
        // on retourne les counts depuis la base centrale (pas depuis les schémas tenant).
        // Les stats détaillées par tenant restent via GET /tenants/{tenant}/stats.
        $usersNewThisMonth = 0; // nécessite iteration schema-per-tenant, non résolu ici

        return $this->success([
            'tenants' => [
                'total'          => $totalTenants,
                'active'         => $activeTenants,
                'trial'          => $trialTenants,
                'suspended'      => $suspendedTenants,
                'new_this_month' => $newThisMonth,
            ],
            'users' => [
                'total'          => null, // calculé via GET /tenants/{tenant}/stats
                'new_this_month' => $usersNewThisMonth,
            ],
            'revenue' => [
                'monthly_arr'         => $monthlyArr,
                'trials_expiring_soon' => $trialsExpiringSoon,
            ],
            'modules' => [
                'most_used' => $mostUsedModules,
            ],
            'recent_activity' => ActivityLogResource::collection($recentActivity),
            'recent_tenants'  => TenantResource::collection($recentTenants),
        ]);
    }
}
