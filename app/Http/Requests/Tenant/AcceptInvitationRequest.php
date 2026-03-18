<?php
// ===== app/Http/Requests/Tenant/AcceptInvitationRequest.php =====

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class AcceptInvitationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token'      => ['required', 'string'],
            'first_name' => ['required', 'string', 'max:100'],
            'last_name'  => ['required', 'string', 'max:100'],
            'password'   => ['required', 'string', 'min:8', 'confirmed'],
            'phone'      => ['nullable', 'string', 'max:20'],
        ];
    }
}
