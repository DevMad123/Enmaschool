<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\EvaluationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateEvaluationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'       => ['sometimes', 'string', 'max:200'],
            'type'        => ['sometimes', Rule::enum(EvaluationType::class)],
            'date'        => ['sometimes', 'date'],
            'max_score'   => ['sometimes', 'numeric', 'min:1', 'max:100'],
            'coefficient' => ['nullable', 'numeric', 'min:0.5', 'max:5.0'],
            'description' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
