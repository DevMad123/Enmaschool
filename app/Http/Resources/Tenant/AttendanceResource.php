<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Attendance;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Attendance */
class AttendanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'date'        => $this->date?->format('d/m/Y'),
            'status'      => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'short' => $this->status->short(),
                'color' => $this->status->color(),
            ],
            'minutes_late' => $this->minutes_late,
            'note'         => $this->note,
            'is_absent'    => $this->is_absent,
            'is_present'   => $this->is_present,
            'recorded_at'  => $this->recorded_at?->format('d/m/Y H:i'),

            'recorded_by' => $this->when(
                $this->relationLoaded('recordedBy') && $this->recordedBy,
                fn () => [
                    'id'        => $this->recordedBy->id,
                    'full_name' => $this->recordedBy->full_name,
                ]
            ),

            'enrollment' => $this->when(
                $this->relationLoaded('enrollment') && $this->enrollment,
                fn () => [
                    'id'      => $this->enrollment->id,
                    'student' => new StudentListResource($this->enrollment->student),
                ]
            ),

            'timetable_entry' => $this->when(
                $this->relationLoaded('timetableEntry') && $this->timetableEntry,
                fn () => [
                    'id'        => $this->timetableEntry->id,
                    'subject'   => $this->timetableEntry->relationLoaded('subject')
                        ? [
                            'name'  => $this->timetableEntry->subject?->name,
                            'code'  => $this->timetableEntry->subject?->code,
                            'color' => $this->timetableEntry->subject?->color,
                        ]
                        : null,
                    'time_slot' => $this->timetableEntry->relationLoaded('timeSlot')
                        ? [
                            'time_range' => sprintf(
                                '%s – %s',
                                substr($this->timetableEntry->timeSlot?->start_time ?? '', 0, 5),
                                substr($this->timetableEntry->timeSlot?->end_time ?? '', 0, 5)
                            ),
                            'day_label'  => $this->timetableEntry->timeSlot?->day_of_week?->label(),
                        ]
                        : null,
                ]
            ),

            'period' => $this->when(
                $this->relationLoaded('period') && $this->period,
                fn () => [
                    'id'   => $this->period->id,
                    'name' => $this->period->name,
                ]
            ),
        ];
    }
}
