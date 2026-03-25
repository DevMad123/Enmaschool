<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class StudentBalanceResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $data = $this->resource;

        $enrollment    = $data['enrollment'];
        $fees          = $data['fees'];
        $totalDue      = $data['total_due'];
        $totalDiscount = $data['total_discount'];
        $totalPaid     = $data['total_paid'];
        $totalRemaining = $data['total_remaining'];

        $paymentPct = $totalDue > 0
            ? min(100, round((($totalDue - $totalDiscount - $totalRemaining) / max(1, $totalDue - $totalDiscount)) * 100, 1))
            : 100.0;

        return [
            'enrollment_id'             => $enrollment->id,
            'student'                   => StudentListResource::make($enrollment->student),
            'academic_year'             => [
                'id'   => $enrollment->academicYear->id,
                'name' => $enrollment->academicYear->name,
            ],
            'total_due'                 => $totalDue,
            'total_discount'            => $totalDiscount,
            'total_paid'                => $totalPaid,
            'total_remaining'           => $totalRemaining,
            'total_due_formatted'       => number_format($totalDue, 0, ',', ' ') . ' FCFA',
            'total_remaining_formatted' => number_format($totalRemaining, 0, ',', ' ') . ' FCFA',
            'is_fully_paid'             => $data['is_fully_paid'],
            'payment_percentage'        => $paymentPct,
            'fees'                      => StudentFeeResource::collection($fees),
        ];
    }
}
