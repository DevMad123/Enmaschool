<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentAttendanceStatsResource extends JsonResource
{
    /** @var float */
    private float $threshold;

    public function __construct(mixed $resource, float $threshold = 80.0)
    {
        parent::__construct($resource);
        $this->threshold = $threshold;
    }

    public function toArray(Request $request): array
    {
        $data = is_array($this->resource) ? $this->resource : (array) $this->resource;

        $student    = $data['student']    ?? null;
        $period     = $data['period']     ?? null;
        $rate       = (float) ($data['attendance_rate'] ?? 100.0);
        $enrollmentId = $data['enrollment_id'] ?? null;

        return [
            'enrollment_id'      => $enrollmentId,
            'student'            => $student ? new StudentListResource($student) : null,
            'period'             => $period ? ['id' => $period->id, 'name' => $period->name] : null,
            'total_courses'      => $data['total_courses']      ?? 0,
            'present'            => $data['present']            ?? 0,
            'absent'             => $data['absent']             ?? 0,
            'late'               => $data['late']               ?? 0,
            'excused'            => $data['excused']            ?? 0,
            'total_absent_hours' => $data['total_absent_hours'] ?? 0.0,
            'absent_hours'       => $data['absent_hours']       ?? 0.0,
            'excused_hours'      => $data['excused_hours']      ?? 0.0,
            'attendance_rate'    => $rate,
            'is_at_risk'         => $rate < $this->threshold,
        ];
    }
}
