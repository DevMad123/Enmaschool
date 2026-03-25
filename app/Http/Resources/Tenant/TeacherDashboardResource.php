<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherDashboardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'teacher'          => $this->resource['teacher'],
            'classes'          => $this->resource['classes'],
            'this_week'        => $this->resource['this_week'],
            'recent_grades'    => $this->resource['recent_grades'],
            'pending_actions'  => $this->resource['pending_actions'],
            'generated_at'     => now()->toIso8601String(),
        ];
    }
}
