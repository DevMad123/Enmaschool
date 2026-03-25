<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\FeeAppliesTo;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateFeeTypeRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $feeTypeId = $this->route('feeType')?->id ?? $this->route('feeType');

        return [
            'name'         => ['sometimes', 'required', 'string', 'max:150'],
            'code'         => ['sometimes', 'required', 'string', 'max:20', Rule::unique('fee_types', 'code')->ignore($feeTypeId)],
            'description'  => ['nullable', 'string'],
            'is_mandatory' => ['boolean'],
            'is_recurring' => ['boolean'],
            'applies_to'   => ['sometimes', 'required', Rule::enum(FeeAppliesTo::class)],
            'order'        => ['integer', 'min:0'],
            'is_active'    => ['boolean'],
        ];
    }
}
