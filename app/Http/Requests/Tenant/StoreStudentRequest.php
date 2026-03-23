<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\BloodType;
use App\Enums\Gender;
use App\Enums\ParentRelationship;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreStudentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $currentYear = now()->year;

        return [
            'last_name'                  => ['required', 'string', 'max:100'],
            'first_name'                 => ['required', 'string', 'max:100'],
            'birth_date'                 => ['required', 'date', 'before:today', 'after:'.(now()->subYears(50)->toDateString())],
            'gender'                     => ['required', Rule::in(array_column(Gender::cases(), 'value'))],
            'birth_place'                => ['nullable', 'string', 'max:150'],
            'nationality'                => ['nullable', 'string', 'max:100'],
            'birth_certificate_number'   => ['nullable', 'string', 'max:50'],
            'photo'                      => ['nullable', 'image', 'max:2048', 'dimensions:min_width=100,min_height=100'],
            'address'                    => ['nullable', 'string'],
            'city'                       => ['nullable', 'string', 'max:100'],
            'blood_type'                 => ['nullable', Rule::in(array_column(BloodType::cases(), 'value'))],
            'first_enrollment_year'      => ['nullable', 'integer', 'min:2000', 'max:'.($currentYear + 1)],
            'previous_school'            => ['nullable', 'string', 'max:200'],
            'notes'                      => ['nullable', 'string'],

            // Parents optionnels à la création
            'parents'                    => ['nullable', 'array', 'max:2'],
            'parents.*.parent_id'        => ['nullable', 'integer', Rule::exists('parents', 'id')],
            'parents.*.first_name'       => ['nullable', 'string', 'max:100'],
            'parents.*.last_name'        => ['nullable', 'string', 'max:100'],
            'parents.*.phone'            => ['nullable', 'string', 'max:20'],
            'parents.*.gender'           => ['nullable', Rule::in(array_column(Gender::cases(), 'value'))],
            'parents.*.relationship'     => ['nullable', Rule::in(array_column(ParentRelationship::cases(), 'value'))],
            'parents.*.is_primary_contact' => ['nullable', 'boolean'],
            'parents.*.can_pickup'       => ['nullable', 'boolean'],
        ];
    }

    public function messages(): array
    {
        return [
            'last_name.required'   => 'Le nom de famille est obligatoire.',
            'first_name.required'  => 'Le prénom est obligatoire.',
            'birth_date.required'  => 'La date de naissance est obligatoire.',
            'birth_date.before'    => 'La date de naissance doit être dans le passé.',
            'birth_date.after'     => 'La date de naissance doit être dans les 50 dernières années.',
            'gender.required'      => 'Le genre est obligatoire.',
            'gender.in'            => 'Le genre doit être "male" ou "female".',
            'parents.max'          => 'Un élève ne peut avoir que 2 parents/tuteurs maximum.',
        ];
    }
}
