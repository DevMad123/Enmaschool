<?php
// ===== app/Http/Requests/Central/UpdateSystemSettingsRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Central;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemSettingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'settings'       => ['required', 'array'],
            'settings.*.key' => ['required', 'string', Rule::exists('central.system_settings', 'key')],
            'settings.*.value' => ['present', 'nullable'],
        ];
    }

    public function messages(): array
    {
        return [
            'settings.required'       => 'Au moins un paramètre est requis.',
            'settings.*.key.exists'   => 'La clé de paramètre :input n\'existe pas.',
            'settings.*.value.required' => 'La valeur est requise pour chaque paramètre.',
        ];
    }
}
