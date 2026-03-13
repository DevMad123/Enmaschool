<?php
// ===== app/Http/Requests/Central/StoreTenantRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'           => ['required', 'string', 'max:255'],
            'slug'           => ['required', 'string', 'max:100', 'unique:central.tenants,slug', 'regex:/^[a-z0-9-]+$/'],
            'has_primary'    => ['boolean'],
            'has_college'    => ['boolean'],
            'has_lycee'      => ['boolean'],
            'has_maternelle' => ['boolean'],
            'plan_id'        => ['nullable', 'integer', Rule::exists('central.plans', 'id')],

            // Profile
            'profile.city'     => ['nullable', 'string', 'max:100'],
            'profile.country'  => ['nullable', 'string', 'max:2'],
            'profile.phone'    => ['nullable', 'string', 'max:20'],
            'profile.email'    => ['nullable', 'email'],
            'profile.currency' => ['nullable', 'string', 'max:3'],
            'profile.timezone' => ['nullable', 'string'],

            // Admin account
            'admin_first_name' => ['required', 'string', 'max:100'],
            'admin_last_name'  => ['required', 'string', 'max:100'],
            'admin_email'      => ['required', 'email', 'max:255'],
            'admin_password'   => ['required', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $v): void {
            // Au moins un niveau scolaire requis
            $hasPrimary = filter_var($this->input('has_primary'), FILTER_VALIDATE_BOOLEAN);
            $hasCollege = filter_var($this->input('has_college'), FILTER_VALIDATE_BOOLEAN);
            $hasLycee   = filter_var($this->input('has_lycee'), FILTER_VALIDATE_BOOLEAN);

            if (! $hasPrimary && ! $hasCollege && ! $hasLycee) {
                $v->errors()->add(
                    'has_primary',
                    'Au moins un niveau scolaire (has_primary, has_college, has_lycee) doit être activé.'
                );
            }

            // has_maternelle requiert has_primary
            $hasMaternelle = filter_var($this->input('has_maternelle'), FILTER_VALIDATE_BOOLEAN);
            if ($hasMaternelle && ! $hasPrimary) {
                $v->errors()->add(
                    'has_maternelle',
                    'La maternelle nécessite que le niveau primaire soit activé.'
                );
            }
        });
    }

    public function messages(): array
    {
        return [
            'slug.regex'   => 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.',
            'slug.unique'  => 'Ce slug est déjà utilisé par une autre école.',
            'plan_id.exists' => 'Le plan sélectionné n\'existe pas.',
        ];
    }

    public function prepareForValidation(): void
    {
        // Normalise profile.* si passés à plat (rétro-compatibilité)
        if (! $this->has('profile') && $this->has('city')) {
            $this->merge([
                'profile' => [
                    'city'     => $this->input('city'),
                    'country'  => $this->input('country'),
                    'phone'    => $this->input('phone'),
                    'email'    => $this->input('email'),
                    'currency' => $this->input('currency'),
                    'timezone' => $this->input('timezone'),
                ],
            ]);
        }
    }
}
