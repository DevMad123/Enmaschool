<?php
// ===== app/Http/Controllers/Central/TenantController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StoreTenantRequest;
use App\Http\Requests\Central\UpdateTenantRequest;
use App\Http\Resources\Central\TenantResource;
use App\Http\Resources\Central\TenantStatsResource;
use App\Models\Central\Tenant;
use App\Services\Central\TenantService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TenantController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly TenantService $tenantService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/tenants
    // -------------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $query = Tenant::with(['profile', 'plan', 'currentSubscription'])
            ->orderBy('created_at', 'desc');

        // Filtres
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('has_primary')) {
            $query->where('has_primary', filter_var($request->input('has_primary'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('has_college')) {
            $query->where('has_college', filter_var($request->input('has_college'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('has_lycee')) {
            $query->where('has_lycee', filter_var($request->input('has_lycee'), FILTER_VALIDATE_BOOLEAN));
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', (int) $request->input('plan_id'));
        }

        if ($request->filled('search')) {
            $search = '%' . $request->input('search') . '%';
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'ilike', $search)
                    ->orWhere('slug', 'ilike', $search)
                    ->orWhereHas('profile', fn ($p) => $p->where('email', 'ilike', $search));
            });
        }

        // Tri
        $sortField = in_array($request->input('sort'), ['name', 'created_at'], true)
            ? $request->input('sort')
            : 'created_at';
        $sortDir = $request->input('direction', 'desc') === 'asc' ? 'asc' : 'desc';
        $query->orderBy($sortField, $sortDir);

        $paginator = $query->paginate(20);

        return $this->paginated(
            $paginator->setCollection(
                $paginator->getCollection()->transform(
                    fn (Tenant $t) => new TenantResource($t)
                )
            )
        );
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants
    // -------------------------------------------------------------------------

    public function store(StoreTenantRequest $request): JsonResponse
    {
        $data = $request->validated();

        // Flatten profile sub-array into top-level for TenantService
        if (isset($data['profile']) && is_array($data['profile'])) {
            foreach ($data['profile'] as $k => $v) {
                $data[$k] = $v;
            }
            unset($data['profile']);
        }

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();
        $data['created_by']      = $admin->id;
        $data['created_by_name'] = $admin->name;

        $tenant = $this->tenantService->create($data);
        $tenant->load(['profile', 'plan', 'currentSubscription', 'tenantModules']);

        return $this->success(new TenantResource($tenant), 'École créée avec succès.', 201);
    }

    // -------------------------------------------------------------------------
    // GET /central/tenants/{tenant}
    // -------------------------------------------------------------------------

    public function show(Tenant $tenant): JsonResponse
    {
        $tenant->load(['profile', 'plan', 'currentSubscription', 'tenantModules']);

        return $this->success(new TenantResource($tenant));
    }

    // -------------------------------------------------------------------------
    // PUT /central/tenants/{tenant}
    // -------------------------------------------------------------------------

    public function update(UpdateTenantRequest $request, Tenant $tenant): JsonResponse
    {
        $data = $request->validated();

        // Flatten profile
        if (isset($data['profile']) && is_array($data['profile'])) {
            foreach ($data['profile'] as $k => $v) {
                $data[$k] = $v;
            }
            unset($data['profile']);
        }

        $tenant = $this->tenantService->update($tenant, $data);
        $tenant->load(['profile', 'plan', 'currentSubscription', 'tenantModules']);

        return $this->success(new TenantResource($tenant), 'École mise à jour.');
    }

    // -------------------------------------------------------------------------
    // DELETE /central/tenants/{tenant}
    // -------------------------------------------------------------------------

    public function destroy(Tenant $tenant): JsonResponse
    {
        // Vérifie aucune subscription active
        $hasActiveSub = $tenant->subscriptions()
            ->whereIn('status', ['active', 'trial'])
            ->exists();

        if ($hasActiveSub) {
            return $this->error(
                'Impossible de supprimer une école avec un abonnement actif.',
                422
            );
        }

        $tenant->delete();

        return $this->success(null, 'École supprimée.');
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants/{tenant}/activate
    // -------------------------------------------------------------------------

    public function activate(Tenant $tenant): JsonResponse
    {
        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = request()->user();

        $this->tenantService->activate($tenant, $admin);
        $tenant->load(['profile', 'plan', 'currentSubscription']);

        return $this->success(new TenantResource($tenant), 'École activée.');
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants/{tenant}/suspend
    // -------------------------------------------------------------------------

    public function suspend(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        $this->tenantService->suspend($tenant, $validated['reason'], $admin);
        $tenant->load(['profile', 'plan', 'currentSubscription']);

        return $this->success(new TenantResource($tenant), 'École suspendue.');
    }

    // -------------------------------------------------------------------------
    // GET /central/tenants/{tenant}/stats
    // -------------------------------------------------------------------------

    public function stats(Tenant $tenant): JsonResponse
    {
        $stats = $this->tenantService->getStats($tenant);

        return $this->success(new TenantStatsResource($stats));
    }
}
