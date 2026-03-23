<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TransferStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $enrollment = $this->route('enrollment');

        return [
            'new_classe_id' => [
                'required',
                'integer',
                Rule::exists('classes', 'id'),
                Rule::notIn([$enrollment?->classe_id]), // différent de la classe actuelle
            ],
            'note' => ['nullable', 'string', 'max:500'],
        ];
    }

    public function messages(): array
    {
        return [
            'new_classe_id.not_in' => "La classe de destination doit être différente de la classe actuelle.",
        ];
    }
}
