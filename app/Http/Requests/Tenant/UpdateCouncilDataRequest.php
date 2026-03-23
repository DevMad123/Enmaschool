<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\CouncilDecision;
use App\Enums\HonorMention;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateCouncilDataRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'general_appreciation' => ['nullable', 'string', 'max:500'],
            'council_decision'     => ['nullable', Rule::in(array_column(CouncilDecision::cases(), 'value'))],
            'honor_mention'        => ['nullable', Rule::in(array_column(HonorMention::cases(), 'value'))],
            'absences_justified'   => ['nullable', 'integer', 'min:0'],
            'absences_unjustified' => ['nullable', 'integer', 'min:0'],
        ];
    }

    public function withValidator(\Illuminate\Validation\Validator $validator): void
    {
        $validator->after(function ($v) {
            if ($this->filled('honor_mention') && $this->input('council_decision') !== CouncilDecision::Honor->value) {
                $v->errors()->add(
                    'honor_mention',
                    'Une mention ne peut être attribuée que si la décision est "Admis(e) avec mention".'
                );
            }
        });
    }
}
