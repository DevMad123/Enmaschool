<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\PaymentMethod;
use App\Models\Tenant\StudentFee;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class RecordPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_fee_id'  => ['required', 'integer', 'exists:student_fees,id'],
            'amount'          => ['required', 'numeric', 'min:1'],
            'payment_method'  => ['required', Rule::enum(PaymentMethod::class)],
            'payment_date'    => ['required', 'date', 'before_or_equal:today'],
            'reference'       => [
                Rule::requiredIf(function () {
                    $method = $this->input('payment_method');
                    if (! $method) {
                        return false;
                    }
                    try {
                        return PaymentMethod::from($method)->requiresReference();
                    } catch (\ValueError) {
                        return false;
                    }
                }),
                'nullable', 'string', 'max:100',
            ],
            'notes' => ['nullable', 'string', 'max:300'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $feeId  = $this->input('student_fee_id');
            $amount = (float) $this->input('amount', 0);

            if (! $feeId) {
                return;
            }

            $fee = StudentFee::find($feeId);
            if (! $fee) {
                return;
            }

            $remaining = $fee->amount_remaining;
            if ($amount > $remaining + 0.01) {
                $formatted = number_format($remaining, 0, ',', ' ');
                $v->errors()->add('amount', "Le montant dépasse le solde restant dû ({$formatted} FCFA).");
            }
        });
    }

    public function messages(): array
    {
        return [
            'reference.required' => 'La référence de transaction est obligatoire pour ce mode de paiement.',
            'amount.min'         => 'Le montant doit être supérieur à 0.',
            'payment_date.before_or_equal' => 'La date de paiement ne peut pas être dans le futur.',
        ];
    }
}
