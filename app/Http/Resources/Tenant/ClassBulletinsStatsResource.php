<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassBulletinsStatsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return $this->resource;
    }
}
