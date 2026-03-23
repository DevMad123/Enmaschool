<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\OverrideType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreOverrideRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'date'                   => ['required', 'date'],
            'type'                   => ['required', Rule::enum(OverrideType::class)],
            'substitute_teacher_id'  => ['nullable', 'integer', 'exists:teachers,id'],
            'new_room_id'            => ['nullable', 'integer', 'exists:rooms,id'],
            'rescheduled_to_slot_id' => ['nullable', 'integer', 'exists:time_slots,id'],
            'reason'                 => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v) {
            $type = $this->input('type');

            if ($type === OverrideType::Substitution->value && ! $this->filled('substitute_teacher_id')) {
                $v->errors()->add('substitute_teacher_id', 'Un professeur remplaçant est requis pour une substitution.');
            }

            if ($type === OverrideType::RoomChange->value && ! $this->filled('new_room_id')) {
                $v->errors()->add('new_room_id', 'Une nouvelle salle est requise pour un changement de salle.');
            }

            if ($type === OverrideType::Rescheduled->value && ! $this->filled('rescheduled_to_slot_id')) {
                $v->errors()->add('rescheduled_to_slot_id', 'Un créneau de remplacement est requis pour une reprogrammation.');
            }
        });
    }
}
