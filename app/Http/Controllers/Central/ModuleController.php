<?php
// ===== app/Http/Controllers/Central/ModuleController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\SystemModuleResource;
use App\Http\Resources\Central\TenantModuleResource;
use App\Models\Central\SystemModule;
use App\Models\Central\Tenant;
use App\Services\Central\ModuleService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ModuleController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ModuleService $moduleService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/modules
    // -------------------------------------------------------------------------

    public function index(): JsonResponse
    {
        $modules = SystemModule::orderBy('order')->get();

        return $this->success(SystemModuleResource::collection($modules));
    }

    // -------------------------------------------------------------------------
    // PUT /central/modules/{moduleKey}
    // -------------------------------------------------------------------------

    public function update(Request $request, string $moduleKey): JsonResponse
    {
        $module = SystemModule::where('key', $moduleKey)->firstOrFail();

        $validated = $request->validate([
            'is_active'     => ['sometimes', 'boolean'],
            'available_for' => ['sometimes', 'array'],
            'available_for.*' => ['string', 'in:maternelle,primary,college,lycee'],
        ]);

        if ($module->is_core && isset($validated['is_active']) && !$validated['is_active']) {
            return $this->error(
                "Le module «{$module->name}» est un module de base et ne peut pas être désactivé.",
                422
            );
        }

        $module->update($validated);

        return $this->success(new SystemModuleResource($module), 'Module mis à jour.');
    }

    // -------------------------------------------------------------------------
    // GET /central/tenants/{tenant}/modules
    // -------------------------------------------------------------------------

    public function getTenantModules(Tenant $tenant): JsonResponse
    {
        $modules = $this->moduleService->getModulesForTenant($tenant);

        $resources = collect($modules)->map(
            fn (array $m) => new TenantModuleResource($m)
        )->values();

        return $this->success($resources);
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants/{tenant}/modules/enable
    // -------------------------------------------------------------------------

    public function enableModule(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'module_key' => ['required', 'string', 'exists:central.system_modules,key'],
            'reason'     => ['nullable', 'string', 'max:500'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        $this->moduleService->enableModule(
            $tenant,
            $validated['module_key'],
            $admin,
            $validated['reason'] ?? null
        );

        return $this->success(null, "Module «{$validated['module_key']}» activé pour «{$tenant->name}».");
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants/{tenant}/modules/disable
    // -------------------------------------------------------------------------

    public function disableModule(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'module_key' => ['required', 'string', 'exists:central.system_modules,key'],
            'reason'     => ['nullable', 'string', 'max:500'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        // Refuse de désactiver un module core
        $module = SystemModule::where('key', $validated['module_key'])->firstOrFail();
        if ($module->is_core) {
            return $this->error(
                "Le module «{$module->name}» est un module de base et ne peut pas être désactivé.",
                422
            );
        }

        $this->moduleService->disableModule(
            $tenant,
            $validated['module_key'],
            $admin,
            $validated['reason'] ?? null
        );

        return $this->success(null, "Module «{$validated['module_key']}» désactivé pour «{$tenant->name}».");
    }
}
