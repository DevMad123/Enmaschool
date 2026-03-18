<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\LyceeSerie;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class UpdateClasseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'academic_year_id' => ['sometimes', 'integer', Rule::exists('academic_years', 'id')],
            'school_level_id' => ['sometimes', 'integer', Rule::exists('school_levels', 'id')->where('is_active', true)],
            'serie' => ['nullable', 'string', Rule::in(array_column(LyceeSerie::cases(), 'value'))],
            'section' => ['sometimes', 'string', 'max:5', 'regex:/^[1-9A-Za-z][0-9A-Za-z]{0,4}$/'],
            'capacity' => ['sometimes', 'integer', 'min:1', 'max:200'],
            'main_teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'room_id' => ['nullable', 'integer', Rule::exists('rooms', 'id')],
            'is_active' => ['sometimes', 'boolean'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v): void {
            $classe = $this->route('classe');
            $levelId = $this->input('school_level_id', $classe->school_level_id);
            $serie = $this->has('serie') ? $this->input('serie') : $classe->serie;
            $section = $this->input('section', $classe->section);
            $yearId = $this->input('academic_year_id', $classe->academic_year_id);

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

            // Unicité en excluant la classe courante
            $query = \App\Models\Tenant\Classe::where('academic_year_id', $yearId)
                ->where('school_level_id', $levelId)
                ->where('section', $section)
                ->where('id', '!=', $classe->id);

            if (empty($serie)) {
                $query->whereNull('serie');
            } else {
                $query->where('serie', $serie);
            }

            if ($query->exists()) {
                $v->errors()->add('section', 'Cette combinaison niveau/série/section existe déjà.');
            }
        });
    }

    public function messages(): array
    {
        return [
            'section.regex' => 'La section doit contenir uniquement des chiffres ou lettres (ex: 1, A, 12).',
            'serie.in' => 'La série doit être une valeur valide (A, B, C, D, F1, F2, G1, G2, G3).',
        ];
    }
}
