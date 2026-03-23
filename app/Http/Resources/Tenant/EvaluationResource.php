<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Evaluation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Evaluation */
class EvaluationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'title'       => $this->title,
            'type'        => [
                'value' => $this->type->value,
                'label' => $this->type->label(),
                'short' => $this->type->short(),
                'color' => $this->type->color(),
            ],
            'date'        => $this->date?->format('d/m/Y'),
            'max_score'   => (float) $this->max_score,
            'coefficient' => (float) $this->coefficient,
            'is_published' => $this->is_published,
            'is_locked'   => $this->is_locked,
            'is_editable' => $this->isEditable(),
            'description' => $this->description,
            'grades_count' => $this->whenCounted('grades'),
            'average_score' => $this->when(
                $this->relationLoaded('grades'),
                fn() => $this->average_score,
            ),
            'classe' => $this->when(
                $this->relationLoaded('classe'),
                fn() => [
                    'id'           => $this->classe->id,
                    'display_name' => $this->classe->display_name,
                ],
            ),
            'subject' => SubjectResource::make($this->whenLoaded('subject')),
            'period' => $this->when(
                $this->relationLoaded('period'),
                fn() => [
                    'id'   => $this->period->id,
                    'name' => $this->period->name,
                    'type' => $this->period->type,
                ],
            ),
            'teacher' => $this->when(
                $this->relationLoaded('teacher'),
                fn() => $this->teacher ? [
                    'id'        => $this->teacher->id,
                    'full_name' => $this->teacher->full_name,
                ] : null,
            ),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
