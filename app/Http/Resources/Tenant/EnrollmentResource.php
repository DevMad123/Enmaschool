<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Enrollment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Enrollment */
class EnrollmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'enrollment_number' => $this->enrollment_number,
            'enrollment_date'   => $this->enrollment_date?->format('d/m/Y'),
            'is_active'         => $this->is_active,
            'status'            => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
                'color' => $this->status?->color(),
            ],
            'transfer_note'     => $this->transfer_note,
            'student'           => new StudentListResource($this->whenLoaded('student')),
            'classe'            => new ClasseResource($this->whenLoaded('classe')),
            'academic_year'     => $this->whenLoaded('academicYear', fn () => [
                'id'   => $this->academicYear->id,
                'name' => $this->academicYear->name,
            ]),
            'transferred_from'  => $this->whenLoaded('transferredFromClasse', fn () => $this->transferredFromClasse ? [
                'id'           => $this->transferredFromClasse->id,
                'display_name' => $this->transferredFromClasse->display_name,
            ] : null),
            'created_at'        => $this->created_at?->toISOString(),
        ];
    }
}
