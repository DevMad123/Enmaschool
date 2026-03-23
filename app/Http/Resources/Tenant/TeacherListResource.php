<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use App\Http\Resources\Tenant\SubjectResource;

/** @mixin Teacher */
class TeacherListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'user_id'          => $this->user_id,
            'full_name'        => $this->full_name,
            'email'            => $this->email,
            'avatar_url'       => $this->avatar_url,
            'employee_number'  => $this->employee_number,
            'speciality'       => $this->speciality,
            'contract_type'    => $this->contract_type ? [
                'value' => $this->contract_type->value,
                'label' => $this->contract_type->label(),
                'color' => $this->contract_type->color(),
            ] : null,
            'is_active'        => $this->is_active,
            'weekly_hours_max' => $this->weekly_hours_max,
            'subjects'         => SubjectResource::collection($this->whenLoaded('subjects')),
            'subjects_count'   => $this->whenCounted('subjects'),
            'assignments_count' => $this->whenCounted('active_assignments_count', fn () => $this->active_assignments_count),
            'weekly_hours'     => (float) ($this->weekly_hours_sum ?? 0),
        ];
    }
}
