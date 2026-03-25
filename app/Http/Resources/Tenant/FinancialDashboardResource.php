<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class FinancialDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'summary'          => $this->resource['summary'],
            'by_status'        => $this->resource['by_status'],
            'by_fee_type'      => $this->resource['by_fee_type'],
            'by_level'         => $this->resource['by_level'],
            'monthly_trend'    => $this->resource['monthly_trend'],
            'by_method'        => $this->resource['by_method'],
            'overdue_students' => $this->resource['overdue_students'],
            'generated_at'     => now()->toIso8601String(),
        ];
    }
}
