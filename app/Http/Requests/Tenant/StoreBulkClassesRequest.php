<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\LyceeSerie;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreBulkClassesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['required', 'integer', Rule::exists('academic_years', 'id')],
            'school_level_id' => ['required', 'integer', Rule::exists('school_levels', 'id')->where('is_active', true)],
            'serie' => ['nullable', 'string', Rule::in(array_column(LyceeSerie::cases(), 'value'))],
            'sections' => ['required', 'array', 'min:1'],
            'sections.*' => ['string', 'max:5', 'regex:/^[1-9A-Za-z][0-9A-Za-z]{0,4}$/'],
            'capacity' => ['integer', 'min:1', 'max:200'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $levelId = $this->input('school_level_id');
            $serie = $this->input('serie');

            if (! $levelId) {
                return;
            }

            $level = SchoolLevel::find($levelId);

            if (! $level) {
                return;
            }

            if ($level->requires_serie && empty($serie)) {
                $v->errors()->add('serie', 'La série est obligatoire pour ce niveau (2nde, 1ère ou Terminale).');
            }

            if (! $level->requires_serie && ! empty($serie)) {
                $v->errors()->add('serie', 'Ce niveau ne doit pas avoir de série.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'sections.required' => 'Sélectionnez au moins une section à créer.',
            'sections.*.regex' => 'Chaque section doit contenir uniquement des chiffres ou lettres.',
            'serie.in' => 'La série doit être une valeur valide (A, B, C, D, F1, F2, G1, G2, G3).',
        ];
    }
}
