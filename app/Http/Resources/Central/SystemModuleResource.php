<?php
// ===== app/Http/Resources/Central/SystemModuleResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Enums\ModuleKey;
use App\Models\Central\SystemModule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SystemModule */
class SystemModuleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var SystemModule $this */
        $key = $this->key instanceof ModuleKey ? $this->key->value : $this->key;

        return [
            'key'           => $key,
            'name'          => $this->name,
            'description'   => $this->description,
            'icon'          => $this->icon,
            'is_core'       => $this->is_core,
            'is_active'     => $this->is_active,
            'available_for' => $this->available_for ?? [],
            'order'         => $this->order,
        ];
    }
}
