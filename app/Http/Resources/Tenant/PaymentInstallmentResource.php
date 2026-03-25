<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\PaymentInstallment;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin PaymentInstallment */
class PaymentInstallmentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                  => $this->id,
            'installment_number'  => $this->installment_number,
            'amount_due'          => (float) $this->amount_due,
            'amount_paid'         => (float) $this->amount_paid,
            'amount_due_formatted' => number_format((float) $this->amount_due, 0, ',', ' ') . ' FCFA',
            'due_date'            => $this->due_date?->format('d/m/Y'),
            'status'              => [
                'value' => $this->status?->value,
                'label' => $this->status?->label(),
                'color' => $this->status?->color(),
            ],
            'paid_at'    => $this->paid_at?->format('d/m/Y H:i'),
            'is_overdue' => $this->is_overdue,
        ];
    }
}
