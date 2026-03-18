<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\SchoolSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SchoolSetting */
class SchoolSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'key' => $this->key,
            'value' => SchoolSetting::get($this->key),
            'type' => $this->type->value,
            'group' => $this->group->value,
            'label' => $this->label,
            'description' => $this->description,
        ];
    }
}
