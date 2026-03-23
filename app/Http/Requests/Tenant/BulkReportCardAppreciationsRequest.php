<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use Illuminate\Foundation\Http\FormRequest;

class BulkReportCardAppreciationsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'appreciations'                  => ['required', 'array'],
            'appreciations.*.subject_id'     => ['required', 'integer', 'exists:subjects,id'],
            'appreciations.*.appreciation'   => ['required', 'string', 'max:300'],
        ];
    }
}
