<?php
// ===== app/Http/Requests/Central/StorePlanRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StorePlanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $planId = $this->route('plan')?->id;

        $slugRule = $planId
            ? ['required', 'string', Rule::unique('central.plans', 'slug')->ignore($planId), 'regex:/^[a-z0-9-]+$/']
            : ['required', 'string', Rule::unique('central.plans', 'slug'), 'regex:/^[a-z0-9-]+$/'];

        return [
            'name'           => ['required', 'string', 'max:100'],
            'slug'           => $slugRule,
            'price_monthly'  => ['required', 'numeric', 'min:0'],
            'price_yearly'   => ['required', 'numeric', 'min:0'],
            'trial_days'     => ['sometimes', 'integer', 'min:0', 'max:90'],
            'max_students'   => ['nullable', 'integer', 'min:1'],
            'max_teachers'   => ['nullable', 'integer', 'min:1'],
            'max_storage_gb' => ['sometimes', 'integer', 'min:1'],
            'is_active'      => ['sometimes', 'boolean'],
            'features'       => ['sometimes', 'nullable', 'array'],
            'modules'        => ['sometimes', 'array'],
            'modules.*'      => ['string', Rule::exists('central.system_modules', 'key')],
        ];
    }

    public function messages(): array
    {
        return [
            'slug.regex'       => 'Le slug ne peut contenir que des lettres minuscules, des chiffres et des tirets.',
            'slug.unique'      => 'Ce slug est déjà utilisé.',
            'modules.*.exists' => 'Le module :input n\'existe pas.',
        ];
    }
}
