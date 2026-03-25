<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\FeeType;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class SetFeeScheduleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id'    => ['required', 'integer', 'exists:academic_years,id'],
            'fee_type_id'         => ['required', 'integer', 'exists:fee_types,id'],
            'school_level_id'     => ['nullable', 'integer', 'exists:school_levels,id'],
            'amount'              => ['required', 'numeric', 'min:0', 'max:99999999.99'],
            'installments_allowed' => ['boolean'],
            'max_installments'    => ['integer', 'min:1', 'max:12'],
            'due_date'            => ['nullable', 'date'],
            'notes'               => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $amount = $this->input('amount');
            if ($amount !== null && (float) $amount < 0) {
                $v->errors()->add('amount', 'Le montant ne peut pas être négatif.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'amount.min' => 'Le montant ne peut pas être négatif.',
        ];
    }
}
