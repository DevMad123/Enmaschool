<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class SubmitJustificationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'enrollment_id' => ['required', 'exists:enrollments,id'],
            'date_from'     => ['required', 'date'],
            'date_to'       => ['required', 'date', 'after_or_equal:date_from'],
            'reason'        => ['required', 'string', 'max:500'],
            'document'      => ['nullable', 'file', 'mimes:pdf,jpg,jpeg,png', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'date_to.after_or_equal' => 'La date de fin doit être après la date de début.',
            'document.mimes'         => 'Le document doit être un PDF ou une image (JPG, PNG).',
            'document.max'           => 'Le document ne doit pas dépasser 5 Mo.',
        ];
    }
}
