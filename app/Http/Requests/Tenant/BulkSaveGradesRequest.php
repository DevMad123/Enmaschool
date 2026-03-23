<?php

declare(strict_types=1);

namespace App\Http\Requests\Tenant;

use App\Models\Tenant\Evaluation;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class BulkSaveGradesRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'evaluation_id'              => ['required', 'integer', 'exists:evaluations,id'],
            'grades'                     => ['required', 'array'],
            'grades.*.student_id'        => ['required', 'integer', 'exists:students,id'],
            'grades.*.score'             => ['nullable', 'numeric', 'min:0'],
            'grades.*.is_absent'         => ['boolean'],
            'grades.*.absence_justified' => ['boolean'],
            'grades.*.comment'           => ['nullable', 'string', 'max:500'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $v) {
            $evalId = $this->input('evaluation_id');
            if (!$evalId) {
                return;
            }

            $evaluation = Evaluation::find($evalId);
            if (!$evaluation) {
                return;
            }

            if ($evaluation->is_locked) {
                $v->errors()->add('evaluation_id', 'L\'évaluation est verrouillée.');
                return;
            }

            if ($evaluation->period?->is_closed) {
                $v->errors()->add('evaluation_id', 'La période est clôturée.');
                return;
            }

            $maxScore = (float) $evaluation->max_score;
            foreach ($this->input('grades', []) as $index => $grade) {
                if (isset($grade['score']) && $grade['score'] !== null) {
                    $score = (float) $grade['score'];
                    if ($score > $maxScore) {
                        $v->errors()->add(
                            "grades.{$index}.score",
                            "La note {$score} dépasse le barème maximum de {$maxScore}.",
                        );
                    }
                }
            }
        });
    }

    public function messages(): array
    {
        return [
            'evaluation_id.exists'       => 'L\'évaluation n\'existe pas.',
            'grades.required'            => 'La liste des notes est obligatoire.',
            'grades.*.student_id.exists' => 'L\'élève n\'existe pas.',
            'grades.*.score.numeric'     => 'La note doit être un nombre.',
            'grades.*.score.min'         => 'La note ne peut pas être négative.',
        ];
    }
}
