<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Student */
class StudentListResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $enrollment = $this->whenLoaded('currentEnrollment');

        return [
            'id'                  => $this->id,
            'matricule'           => $this->matricule,
            'full_name'           => $this->full_name,
            'first_name'          => $this->first_name,
            'last_name'           => $this->last_name,
            'photo_url'           => $this->photo_url,
            'gender'              => [
                'value' => $this->gender?->value,
                'short' => $this->gender?->short(),
                'label' => $this->gender?->label(),
            ],
            'birth_date'          => $this->birth_date?->format('d/m/Y'),
            'age'                 => $this->age,
            'status'              => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
                'color' => $this->status?->color(),
            ],
            'current_classe_name' => $this->whenLoaded(
                'currentEnrollment',
                fn () => $this->currentEnrollment?->classe?->display_name
            ),
            'current_enrollment'  => $this->when(
                $this->relationLoaded('currentEnrollment') && $this->currentEnrollment,
                fn () => [
                    'id'               => $this->currentEnrollment->id,
                    'enrollment_number' => $this->currentEnrollment->enrollment_number,
                    'enrollment_date'  => $this->currentEnrollment->enrollment_date?->format('d/m/Y'),
                    'status'           => [
                        'value' => $this->currentEnrollment->status?->value,
                        'label' => $this->currentEnrollment->status?->label(),
                    ],
                    'classe'           => $this->currentEnrollment->relationLoaded('classe')
                        ? new ClasseResource($this->currentEnrollment->classe)
                        : null,
                ]
            ),
        ];
    }
}
