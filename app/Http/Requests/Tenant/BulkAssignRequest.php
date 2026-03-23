<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class BulkAssignRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'teacher_id'                    => ['required', 'integer', Rule::exists('teachers', 'id')],
            'academic_year_id'              => ['required', 'integer', Rule::exists('academic_years', 'id')],
            'assignments'                   => ['required', 'array', 'min:1'],
            'assignments.*.class_id'        => ['required', 'integer', Rule::exists('classes', 'id')],
            'assignments.*.subject_id'      => ['required', 'integer', Rule::exists('subjects', 'id')],
            'assignments.*.hours_per_week'  => ['nullable', 'numeric', 'min:0.5', 'max:40'],
        ];
    }
}
