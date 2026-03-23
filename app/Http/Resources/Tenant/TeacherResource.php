<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Teacher;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Teacher */
class TeacherResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                      => $this->id,

            // Données user
            'user_id'                 => $this->user_id,
            'full_name'               => $this->full_name,
            'email'                   => $this->email,
            'phone'                   => $this->user?->phone,
            'avatar_url'              => $this->avatar_url,
            'status'                  => $this->user?->status ? [
                'value' => $this->user->status->value,
                'label' => $this->user->status->label(),
                'color' => $this->user->status->color(),
            ] : null,

            // Profil pédagogique
            'employee_number'         => $this->employee_number,
            'speciality'              => $this->speciality,
            'diploma'                 => $this->diploma,
            'hire_date'               => $this->hire_date?->format('d/m/Y'),
            'contract_type'           => $this->contract_type ? [
                'value' => $this->contract_type->value,
                'label' => $this->contract_type->label(),
                'color' => $this->contract_type->color(),
            ] : null,
            'weekly_hours_max'        => $this->weekly_hours_max,
            'biography'               => $this->biography,
            'is_active'               => $this->is_active,

            // Calculé
            'weekly_hours'            => $this->weekly_hours,
            'weekly_hours_remaining'  => $this->weekly_hours_remaining,
            'is_overloaded'           => $this->isOverloaded(),

            // Relations conditionnelles
            'subjects'                => SubjectResource::collection($this->whenLoaded('subjects')),
            'primary_subject'         => $this->when(
                $this->relationLoaded('subjects'),
                fn () => $this->subjects->first(fn ($s) => $s->pivot?->is_primary)
                    ? new SubjectResource($this->subjects->first(fn ($s) => $s->pivot?->is_primary))
                    : null
            ),
            'assignments'             => TeacherClassResource::collection($this->whenLoaded('assignments')),
            'assignments_count'       => $this->whenCounted('assignments'),
            'classes_count'           => $this->whenCounted('classes'),

            'created_at'              => $this->created_at?->toIso8601String(),
        ];
    }
}
