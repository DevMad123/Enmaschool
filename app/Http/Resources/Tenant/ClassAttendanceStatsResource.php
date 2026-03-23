<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Classe;
use App\Models\Tenant\Period;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassAttendanceStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data      = is_array($this->resource) ? $this->resource : (array) $this->resource;
        $classe    = $data['classe']    ?? null;
        $period    = $data['period']    ?? null;
        $students  = $data['students']  ?? [];
        $threshold = (float) ($data['threshold'] ?? 80.0);

        $totalStudents = count($students);
        $avgRate = $totalStudents > 0
            ? round(array_sum(array_column($students, 'attendance_rate')) / $totalStudents, 1)
            : 100.0;
        $atRisk = count(array_filter($students, fn ($s) => ($s['attendance_rate'] ?? 100) < $threshold));

        return [
            'classe' => $classe instanceof Classe
                ? ['id' => $classe->id, 'display_name' => $classe->display_name]
                : $classe,

            'period' => $period instanceof Period
                ? ['id' => $period->id, 'name' => $period->name]
                : $period,

            'date' => $data['date'] ?? null,

            'summary' => [
                'total_students'      => $totalStudents,
                'avg_attendance_rate' => $avgRate,
                'students_at_risk'    => $atRisk,
            ],

            'students' => collect($students)->map(
                fn ($s) => (new StudentAttendanceStatsResource($s, $threshold))->toArray($request)
            )->values()->all(),
        ];
    }
}
