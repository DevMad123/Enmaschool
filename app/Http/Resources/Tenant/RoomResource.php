<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Room;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Room */
class RoomResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'code' => $this->code,
            'type' => [
                'value' => $this->type->value,
                'label' => $this->type->label(),
                'icon' => $this->type->icon(),
            ],
            'capacity' => $this->capacity,
            'floor' => $this->floor,
            'building' => $this->building,
            'equipment' => $this->equipment,
            'is_active' => $this->is_active,
        ];
    }
}
