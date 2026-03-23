<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\EvaluationType;
use App\Models\Tenant\Period;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_id'         => ['required', 'integer', 'exists:classes,id'],
            'subject_id'       => ['required', 'integer', 'exists:subjects,id'],
            'period_id'        => ['required', 'integer', 'exists:periods,id'],
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'title'            => ['required', 'string', 'max:200'],
            'type'             => ['required', Rule::enum(EvaluationType::class)],
            'date'             => ['required', 'date'],
            'max_score'        => ['required', 'numeric', 'min:1', 'max:100'],
            'coefficient'      => ['nullable', 'numeric', 'min:0.5', 'max:5.0'],
            'description'      => ['nullable', 'string', 'max:1000'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $periodId = $this->input('period_id');
            if ($periodId) {
                $period = Period::find($periodId);
                if ($period && $period->is_closed) {
                    $v->errors()->add('period_id', 'La période est clôturée — impossible d\'ajouter des évaluations.');
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'period_id.exists'  => 'La période sélectionnée n\'existe pas.',
            'class_id.exists'   => 'La classe sélectionnée n\'existe pas.',
            'subject_id.exists' => 'La matière sélectionnée n\'existe pas.',
            'title.required'    => 'Le titre est obligatoire.',
            'type.required'     => 'Le type d\'évaluation est obligatoire.',
            'date.required'     => 'La date est obligatoire.',
            'max_score.required' => 'Le barème est obligatoire.',
        ];
    }
}
