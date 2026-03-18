<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Subject;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Subject */
class SubjectResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'coefficient' => (float) $this->coefficient,
            'color' => $this->color,
            'category' => $this->category ? [
                'value' => $this->category->value,
                'label' => $this->category->label(),
                'color' => $this->category->color(),
            ] : null,
            'is_active' => $this->is_active,
            'created_at' => $this->created_at?->toIso8601String(),
            $this->mergeWhen($this->pivot !== null, fn () => [
                'coefficient_override' => $this->pivot?->coefficient_override ? (float) $this->pivot->coefficient_override : null,
                'effective_coefficient' => (float) ($this->pivot?->coefficient_override ?? $this->coefficient),
                'hours_per_week' => $this->pivot?->hours_per_week ? (float) $this->pivot->hours_per_week : null,
                'pivot_is_active' => $this->pivot?->is_active,
            ]),
        ];
    }
}
