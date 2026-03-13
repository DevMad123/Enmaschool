<?php
// ===== app/Http/Resources/Central/SystemSettingResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Models\Central\SystemSetting;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SystemSetting */
class SystemSettingResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var SystemSetting $this */
        return [
            'key'         => $this->key,
            'value'       => $this->getCastedValue(),
            'type'        => $this->type,
            'group'       => $this->group,
            'label'       => $this->label,
            'description' => $this->description,
            'is_public'   => $this->is_public,
        ];
    }
}
