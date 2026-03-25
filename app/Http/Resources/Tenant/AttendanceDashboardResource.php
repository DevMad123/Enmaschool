<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AttendanceDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'today'            => $this->resource['today'],
            'period'           => $this->resource['period'],
            'at_risk_students' => $this->resource['at_risk_students'],
            'by_day'           => $this->resource['by_day'],
            'by_class'         => $this->resource['by_class'],
            'justifications'   => $this->resource['justifications'],
            'generated_at'     => now()->toIso8601String(),
        ];
    }
}
