<?php
// ===== app/Http/Requests/Tenant/InviteUserRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Tenant\User;
use App\Models\Tenant\UserInvitation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\In;
use Illuminate\Validation\Validator;

class InviteUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $staffValues = array_column(UserRole::staffRoles(), 'value');

        return [
            'email' => ['required', 'email'],
            'role'  => ['required', 'string', new In($staffValues)],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $email = $this->input('email');

            if (!$email) {
                return;
            }

            // Vérifier utilisateur actif existant
            if (User::where('email', $email)->where('status', UserStatus::Active)->exists()) {
                $v->errors()->add('email', 'Un utilisateur actif avec cet email existe déjà.');
            }

            // Vérifier invitation pending non expirée
            if (UserInvitation::pending()->where('email', $email)->exists()) {
                $v->errors()->add('email', 'Une invitation est déjà en attente pour cet email.');
            }
        });
    }
}
