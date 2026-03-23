<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\ContractType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTeacherRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $teacherId = $this->route('teacher')?->id;

        return [
            'employee_number'    => ['nullable', 'string', 'max:30', Rule::unique('teachers', 'employee_number')->ignore($teacherId)],
            'speciality'         => ['nullable', 'string', 'max:200'],
            'diploma'            => ['nullable', 'string', 'max:200'],
            'hire_date'          => ['nullable', 'date'],
            'contract_type'      => ['nullable', Rule::in(array_column(ContractType::cases(), 'value'))],
            'weekly_hours_max'   => ['nullable', 'integer', 'min:1', 'max:40'],
            'biography'          => ['nullable', 'string', 'max:1000'],
            'subject_ids'        => ['nullable', 'array'],
            'subject_ids.*'      => ['integer', Rule::exists('subjects', 'id')],
            'primary_subject_id' => ['nullable', 'integer', Rule::exists('subjects', 'id')],
        ];
    }

    public function withValidator(\Illuminate\Contracts\Validation\Validator $validator): void
    {
        $validator->after(function ($v): void {
            $primaryId = $this->input('primary_subject_id');
            $subjectIds = $this->input('subject_ids');

            if ($primaryId && $subjectIds !== null && ! in_array($primaryId, (array) $subjectIds)) {
                $v->errors()->add('primary_subject_id', 'Le sujet principal doit faire partie des subject_ids.');
            }
        });
    }
}
