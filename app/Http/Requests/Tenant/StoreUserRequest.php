<?php
// ===== app/Http/Requests/Tenant/StoreUserRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\In;

class StoreUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffValues = array_column(UserRole::staffRoles(), 'value');

        return [
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'email'      => ['required', 'email', 'unique:users,email'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'role'       => ['required', 'string', new In($staffValues)],
            'phone'      => ['nullable', 'string', 'max:20'],
            'avatar'     => ['nullable', 'url'],
        ];
    }

    public function messages(): array
    {
        return [
            'role.in'    => 'Le rôle sélectionné est invalide.',
            'email.unique' => 'Un utilisateur avec cet email existe déjà.',
        ];
    }
}
