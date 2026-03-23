<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class StoreTimetableEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'class_id'         => ['required', 'integer', 'exists:classes,id'],
            'time_slot_id'     => ['required', 'integer', 'exists:time_slots,id'],
            'subject_id'       => ['required', 'integer', 'exists:subjects,id'],
            'teacher_id'       => ['nullable', 'integer', 'exists:teachers,id'],
            'room_id'          => ['nullable', 'integer', 'exists:rooms,id'],
            'color'            => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'notes'            => ['nullable', 'string', 'max:500'],
        ];
    }
}
