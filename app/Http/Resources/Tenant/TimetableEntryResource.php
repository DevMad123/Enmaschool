<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\TimetableEntry;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TimetableEntry */
class TimetableEntryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'class_id'         => $this->class_id,
            'time_slot_id'     => $this->time_slot_id,
            'subject_id'       => $this->subject_id,
            'teacher_id'       => $this->teacher_id,
            'room_id'          => $this->room_id,
            'color'            => $this->color,
            'notes'            => $this->notes,
            'is_active'        => $this->is_active,

            // Relations conditionnelles
            'time_slot' => new TimeSlotResource($this->whenLoaded('timeSlot')),
            'subject'   => $this->whenLoaded('subject', fn () => [
                'id'   => $this->subject->id,
                'name' => $this->subject->name,
                'code' => $this->subject->code,
            ]),
            'teacher'   => $this->whenLoaded('teacher', fn () => [
                'id'        => $this->teacher->id,
                'full_name' => $this->teacher->full_name,
            ]),
            'room'      => $this->whenLoaded('room', fn () => [
                'id'   => $this->room->id,
                'name' => $this->room->name,
                'code' => $this->room->code,
            ]),
            'classe'    => $this->whenLoaded('classe', fn () => [
                'id'           => $this->classe->id,
                'display_name' => $this->classe->display_name,
            ]),
            'overrides' => TimetableOverrideResource::collection($this->whenLoaded('overrides')),

            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
