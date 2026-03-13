<?php
// ===== app/Http/Resources/Central/SubscriptionResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Enums\SubscriptionStatus;
use App\Models\Central\Subscription;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subscription */
class SubscriptionResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var Subscription $this */
        $status = $this->status instanceof SubscriptionStatus
            ? $this->status
            : SubscriptionStatus::tryFrom((string) $this->status);

        return [
            'id'                   => $this->id,
            'status'               => $status?->value,
            'status_label'         => $status?->label(),
            'status_color'         => $status?->color(),

            'plan' => $this->whenLoaded('plan', fn () => [
                'id'   => $this->plan->id,
                'name' => $this->plan->name,
            ]),

            'starts_at'            => $this->starts_at?->toIso8601String(),
            'ends_at'              => $this->ends_at?->toIso8601String(),
            'trial_ends_at'        => $this->trial_ends_at?->toIso8601String(),
            'days_left'            => $this->daysLeft(),
            'billing_cycle'        => $this->billing_cycle,
            'price_paid'           => $this->price_paid,
            'cancelled_at'         => $this->cancelled_at?->toIso8601String(),
            'cancellation_reason'  => $this->cancellation_reason,
            'notes'                => $this->notes,
        ];
    }
}
