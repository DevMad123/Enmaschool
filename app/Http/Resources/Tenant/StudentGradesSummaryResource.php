<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentGradesSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'student'        => StudentListResource::make($this->resource['student']),
            'enrollment_id'  => $this->resource['enrollment_id'],
            'period_averages' => collect($this->resource['period_averages'])->map(fn($periodData) => [
                'period' => [
                    'id'    => $periodData['period']->id,
                    'name'  => $periodData['period']->name,
                    'order' => $periodData['period']->order,
                ],
                'averages' => collect($periodData['averages'])->map(fn($a) => [
                    'subject'    => SubjectResource::make($a['subject']),
                    'average'    => $a['average'] !== null ? (float) $a['average'] : null,
                    'rank'       => $a['rank'],
                    'is_passing' => $a['is_passing'],
                ]),
                'general_average' => $periodData['general_average'],
                'general_rank'    => $periodData['general_rank'],
            ]),
            'annual_averages' => collect($this->resource['annual_averages'])->map(fn($a) => [
                'subject'        => SubjectResource::make($a['subject']),
                'annual_average' => $a['annual_average'] !== null ? (float) $a['annual_average'] : null,
                'is_passing'     => $a['is_passing'],
            ]),
            'general_annual_average' => $this->resource['general_annual_average'],
        ];
    }
}
