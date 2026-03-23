<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class TeacherWorkloadResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var array $data */
        $data = $this->resource;

        $totalHours = (float) ($data['total_hours'] ?? 0);
        $maxHours   = (float) ($data['max_hours'] ?? 0);

        return [
            'teacher_id'       => $data['teacher_id'] ?? null,
            'total_hours'      => $totalHours,
            'max_hours'        => $maxHours,
            'remaining_hours'  => (float) ($data['remaining_hours'] ?? 0),
            'is_overloaded'    => (bool) ($data['is_overloaded'] ?? false),
            'overload_hours'   => max(0.0, $totalHours - $maxHours),
            'assignments'      => array_map(
                fn ($a) => [
                    'classe'         => $a['classe'] ?? null,
                    'subject'        => $a['subject'] ?? null,
                    'hours'          => (float) ($a['hours'] ?? 0),
                    'level_category' => $a['level_category'] ?? null,
                ],
                $data['assignments'] ?? []
            ),
        ];
    }
}
