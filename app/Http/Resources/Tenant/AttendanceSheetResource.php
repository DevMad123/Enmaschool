<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceSheetResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $entry   = $this->resource['entry']   ?? null;
        $summary = $this->resource['summary'] ?? [];
        $students = $this->resource['students'] ?? [];

        return [
            'entry'       => $entry ? new TimetableEntryResource($entry) : null,
            'date'        => $this->resource['date'] ?? null,
            'is_recorded' => $this->resource['is_recorded'] ?? false,

            'summary' => [
                'present'         => $summary['present']         ?? 0,
                'absent'          => $summary['absent']          ?? 0,
                'late'            => $summary['late']            ?? 0,
                'excused'         => $summary['excused']         ?? 0,
                'total'           => $summary['total']           ?? 0,
                'attendance_rate' => $summary['attendance_rate'] ?? 0.0,
            ],

            'students' => collect($students)->map(fn ($row) => [
                'enrollment_id' => $row['enrollment_id'],
                'student'       => $row['student'] ? new StudentListResource($row['student']) : null,
                'attendance'    => $row['attendance'] ? new AttendanceResource($row['attendance']) : null,
                'status'        => $row['status'] instanceof \App\Enums\AttendanceStatus
                    ? $row['status']->value
                    : $row['status'],
                'status_label'  => $row['status'] instanceof \App\Enums\AttendanceStatus
                    ? $row['status']->label()
                    : null,
                'status_color'  => $row['status'] instanceof \App\Enums\AttendanceStatus
                    ? $row['status']->color()
                    : null,
            ])->values()->all(),
        ];
    }
}
