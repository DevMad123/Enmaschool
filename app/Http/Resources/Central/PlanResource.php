<?php
// ===== app/Http/Resources/Central/PlanResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\Plan;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Plan */
class PlanResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Plan $this */
        return [
            'id'              => $this->id,
            'name'            => $this->name,
            'slug'            => $this->slug,
            'price_monthly'   => $this->price_monthly,
            'price_yearly'    => $this->price_yearly,
            'trial_days'      => $this->trial_days,
            'max_students'    => $this->max_students,
            'max_teachers'    => $this->max_teachers,
            'max_storage_gb'  => $this->max_storage_gb,
            'is_active'       => $this->is_active,
            'features'        => $this->features ?? [],

            'modules' => $this->whenLoaded('systemModules', function () {
                return $this->systemModules->map(fn ($module) => [
                    'key'        => $module->key instanceof \App\Enums\ModuleKey
                        ? $module->key->value
                        : $module->key,
                    'name'       => $module->name,
                    'is_enabled' => (bool) $module->pivot?->is_enabled,
                ])->values();
            }),

            'tenants_count' => $this->whenCounted('tenants', fn () => $this->tenants_count),
        ];
    }
}
