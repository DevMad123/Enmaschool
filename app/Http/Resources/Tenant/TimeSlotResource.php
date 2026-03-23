<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\TimeSlot;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin TimeSlot */
class TimeSlotResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'               => $this->id,
            'name'             => $this->name,
            'day_of_week'      => [
                'value' => $this->day_of_week?->value,
                'label' => $this->day_of_week?->label(),
                'short' => $this->day_of_week?->short(),
            ],
            'start_time'       => $this->start_time,
            'end_time'         => $this->end_time,
            'duration_minutes' => $this->duration_minutes,
            'is_break'         => $this->is_break,
            'order'            => $this->order,
            'is_active'        => $this->is_active,
        ];
    }
}
