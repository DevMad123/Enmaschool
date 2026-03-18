<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\SubjectCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['required', 'string', 'max:20', Rule::unique('subjects', 'code')],
            'coefficient' => ['numeric', 'min:0.1', 'max:99.9'],
            'color' => ['string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'category' => ['nullable', Rule::in(array_column(SubjectCategory::cases(), 'value'))],
            'is_active' => ['boolean'],
        ];
    }
}
