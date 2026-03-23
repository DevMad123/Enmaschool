<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\TeacherClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TeacherClass */
class TeacherClassResource extends JsonResource
{
    /** Warning de surcharge — injecté manuellement si besoin. */
    public ?string $warning = null;

    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,

            'teacher'        => $this->when(
                $this->relationLoaded('teacher'),
                fn () => [
                    'id'         => $this->teacher?->id,
                    'full_name'  => $this->teacher?->full_name,
                    'email'      => $this->teacher?->email,
                    'avatar_url' => $this->teacher?->avatar_url,
                ]
            ),
            'classe'         => $this->when(
                $this->relationLoaded('classe'),
                fn () => new ClasseResource($this->classe)
            ),
            'subject'        => $this->when(
                $this->relationLoaded('subject'),
                fn () => new SubjectResource($this->subject)
            ),
            'academic_year'  => $this->when(
                $this->relationLoaded('academicYear'),
                fn () => [
                    'id'   => $this->academicYear?->id,
                    'name' => $this->academicYear?->name,
                ]
            ),

            'hours_per_week' => $this->hours_per_week,
            'effective_hours' => $this->effective_hours,
            'is_active'      => $this->is_active,
            'assigned_at'    => $this->assigned_at?->format('d/m/Y'),
            'notes'          => $this->notes,

            // Warning de surcharge (injecté par le controller)
            'warning'        => $this->warning,

            'created_at'     => $this->created_at?->toIso8601String(),
        ];
    }
}
