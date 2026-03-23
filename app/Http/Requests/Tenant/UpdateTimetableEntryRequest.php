<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class UpdateTimetableEntryRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'time_slot_id' => ['sometimes', 'integer', 'exists:time_slots,id'],
            'subject_id'   => ['sometimes', 'integer', 'exists:subjects,id'],
            'teacher_id'   => ['nullable', 'integer', 'exists:teachers,id'],
            'room_id'      => ['nullable', 'integer', 'exists:rooms,id'],
            'color'        => ['nullable', 'string', 'size:7', 'regex:/^#[0-9A-Fa-f]{6}$/'],
            'notes'        => ['nullable', 'string', 'max:500'],
            'is_active'    => ['sometimes', 'boolean'],
        ];
    }
}
