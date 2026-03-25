<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AcademicDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'period'                  => $this->resource['period'],
            'overall'                 => $this->resource['overall'],
            'by_level'                => $this->resource['by_level'],
            'by_classe'               => $this->resource['by_classe'],
            'by_subject'              => $this->resource['by_subject'],
            'grade_distribution'      => $this->resource['grade_distribution'],
            'evaluations_this_period' => $this->resource['evaluations_this_period'],
            'generated_at'            => now()->toIso8601String(),
        ];
    }
}
