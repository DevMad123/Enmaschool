<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DirectionDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'school'          => $this->resource['school'],
            'students'        => $this->resource['students'],
            'staff'           => $this->resource['staff'],
            'academic'        => $this->resource['academic'],
            'attendance'      => $this->resource['attendance'],
            'finance'         => $this->resource['finance'],
            'bulletins'       => $this->resource['bulletins'],
            'recent_activity' => $this->resource['recent_activity'] ?? [],
            'generated_at'    => now()->toIso8601String(),
            'cache_ttl'       => 300,
        ];
    }
}
