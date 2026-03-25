<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\FeeType;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FeeType */
class FeeTypeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'name'         => $this->name,
            'code'         => $this->code,
            'description'  => $this->description,
            'is_mandatory' => $this->is_mandatory,
            'is_recurring' => $this->is_recurring,
            'applies_to'   => [
                'value' => $this->applies_to?->value,
                'label' => $this->applies_to?->label(),
            ],
            'order'           => $this->order,
            'is_active'       => $this->is_active,
            'schedules_count' => $this->whenCounted('schedules'),
        ];
    }
}
