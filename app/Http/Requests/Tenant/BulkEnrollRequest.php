<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkEnrollRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'classe_id'        => ['required', 'integer', Rule::exists('classes', 'id')],
            'academic_year_id' => ['required', 'integer', Rule::exists('academic_years', 'id')],
            'student_ids'      => ['required', 'array', 'min:1'],
            'student_ids.*'    => ['integer', Rule::exists('students', 'id')],
            'enrollment_date'  => ['required', 'date'],
        ];
    }
}
