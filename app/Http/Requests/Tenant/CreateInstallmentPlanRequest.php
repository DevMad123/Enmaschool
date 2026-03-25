<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class CreateInstallmentPlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'installments'                          => ['required', 'array', 'min:2', 'max:12'],
            'installments.*.installment_number'     => ['required', 'integer', 'min:1'],
            'installments.*.amount_due'             => ['required', 'numeric', 'min:1'],
            'installments.*.due_date'               => ['required', 'date', 'after:today'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $studentFee    = $this->route('studentFee');
            $installments  = $this->input('installments', []);

            if (! $studentFee || empty($installments)) {
                return;
            }

            $sum       = array_sum(array_column($installments, 'amount_due'));
            $remaining = $studentFee->amount_remaining;

            if (abs($sum - $remaining) > 1) {
                $formatted = number_format($remaining, 0, ',', ' ');
                $v->errors()->add(
                    'installments',
                    "La somme des tranches (" . number_format($sum, 0, ',', ' ') . " FCFA) "
                    . "doit être égale au solde restant ({$formatted} FCFA)."
                );
            }
        });
    }
}
