<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Enums\LyceeSerie;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Validator;

class StoreClasseRequest extends FormRequest
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
            'section' => ['required', 'string', 'max:5', 'regex:/^[1-9A-Za-z][0-9A-Za-z]{0,4}$/'],
            'capacity' => ['integer', 'min:1', 'max:200'],
            'main_teacher_id' => ['nullable', 'integer', Rule::exists('users', 'id')],
            'room_id' => ['nullable', 'integer', Rule::exists('rooms', 'id')],
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

            // Unicité (academic_year_id, school_level_id, serie, section)
            $query = \App\Models\Tenant\Classe::where('academic_year_id', $this->input('academic_year_id'))
                ->where('school_level_id', $levelId)
                ->where('section', $this->input('section'));

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
            'section.required' => 'La section est obligatoire (ex: 1, 2, A, B).',
            'section.regex' => 'La section doit contenir uniquement des chiffres ou lettres (ex: 1, A, 12).',
            'serie.in' => 'La série doit être une valeur valide (A, B, C, D, F1, F2, G1, G2, G3).',
        ];
    }
}
