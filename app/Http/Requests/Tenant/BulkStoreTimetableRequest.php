<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class BulkStoreTimetableRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'class_id'          => ['required', 'integer', 'exists:classes,id'],
            'academic_year_id'  => ['required', 'integer', 'exists:academic_years,id'],
            'entries'           => ['required', 'array', 'min:1'],
            'entries.*.time_slot_id' => ['required', 'integer', 'exists:time_slots,id'],
            'entries.*.subject_id'   => ['required', 'integer', 'exists:subjects,id'],
            'entries.*.teacher_id'   => ['nullable', 'integer', 'exists:teachers,id'],
            'entries.*.room_id'      => ['nullable', 'integer', 'exists:rooms,id'],
            'entries.*.color'        => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'entries.*.notes'        => ['nullable', 'string', 'max:500'],
        ];
    }
}
