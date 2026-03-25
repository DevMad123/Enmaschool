<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassPaymentSummaryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data   = $this->resource['summary'];
        $classe = $this->resource['classe'];
        $year   = $this->resource['year'];

        return [
            'classe'       => [
                'id'           => $classe->id,
                'display_name' => $classe->display_name,
            ],
            'academic_year' => [
                'id'   => $year->id,
                'name' => $year->name,
            ],
            'total_students'            => $data['total_students'],
            'fully_paid'                => $data['fully_paid'],
            'partial'                   => $data['partial'],
            'pending'                   => $data['pending'],
            'overdue'                   => $data['overdue'],
            'total_expected'            => $data['total_expected'],
            'total_collected'           => $data['total_collected'],
            'collection_rate'           => $data['collection_rate'],
            'total_expected_formatted'  => $data['total_expected_formatted'],
            'total_collected_formatted' => $data['total_collected_formatted'],
        ];
    }
}
