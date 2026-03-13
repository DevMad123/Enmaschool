<?php
// ===== app/Http/Resources/Central/TenantStatsResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TenantStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'students_count'   => $this->resource['students_count'] ?? 0,
            'teachers_count'   => $this->resource['teachers_count'] ?? 0,
            'users_count'      => $this->resource['users_count'] ?? 0,
            'classes_count'    => $this->resource['classes_count'] ?? 0,
            'storage_used_mb'  => $this->resource['storage_used_mb'] ?? 0,
        ];
    }
}
