<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\StudentFee;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin StudentFee */
class StudentFeeResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                       => $this->id,
            'amount_due'               => (float) $this->amount_due,
            'amount_paid'              => (float) $this->amount_paid,
            'amount_remaining'         => $this->amount_remaining,
            'discount_amount'          => (float) $this->discount_amount,
            'amount_due_formatted'     => number_format((float) $this->amount_due, 0, ',', ' ') . ' FCFA',
            'amount_paid_formatted'    => number_format((float) $this->amount_paid, 0, ',', ' ') . ' FCFA',
            'amount_remaining_formatted' => number_format($this->amount_remaining, 0, ',', ' ') . ' FCFA',
            'payment_percentage'       => $this->payment_percentage,
            'discount_reason'          => $this->discount_reason,
            'status'                   => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
                'color' => $this->status?->color(),
            ],
            'due_date'     => $this->due_date?->format('d/m/Y'),
            'is_fully_paid' => $this->is_fully_paid,
            'notes'        => $this->notes,
            'fee_type'     => FeeTypeResource::make($this->whenLoaded('feeType')),
            'payments'     => PaymentResource::collection($this->whenLoaded('payments')),
            'installments' => PaymentInstallmentResource::collection($this->whenLoaded('installments')),
            'enrollment'   => $this->when($this->relationLoaded('enrollment'), function () {
                return [
                    'id'      => $this->enrollment->id,
                    'student' => StudentListResource::make($this->enrollment->student),
                ];
            }),
        ];
    }
}
