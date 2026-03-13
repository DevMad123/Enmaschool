<?php
// ===== app/Http/Controllers/Central/PlanController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\StorePlanRequest;
use App\Http\Resources\Central\PlanResource;
use App\Models\Central\Plan;
use App\Models\Central\PlanModule;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PlanController extends Controller
{
    use ApiResponse;

    // -------------------------------------------------------------------------
    // GET /central/plans
    // -------------------------------------------------------------------------

    public function index(): JsonResponse
    {
        $plans = Plan::with('systemModules')
            ->withCount('tenants')
            ->orderBy('price_monthly')
            ->get();

        return $this->success(PlanResource::collection($plans));
    }

    // -------------------------------------------------------------------------
    // POST /central/plans
    // -------------------------------------------------------------------------

    public function store(StorePlanRequest $request): JsonResponse
    {
        $data = $request->validated();
        $moduleKeys = $data['modules'] ?? [];
        unset($data['modules']);

        $plan = Plan::create($data);

        // Créer les plan_modules
        if (! empty($moduleKeys)) {
            $rows = array_map(fn (string $key) => [
                'plan_id'    => $plan->id,
                'module_key' => $key,
                'is_enabled' => true,
            ], $moduleKeys);

            PlanModule::insert($rows);
        }

        $plan->load('systemModules');
        $plan->loadCount('tenants');

        return $this->success(new PlanResource($plan), 'Plan créé avec succès.', 201);
    }

    // -------------------------------------------------------------------------
    // GET /central/plans/{plan}
    // -------------------------------------------------------------------------

    public function show(Plan $plan): JsonResponse
    {
        $plan->load('systemModules');
        $plan->loadCount('tenants');

        return $this->success(new PlanResource($plan));
    }

    // -------------------------------------------------------------------------
    // PUT /central/plans/{plan}
    // -------------------------------------------------------------------------

    public function update(StorePlanRequest $request, Plan $plan): JsonResponse
    {
        $data = $request->validated();
        $moduleKeys = $data['modules'] ?? null;
        unset($data['modules']);

        $plan->update($data);

        // Sync plan_modules si fournis
        if ($moduleKeys !== null) {
            // Supprimer les anciens et recréer
            PlanModule::where('plan_id', $plan->id)->delete();

            if (! empty($moduleKeys)) {
                $rows = array_map(fn (string $key) => [
                    'plan_id'    => $plan->id,
                    'module_key' => $key,
                    'is_enabled' => true,
                ], $moduleKeys);

                PlanModule::insert($rows);
            }
        }

        $plan->load('systemModules');
        $plan->loadCount('tenants');

        return $this->success(new PlanResource($plan), 'Plan mis à jour.');
    }

    // -------------------------------------------------------------------------
    // DELETE /central/plans/{plan}
    // -------------------------------------------------------------------------

    public function destroy(Plan $plan): JsonResponse
    {
        $activeTenants = $plan->tenants()
            ->whereIn('status', ['active', 'trial'])
            ->count();

        if ($activeTenants > 0) {
            return $this->error(
                "Impossible de supprimer ce plan : {$activeTenants} école(s) active(s) l'utilisent.",
                422
            );
        }

        $plan->delete();

        return $this->success(null, 'Plan supprimé.');
    }
}
