<?php
// ===== app/Http/Resources/Central/TenantResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\Tenant;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Tenant */
class TenantResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Tenant $this */

        // School types label
        $schoolTypes = [];
        if ($this->has_maternelle) {
            $schoolTypes[] = 'Maternelle';
        }
        if ($this->has_primary) {
            $schoolTypes[] = 'Primaire';
        }
        if ($this->has_college) {
            $schoolTypes[] = 'Collège';
        }
        if ($this->has_lycee) {
            $schoolTypes[] = 'Lycée';
        }

        $profile = $this->whenLoaded('profile');
        $plan    = $this->whenLoaded('plan');
        $sub     = $this->whenLoaded('currentSubscription');

        // Compute trial days left
        $trialDaysLeft = null;
        if ($this->trial_ends_at !== null) {
            $diff = (int) now()->diffInDays($this->trial_ends_at, false);
            $trialDaysLeft = max(0, $diff);
        }

        $isOnTrial = $this->trial_ends_at !== null && $this->trial_ends_at->isFuture();

        return [
            'id'                  => $this->id,
            'name'                => $this->name,
            'slug'                => $this->slug,
            'status'              => $this->status?->value,
            'status_label'        => $this->status?->label(),
            'status_color'        => $this->status?->color(),
            'has_maternelle'      => $this->has_maternelle,
            'has_primary'         => $this->has_primary,
            'has_college'         => $this->has_college,
            'has_lycee'           => $this->has_lycee,
            'school_types_label'  => implode(', ', $schoolTypes),

            'profile' => $this->whenLoaded('profile', fn () => [
                'logo'     => $profile->logo,
                'address'  => $profile->address,
                'phone'    => $profile->phone,
                'email'    => $profile->email,
                'city'     => $profile->city,
                'country'  => $profile->country,
                'timezone' => $profile->timezone,
                'language' => $profile->language,
                'currency' => $profile->currency,
            ]),

            'plan' => $this->whenLoaded('plan', fn () => [
                'id'   => $plan->id,
                'name' => $plan->name,
                'slug' => $plan->slug,
            ]),

            'current_subscription' => $this->whenLoaded('currentSubscription', function () use ($sub) {
                if ($sub === null) {
                    return null;
                }
                return [
                    'status'        => $sub->status?->value,
                    'trial_ends_at' => $sub->trial_ends_at?->toIso8601String(),
                    'ends_at'       => $sub->ends_at?->toIso8601String(),
                    'days_left'     => $sub->daysLeft(),
                ];
            }),

            'active_modules'  => $this->whenLoaded('tenantModules', fn () => $this->getActiveModules()),
            'trial_days_left' => $trialDaysLeft,
            'is_on_trial'     => $isOnTrial,
            'created_at'      => $this->created_at?->toIso8601String(),
            'updated_at'      => $this->updated_at?->toIso8601String(),
        ];
    }
}
