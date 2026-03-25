<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class BulkSetSchedulesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id'              => ['required', 'integer', 'exists:academic_years,id'],
            'schedules'                     => ['required', 'array'],
            'schedules.*.fee_type_id'       => ['required', 'integer', 'exists:fee_types,id'],
            'schedules.*.school_level_id'   => ['nullable', 'integer', 'exists:school_levels,id'],
            'schedules.*.amount'            => ['required', 'numeric', 'min:0'],
            'schedules.*.installments_allowed' => ['boolean'],
            'schedules.*.max_installments'  => ['integer', 'min:1', 'max:12'],
            'schedules.*.due_date'          => ['nullable', 'date'],
        ];
    }
}
