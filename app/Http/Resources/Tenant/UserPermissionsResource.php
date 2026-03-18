<?php
// ===== app/Http/Resources/Tenant/UserPermissionsResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserPermissionsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'user_id'               => $this->resource['user_id'],
            'role'                  => $this->resource['role'],
            'all_permissions'       => $this->resource['all_permissions'],
            'permissions_by_module' => $this->resource['permissions_by_module'],
        ];
    }
}
