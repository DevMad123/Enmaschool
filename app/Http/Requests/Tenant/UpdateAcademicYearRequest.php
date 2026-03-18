<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\PromotionType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateAcademicYearRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['sometimes', 'string', 'max:50'],
            'start_date' => ['sometimes', 'date'],
            'end_date' => ['sometimes', 'date', 'after:start_date'],
            'passing_average' => ['sometimes', 'numeric', 'min:0', 'max:20'],
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
