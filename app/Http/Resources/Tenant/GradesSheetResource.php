<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class GradesSheetResource extends JsonResource
{
    /**
     * @param array{
     *   evaluations: \Illuminate\Support\Collection,
     *   students: \Illuminate\Support\Collection,
     *   class_stats: array,
     *   classe: \App\Models\Tenant\Classe,
     *   subject: \App\Models\Tenant\Subject,
     *   period: \App\Models\Tenant\Period,
     * } $resource
     */
    public function toArray(Request $request): array
    {
        return [
            'classe' => [
                'id'           => $this->resource['classe']->id,
                'display_name' => $this->resource['classe']->display_name,
            ],
            'subject' => SubjectResource::make($this->resource['subject']),
            'period' => [
                'id'    => $this->resource['period']->id,
                'name'  => $this->resource['period']->name,
                'order' => $this->resource['period']->order,
            ],
            'evaluations' => EvaluationResource::collection($this->resource['evaluations']),
            'students'    => collect($this->resource['students'])->map(fn($row) => [
                'student'       => StudentListResource::make($row['student']),
                'enrollment_id' => $row['enrollment_id'],
                'grades'        => $row['grades'],
                'period_average' => $row['period_average'],
                'absences_count' => $row['absences_count'],
            ])->values(),
            'class_stats' => $this->resource['class_stats'],
        ];
    }
}
