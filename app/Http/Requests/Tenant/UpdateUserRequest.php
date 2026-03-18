<?php
// ===== app/Http/Requests/Tenant/UpdateUserRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\UserRole;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\In;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $user        = $this->route('user');
        $staffValues = array_column(UserRole::staffRoles(), 'value');

        return [
            'first_name' => ['sometimes', 'string', 'max:100'],
            'last_name'  => ['sometimes', 'string', 'max:100'],
            'email'      => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($user->id)],
            'password'   => ['nullable', 'string', 'min:8', 'confirmed'],
            'role'       => ['sometimes', 'string', new In($staffValues)],
            'phone'      => ['nullable', 'string', 'max:20'],
            'avatar'     => ['nullable', 'url'],
        ];
    }
}
