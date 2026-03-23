<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class EnrollStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'student_id'       => ['required', 'integer', Rule::exists('students', 'id')],
            'classe_id'        => ['required', 'integer', Rule::exists('classes', 'id')],
            'academic_year_id' => ['required', 'integer', Rule::exists('academic_years', 'id')],
            'enrollment_date'  => ['required', 'date'],
        ];
    }

    public function messages(): array
    {
        return [
            'student_id.exists'       => "Cet élève n'existe pas.",
            'classe_id.exists'        => "Cette classe n'existe pas.",
            'academic_year_id.exists' => "Cette année scolaire n'existe pas.",
        ];
    }
}
