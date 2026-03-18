<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\PeriodType;
use App\Enums\PromotionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:50'],
            'start_date' => ['required', 'date'],
            'end_date' => ['required', 'date', 'after:start_date'],
            'period_type' => ['required', Rule::in(array_column(PeriodType::cases(), 'value'))],
            'passing_average' => ['numeric', 'min:0', 'max:20'],
            'promotion_type' => ['nullable', Rule::in(array_column(PromotionType::cases(), 'value'))],
        ];
    }

    public function messages(): array
    {
        return [
            'end_date.after' => 'La date de fin doit être postérieure à la date de début.',
        ];
    }
}
