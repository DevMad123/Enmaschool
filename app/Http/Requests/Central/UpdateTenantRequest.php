<?php
// ===== app/Http/Requests/Central/UpdateTenantRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateTenantRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $tenantId = $this->route('tenant')?->id ?? $this->route('tenant');

        return [
            'name'           => ['sometimes', 'string', 'max:255'],
            'slug'           => [
                'sometimes', 'string', 'max:100',
                Rule::unique('central.tenants', 'slug')->ignore($tenantId),
                'regex:/^[a-z0-9-]+$/',
            ],
            'has_primary'    => ['sometimes', 'boolean'],
            'has_college'    => ['sometimes', 'boolean'],
            'has_lycee'      => ['sometimes', 'boolean'],
            'has_maternelle' => ['sometimes', 'boolean'],
            'plan_id'        => ['sometimes', 'nullable', 'integer', Rule::exists('central.plans', 'id')],

            // Profile
            'profile.city'     => ['sometimes', 'nullable', 'string', 'max:100'],
            'profile.country'  => ['sometimes', 'nullable', 'string', 'max:2'],
            'profile.phone'    => ['sometimes', 'nullable', 'string', 'max:20'],
            'profile.email'    => ['sometimes', 'nullable', 'email'],
            'profile.currency' => ['sometimes', 'nullable', 'string', 'max:3'],
            'profile.timezone' => ['sometimes', 'nullable', 'string'],
            'profile.address'  => ['sometimes', 'nullable', 'string', 'max:500'],
            'profile.logo'     => ['sometimes', 'nullable', 'string'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function (\Illuminate\Validation\Validator $v): void {
            $tenant = $this->route('tenant');

            // Determine effective values (new or existing tenant values)
            $hasPrimary = $this->has('has_primary')
                ? filter_var($this->input('has_primary'), FILTER_VALIDATE_BOOLEAN)
                : (bool) $tenant?->has_primary;

            $hasCollege = $this->has('has_college')
                ? filter_var($this->input('has_college'), FILTER_VALIDATE_BOOLEAN)
                : (bool) $tenant?->has_college;

            $hasLycee = $this->has('has_lycee')
                ? filter_var($this->input('has_lycee'), FILTER_VALIDATE_BOOLEAN)
                : (bool) $tenant?->has_lycee;

            $hasMaternelle = $this->has('has_maternelle')
                ? filter_var($this->input('has_maternelle'), FILTER_VALIDATE_BOOLEAN)
                : (bool) $tenant?->has_maternelle;

            if (! $hasPrimary && ! $hasCollege && ! $hasLycee) {
                $v->errors()->add(
                    'has_primary',
                    'Au moins un niveau scolaire (has_primary, has_college, has_lycee) doit être activé.'
                );
            }

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
            'slug.regex'    => 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.',
            'slug.unique'   => 'Ce slug est déjà utilisé par une autre école.',
            'plan_id.exists' => 'Le plan sélectionné n\'existe pas.',
        ];
    }
}
