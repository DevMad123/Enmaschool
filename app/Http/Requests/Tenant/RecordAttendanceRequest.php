<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\AttendanceStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class RecordAttendanceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $statusValues = array_column(AttendanceStatus::cases(), 'value');

        return [
            'entry_id'                  => ['nullable', 'exists:timetable_entries,id'],
            'date'                      => ['required', 'date', 'before_or_equal:today'],
            'records'                   => ['required', 'array', 'min:1'],
            'records.*.enrollment_id'   => ['required', 'exists:enrollments,id'],
            'records.*.status'          => ['required', Rule::in($statusValues)],
            'records.*.minutes_late'    => [
                'required_if:records.*.status,late',
                'nullable',
                'integer',
                'min:1',
                'max:120',
            ],
            'records.*.note'            => ['nullable', 'string', 'max:300'],
        ];
    }

    public function messages(): array
    {
        return [
            'date.before_or_equal'         => 'La date ne peut pas être dans le futur.',
            'records.required'             => 'Au moins un enregistrement de présence est requis.',
            'records.*.enrollment_id.exists' => 'Cet élève n\'est pas inscrit dans cette classe.',
            'records.*.status.in'          => 'Statut de présence invalide.',
            'records.*.minutes_late.required_if' => 'Le nombre de minutes est requis pour les retards.',
        ];
    }
}
