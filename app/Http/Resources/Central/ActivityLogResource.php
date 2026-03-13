<?php
// ===== app/Http/Resources/Central/ActivityLogResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Enums\ActivityType;
use App\Models\Central\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ActivityLog */
class ActivityLogResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var ActivityLog $this */
        $activityType = $this->activity_type instanceof ActivityType
            ? $this->activity_type
            : (ActivityType::tryFrom((string) $this->activity_type));

        return [
            'id'             => $this->id,
            'log_type'       => $this->log_type,
            'actor_type'     => $this->actor_type,
            'actor_name'     => $this->actor_name,
            'tenant_name'    => $this->tenant_name,
            'activity_type'  => $activityType?->value,
            'activity_label' => $activityType?->label(),
            'module'         => $this->module,
            'description'    => $this->description,
            'subject_name'   => $this->subject_name,
            'properties'     => $this->properties ?? [],
            'ip_address'     => $this->ip_address,
            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
