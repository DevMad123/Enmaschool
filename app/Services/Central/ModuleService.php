<?php
// ===== app/Services/Central/ModuleService.php =====

declare(strict_types=1);

namespace App\Services\Central;

use App\Enums\ModuleKey;
use App\Models\Central\Plan;
use App\Models\Central\PlanModule;
use App\Models\Central\SuperAdmin;
use App\Models\Central\SystemModule;
use App\Models\Central\Tenant;
use App\Models\Central\TenantModule;

class ModuleService
{
    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {}

    /**
     * Retourne la liste de tous les modules avec leur statut is_enabled
     * pour un tenant donné (plan + overrides).
     *
     * @return list<array{
     *   key: string,
     *   name: string,
     *   icon: string|null,
     *   is_core: bool,
     *   is_enabled: bool,
     *   in_plan: bool,
     *   has_override: bool,
     * }>
     */
    public function getModulesForTenant(Tenant $tenant): array
    {
        $allModules = SystemModule::active()->orderBy('order')->get();

        $planModuleKeys = PlanModule::where('plan_id', $tenant->plan_id)
            ->where('is_enabled', true)
            ->pluck('module_key')
            ->toArray();

        $tenantOverrides = TenantModule::where('tenant_id', $tenant->id)
            ->get()
            ->keyBy('module_key');

        return $allModules->map(function (SystemModule $module) use ($planModuleKeys, $tenantOverrides): array {
            $keyValue = $module->key instanceof ModuleKey
                ? $module->key->value
                : (string) $module->key;

            $inPlan   = in_array($keyValue, $planModuleKeys, true);
            $override = $tenantOverrides->get($keyValue);

            $isEnabled = $override !== null
                ? (bool) $override->is_enabled
                : $inPlan;

            return [
                'key'          => $keyValue,
                'name'         => $module->name,
                'icon'         => $module->icon,
                'is_core'      => $module->is_core,
                'is_enabled'   => $isEnabled,
                'in_plan'      => $inPlan,
                'has_override' => $override !== null,
            ];
        })->all();
    }

    /**
     * Active un module pour un tenant (override manuel).
     */
    public function enableModule(
        Tenant $tenant,
        string $moduleKey,
        SuperAdmin $by,
        ?string $reason = null
    ): void {
        TenantModule::updateOrCreate(
            ['tenant_id' => $tenant->id, 'module_key' => $moduleKey],
            [
                'is_enabled'      => true,
                'enabled_at'      => now(),
                'disabled_at'     => null,
                'enabled_by'      => $by->id,
                'override_reason' => $reason,
            ]
        );

        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: 'update',
            description: "Module «{$moduleKey}» activé pour le tenant «{$tenant->name}»",
            extra: [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
                'module'      => $moduleKey,
                'properties'  => ['reason' => $reason],
            ]
        );
    }

    /**
     * Désactive un module pour un tenant (override manuel).
     */
    public function disableModule(
        Tenant $tenant,
        string $moduleKey,
        SuperAdmin $by,
        ?string $reason = null
    ): void {
        TenantModule::updateOrCreate(
            ['tenant_id' => $tenant->id, 'module_key' => $moduleKey],
            [
                'is_enabled'      => false,
                'disabled_at'     => now(),
                'enabled_at'      => null,
                'disabled_by'     => $by->id,
                'override_reason' => $reason,
            ]
        );

        $this->activityLogService->logSuperAdminAction(
            admin: $by,
            type: 'update',
            description: "Module «{$moduleKey}» désactivé pour le tenant «{$tenant->name}»",
            extra: [
                'tenant_id'   => $tenant->id,
                'tenant_name' => $tenant->name,
                'module'      => $moduleKey,
                'properties'  => ['reason' => $reason],
            ]
        );
    }

    /**
     * Synchronise les tenant_modules selon le nouveau plan.
     * Les overrides manuels (enabled_by/disabled_by ou override_reason) sont préservés.
     */
    public function syncModulesFromPlan(Tenant $tenant, Plan $plan): void
    {
        $planModuleKeys = PlanModule::where('plan_id', $plan->id)
            ->where('is_enabled', true)
            ->pluck('module_key')
            ->toArray();

        $existingModules = TenantModule::where('tenant_id', $tenant->id)
            ->get()
            ->keyBy('module_key');

        foreach (ModuleKey::cases() as $module) {
            $key      = $module->value;
            $existing = $existingModules->get($key);
            $inPlan   = in_array($key, $planModuleKeys, true);

            // Préserver les overrides manuels
            $isManualOverride = $existing !== null && (
                $existing->override_reason !== null
                || $existing->enabled_by !== null
                || $existing->disabled_by !== null
            );

            if ($isManualOverride) {
                continue;
            }

            TenantModule::updateOrCreate(
                ['tenant_id' => $tenant->id, 'module_key' => $key],
                [
                    'is_enabled'  => $inPlan,
                    'enabled_at'  => $inPlan ? now() : null,
                    'disabled_at' => $inPlan ? null : now(),
                ]
            );
        }
    }
}
