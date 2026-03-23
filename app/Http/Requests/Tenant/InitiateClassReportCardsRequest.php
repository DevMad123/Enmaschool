<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\ReportCardType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitiateClassReportCardsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_id'  => ['required', 'integer', 'exists:classes,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
            'type'      => ['required', Rule::in(array_column(ReportCardType::cases(), 'value'))],
        ];
    }
}
