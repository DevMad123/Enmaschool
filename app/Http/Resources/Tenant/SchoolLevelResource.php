<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\SchoolLevel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolLevel */
class SchoolLevelResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'code' => $this->code->value,
            'category' => [
                'value' => $this->category->value,
                'label' => $this->category->label(),
                'color' => $this->category->color(),
            ],
            'label' => $this->label,
            'short_label' => $this->short_label,
            'order' => $this->order,
            'requires_serie' => $this->requires_serie,
            'is_active' => $this->is_active,
        ];
    }
}
