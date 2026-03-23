<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class CheckConflictsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'time_slot_id'     => ['required', 'integer', 'exists:time_slots,id'],
            'teacher_id'       => ['nullable', 'integer', 'exists:teachers,id'],
            'room_id'          => ['nullable', 'integer', 'exists:rooms,id'],
            'exclude_entry_id' => ['nullable', 'integer', 'exists:timetable_entries,id'],
        ];
    }
}
