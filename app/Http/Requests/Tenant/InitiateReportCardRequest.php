<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\ReportCardType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class InitiateReportCardRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enrollment_id' => ['required', 'integer', 'exists:enrollments,id'],
            'period_id'     => ['nullable', 'integer', 'exists:periods,id'],
            'type'          => ['required', Rule::in(array_column(ReportCardType::cases(), 'value'))],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            $type     = $this->input('type');
            $periodId = $this->input('period_id');

            if ($type === ReportCardType::Period->value && empty($periodId)) {
                $v->errors()->add('period_id', 'La période est obligatoire pour un bulletin de période.');
            }

            if ($type === ReportCardType::Annual->value && ! empty($periodId)) {
                $v->errors()->add('period_id', 'La période doit être vide pour un bulletin annuel.');
            }
        });
    }
}
