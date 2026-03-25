<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\FeeAppliesTo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreFeeTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:150'],
            'code'         => ['required', 'string', 'max:20', 'unique:fee_types,code'],
            'description'  => ['nullable', 'string'],
            'is_mandatory' => ['boolean'],
            'is_recurring' => ['boolean'],
            'applies_to'   => ['required', Rule::enum(FeeAppliesTo::class)],
            'order'        => ['integer', 'min:0'],
            'is_active'    => ['boolean'],
        ];
    }
}
