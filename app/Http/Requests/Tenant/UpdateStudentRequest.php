<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\BloodType;
use App\Enums\Gender;
use App\Enums\ParentRelationship;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $currentYear = now()->year;

        return [
            'last_name'                  => ['sometimes', 'string', 'max:100'],
            'first_name'                 => ['sometimes', 'string', 'max:100'],
            'birth_date'                 => ['sometimes', 'date', 'before:today', 'after:'.(now()->subYears(50)->toDateString())],
            'gender'                     => ['sometimes', Rule::in(array_column(Gender::cases(), 'value'))],
            'birth_place'                => ['nullable', 'string', 'max:150'],
            'nationality'                => ['nullable', 'string', 'max:100'],
            'birth_certificate_number'   => ['nullable', 'string', 'max:50'],
            'photo'                      => ['nullable', 'image', 'max:2048'],
            'address'                    => ['nullable', 'string'],
            'city'                       => ['nullable', 'string', 'max:100'],
            'blood_type'                 => ['nullable', Rule::in(array_column(BloodType::cases(), 'value'))],
            'first_enrollment_year'      => ['nullable', 'integer', 'min:2000', 'max:'.($currentYear + 1)],
            'previous_school'            => ['nullable', 'string', 'max:200'],
            'notes'                      => ['nullable', 'string'],

            // Parents (optionnels à la modification)
            'parents'                      => ['nullable', 'array', 'max:2'],
            'parents.*.parent_id'          => ['nullable', 'integer', Rule::exists('parents', 'id')],
            'parents.*.first_name'         => ['nullable', 'string', 'max:100'],
            'parents.*.last_name'          => ['nullable', 'string', 'max:100'],
            'parents.*.phone'              => ['nullable', 'string', 'max:20'],
            'parents.*.gender'             => ['nullable', Rule::in(array_column(Gender::cases(), 'value'))],
            'parents.*.relationship'       => ['nullable', Rule::in(array_column(ParentRelationship::cases(), 'value'))],
            'parents.*.is_primary_contact' => ['nullable', 'boolean'],
            'parents.*.can_pickup'         => ['nullable', 'boolean'],
        ];
    }
}
