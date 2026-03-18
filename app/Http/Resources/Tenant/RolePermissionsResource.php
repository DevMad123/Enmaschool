<?php
// ===== app/Http/Resources/Tenant/RolePermissionsResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class RolePermissionsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'name'                  => $this->resource['name'],
            'label'                 => $this->resource['label'],
            'permissions_count'     => $this->resource['permissions_count'],
            'permissions_by_module' => $this->resource['permissions_by_module'],
        ];
    }
}
