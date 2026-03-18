<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\SubjectCategory;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSubjectRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $subject = $this->route('subject');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'code' => ['sometimes', 'string', 'max:20', Rule::unique('subjects', 'code')->ignore($subject->id)],
            'coefficient' => ['sometimes', 'numeric', 'min:0.1', 'max:99.9'],
            'color' => ['sometimes', 'string', 'max:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'category' => ['nullable', Rule::in(array_column(SubjectCategory::cases(), 'value'))],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }
}
