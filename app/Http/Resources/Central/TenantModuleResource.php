<?php
// ===== app/Http/Resources/Central/TenantModuleResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Enums\ModuleKey;
use App\Models\Central\SystemModule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $moduleKey = $this->resource['key'] ?? null;
        $moduleName = $this->resource['name'] ?? null;
        $moduleIcon = $this->resource['icon'] ?? null;
        $isCore     = $this->resource['is_core'] ?? false;
        $isEnabled  = $this->resource['is_enabled'] ?? false;
        $inPlan     = $this->resource['in_plan'] ?? false;
        $hasOverride = $this->resource['has_override'] ?? false;

        return [
            'module_key'     => $moduleKey,
            'module_name'    => $moduleName,
            'module_icon'    => $moduleIcon,
            'is_enabled'     => $isEnabled,
            'is_core'        => $isCore,
            'in_plan'        => $inPlan,
            'has_override'   => $hasOverride,
            'enabled_at'     => $this->resource['enabled_at'] ?? null,
            'disabled_at'    => $this->resource['disabled_at'] ?? null,
            'override_reason' => $this->resource['override_reason'] ?? null,
        ];
    }
}
