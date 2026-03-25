<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Payment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Payment */
class PaymentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'receipt_number' => $this->receipt_number,
            'amount'         => (float) $this->amount,
            'amount_formatted' => number_format((float) $this->amount, 0, ',', ' ') . ' FCFA',
            'payment_method' => [
                'value' => $this->payment_method?->value,
                'label' => $this->payment_method?->label(),
                'icon'  => $this->payment_method?->icon(),
            ],
            'payment_date'  => $this->payment_date?->format('d/m/Y'),
            'reference'     => $this->reference,
            'notes'         => $this->notes,
            'is_cancelled'  => $this->is_cancelled,
            'cancelled_at'  => $this->cancelled_at?->format('d/m/Y H:i'),
            'cancel_reason' => $this->cancel_reason,
            'has_receipt'   => (bool) $this->pdf_path,
            'pdf_url'       => $this->pdf_url,
            'recorded_by'   => $this->when($this->relationLoaded('recordedBy'), function () {
                if (! $this->recordedBy) {
                    return null;
                }
                return [
                    'id'        => $this->recordedBy->id,
                    'full_name' => $this->recordedBy->full_name,
                ];
            }),
            'student_fee' => StudentFeeResource::make($this->whenLoaded('studentFee')),
            'enrollment'  => $this->when($this->relationLoaded('enrollment'), function () {
                return [
                    'id'      => $this->enrollment->id,
                    'student' => StudentListResource::make($this->enrollment->student),
                ];
            }),
            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
