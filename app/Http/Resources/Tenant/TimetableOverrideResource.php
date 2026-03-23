<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\TimetableOverride;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TimetableOverride */
class TimetableOverrideResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'timetable_entry_id'  => $this->timetable_entry_id,
            'date'                => $this->date?->format('Y-m-d'),
            'type'                => [
                'value' => $this->type?->value,
                'label' => $this->type?->label(),
                'color' => $this->type?->color(),
            ],
            'reason'              => $this->reason,
            'notified_at'         => $this->notified_at?->toIso8601String(),

            'substitute_teacher'  => $this->whenLoaded('substituteTeacher', fn () => [
                'id'        => $this->substituteTeacher->id,
                'full_name' => $this->substituteTeacher->full_name,
            ]),
            'new_room'            => $this->whenLoaded('newRoom', fn () => [
                'id'   => $this->newRoom->id,
                'name' => $this->newRoom->name,
            ]),
            'rescheduled_to_slot' => new TimeSlotResource($this->whenLoaded('rescheduledToSlot')),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
