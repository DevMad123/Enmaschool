<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\AcademicYear;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin AcademicYear */
class AcademicYearResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],
            'start_date' => $this->start_date->toDateString(),
            'end_date' => $this->end_date->toDateString(),
            'period_type' => [
                'value' => $this->period_type->value,
                'label' => $this->period_type->label(),
            ],
            'is_current' => $this->is_current,
            'passing_average' => (float) $this->passing_average,
            'promotion_type' => [
                'value' => $this->promotion_type->value,
                'label' => $this->promotion_type->label(),
            ],
            'closed_at' => $this->closed_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'periods' => PeriodResource::collection($this->whenLoaded('periods')),
        ];
    }
}
