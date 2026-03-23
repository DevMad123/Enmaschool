<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\PeriodAverage;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PeriodAverage */
class PeriodAverageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                => $this->id,
            'average'           => $this->average !== null ? (float) $this->average : null,
            'weighted_average'  => $this->weighted_average !== null ? (float) $this->weighted_average : null,
            'coefficient'       => (float) $this->coefficient,
            'evaluations_count' => $this->evaluations_count,
            'absences_count'    => $this->absences_count,
            'rank'              => $this->rank,
            'class_average'     => $this->class_average !== null ? (float) $this->class_average : null,
            'min_score'         => $this->min_score !== null ? (float) $this->min_score : null,
            'max_score'         => $this->max_score !== null ? (float) $this->max_score : null,
            'is_passing'        => $this->is_passing,
            'is_final'          => $this->is_final,
            'calculated_at'     => $this->calculated_at?->toIso8601String(),
            'subject' => SubjectResource::make($this->whenLoaded('subject')),
            'period' => $this->when(
                $this->relationLoaded('period'),
                fn() => [
                    'id'   => $this->period->id,
                    'name' => $this->period->name,
                ],
            ),
            'student' => StudentListResource::make($this->whenLoaded('student')),
        ];
    }
}
