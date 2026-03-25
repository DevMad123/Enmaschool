<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\MessageType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SendMessageRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'body'        => ['required_without:attachment', 'nullable', 'string', 'max:5000'],
            'type'        => ['nullable', Rule::in(array_column(MessageType::cases(), 'value'))],
            'reply_to_id' => ['nullable', 'exists:messages,id'],
            'attachment'  => ['nullable', 'file', 'max:10240', 'mimes:pdf,jpg,jpeg,png,docx,xlsx'],
        ];
    }
}
