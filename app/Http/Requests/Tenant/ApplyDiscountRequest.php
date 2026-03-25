<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\StudentFee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class ApplyDiscountRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'min:0'],
            'reason' => ['required', 'string', 'max:300'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $studentFee = $this->route('studentFee');
            $amount     = (float) $this->input('amount', 0);

            if (! $studentFee) {
                return;
            }

            $maxDiscount = (float) ($studentFee->amount_due - $studentFee->amount_paid);
            if ($amount > $maxDiscount + 0.01) {
                $formatted = number_format($maxDiscount, 0, ',', ' ');
                $v->errors()->add('amount', "La remise ne peut pas dépasser le solde restant ({$formatted} FCFA).");
            }
        });
    }
}
