<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Grade;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Grade */
class GradeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                 => $this->id,
            'score'              => $this->score !== null ? (float) $this->score : null,
            'score_on_20'        => $this->score_on_20,
            'is_absent'          => $this->is_absent,
            'absence_justified'  => $this->absence_justified,
            'comment'            => $this->comment,
            'is_passing'         => $this->is_passing,
            'entered_at'         => $this->entered_at?->toIso8601String(),
            'entered_by' => $this->when(
                $this->relationLoaded('enteredBy') && $this->enteredBy,
                fn() => [
                    'id'        => $this->enteredBy->id,
                    'full_name' => $this->enteredBy->full_name,
                ],
            ),
            'student' => StudentListResource::make($this->whenLoaded('student')),
            'evaluation' => $this->when(
                $this->relationLoaded('evaluation'),
                fn() => $this->evaluation ? [
                    'id'          => $this->evaluation->id,
                    'title'       => $this->evaluation->title,
                    'max_score'   => (float) $this->evaluation->max_score,
                    'coefficient' => (float) $this->evaluation->coefficient,
                ] : null,
            ),
        ];
    }
}
