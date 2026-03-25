<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\ConversationType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreConversationRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type'        => ['required', Rule::in(array_column(ConversationType::cases(), 'value'))],
            'name'        => ['required_if:type,group', 'nullable', 'string', 'max:100'],
            'description' => ['nullable', 'string', 'max:300'],
            'user_ids'    => ['required', 'array', 'min:1'],
            'user_ids.*'  => ['integer', 'exists:users,id'],
        ];
    }

    public function withValidator($validator): void
    {
        $validator->after(function ($v): void {
            if ($this->type === 'direct' && count($this->user_ids ?? []) !== 1) {
                $v->errors()->add('user_ids', 'Une conversation directe doit avoir exactement 1 destinataire.');
            }
        });
    }
}
