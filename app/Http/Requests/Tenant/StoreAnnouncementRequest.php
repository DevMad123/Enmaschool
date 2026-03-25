<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\AnnouncementPriority;
use App\Enums\AnnouncementType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreAnnouncementRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'title'          => ['required', 'string', 'max:200'],
            'body'           => ['required', 'string'],
            'type'           => ['required', Rule::in(array_column(AnnouncementType::cases(), 'value'))],
            'priority'       => ['nullable', Rule::in(array_column(AnnouncementPriority::cases(), 'value'))],
            'target_roles'   => ['required', 'array', 'min:1'],
            'target_roles.*' => [Rule::in(['all', 'school_admin', 'director', 'teacher', 'accountant', 'staff'])],
            'publish_at'     => ['nullable', 'date'],
            'expires_at'     => ['nullable', 'date', 'after:publish_at'],
            'attachment'     => ['nullable', 'file', 'max:10240'],
        ];
    }
}
