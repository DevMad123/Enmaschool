<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\RoomType;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreRoomRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:20', Rule::unique('rooms', 'code')],
            'type' => ['required', Rule::in(array_column(RoomType::cases(), 'value'))],
            'capacity' => ['integer', 'min:1', 'max:500'],
            'floor' => ['nullable', 'string', 'max:50'],
            'building' => ['nullable', 'string', 'max:100'],
            'equipment' => ['nullable', 'array'],
            'is_active' => ['boolean'],
        ];
    }
}
