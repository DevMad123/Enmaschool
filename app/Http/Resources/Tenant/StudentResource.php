<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Student;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Student */
class StudentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'matricule'                => $this->matricule,
            'last_name'                => $this->last_name,
            'first_name'               => $this->first_name,
            'full_name'                => $this->full_name,
            'birth_date'               => $this->birth_date?->format('d/m/Y'),
            'birth_place'              => $this->birth_place,
            'age'                      => $this->age,
            'gender'                   => [
                'value' => $this->gender?->value,
                'label' => $this->gender?->label(),
                'short' => $this->gender?->short(),
            ],
            'nationality'              => $this->nationality,
            'birth_certificate_number' => $this->birth_certificate_number,
            'photo_url'                => $this->photo_url,
            'address'                  => $this->address,
            'city'                     => $this->city,
            'blood_type'               => $this->blood_type ? [
                'value' => $this->blood_type->value,
                'label' => $this->blood_type->label(),
            ] : null,
            'first_enrollment_year'    => $this->first_enrollment_year,
            'previous_school'          => $this->previous_school,
            'notes'                    => $this->when(
                $request->user()?->can('students.view_notes'),
                $this->notes
            ),
            'status'                   => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
                'color' => $this->status?->color(),
            ],
            'created_at'               => $this->created_at?->toISOString(),

            // Relations conditionnelles
            'current_enrollment'       => $this->when(
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
            'parents'                  => ParentResource::collection($this->whenLoaded('parents')),
            'enrollments'              => EnrollmentResource::collection($this->whenLoaded('enrollments')),
            'enrollments_count'        => $this->whenCounted('enrollments'),

            'can'                      => [
                'edit'        => $request->user()?->can('students.edit'),
                'delete'      => $request->user()?->can('students.delete'),
                'enroll'      => $request->user()?->can('students.create'),
                'view_grades' => $request->user()?->can('grades.view'),
            ],
        ];
    }
}
