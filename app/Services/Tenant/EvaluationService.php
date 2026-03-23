<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Evaluation;
use App\Models\Tenant\Grade;
use App\Models\Tenant\Period;
use App\Models\Tenant\TeacherClass;
use App\Models\Tenant\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Validation\ValidationException;

class EvaluationService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = Evaluation::with(['subject', 'period', 'teacher.user'])
            ->withCount('grades');

        if (!empty($filters['class_id'])) {
            $query->forClass((int) $filters['class_id']);
        }
        if (!empty($filters['subject_id'])) {
            $query->forSubject((int) $filters['subject_id']);
        }
        if (!empty($filters['period_id'])) {
            $query->forPeriod((int) $filters['period_id']);
        }
        if (!empty($filters['academic_year_id'])) {
            $query->where('academic_year_id', $filters['academic_year_id']);
        }
        if (!empty($filters['teacher_id'])) {
            $query->forTeacher((int) $filters['teacher_id']);
        }
        if (!empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }
        if (!empty($filters['date_from'])) {
            $query->where('date', '>=', $filters['date_from']);
        }
        if (!empty($filters['date_to'])) {
            $query->where('date', '<=', $filters['date_to']);
        }

        $perPage = (int) ($filters['per_page'] ?? 20);

        return $query->orderBy('date', 'desc')->paginate($perPage);
    }

    public function create(array $data, User $createdBy): Evaluation
    {
        $period = Period::findOrFail($data['period_id']);

        if ($period->is_closed) {
            throw ValidationException::withMessages([
                'period_id' => ['La période est clôturée — impossible d\'ajouter des évaluations.'],
            ]);
        }

        $evaluation = Evaluation::create(array_merge($data, [
            'created_by' => $createdBy->id,
        ]));

        $this->createEmptyGrades($evaluation);

        return $evaluation->load(['subject', 'period', 'teacher']);
    }

    public function update(Evaluation $evaluation, array $data): Evaluation
    {
        if (!$evaluation->isEditable()) {
            throw ValidationException::withMessages([
                'evaluation' => ['Cette évaluation ne peut plus être modifiée.'],
            ]);
        }

        $evaluation->update($data);

        return $evaluation->refresh();
    }

    public function lock(Evaluation $evaluation): Evaluation
    {
        $evaluation->update(['is_locked' => true]);

        return $evaluation->refresh();
    }

    public function publish(Evaluation $evaluation): Evaluation
    {
        $evaluation->update(['is_published' => true]);

        return $evaluation->refresh();
    }

    public function delete(Evaluation $evaluation): void
    {
        if (!$evaluation->isEditable()) {
            throw ValidationException::withMessages([
                'evaluation' => ['Cette évaluation ne peut plus être supprimée.'],
            ]);
        }

        $evaluation->delete();
    }

    private function createEmptyGrades(Evaluation $evaluation): void
    {
        $enrollments = Enrollment::where('classe_id', $evaluation->class_id)
            ->where('academic_year_id', $evaluation->academic_year_id)
            ->where('is_active', true)
            ->get(['id', 'student_id']);

        if ($enrollments->isEmpty()) {
            return;
        }

        $now    = now();
        $grades = $enrollments->map(fn(Enrollment $e) => [
            'evaluation_id' => $evaluation->id,
            'student_id'    => $e->student_id,
            'enrollment_id' => $e->id,
            'score'         => null,
            'is_absent'     => false,
            'absence_justified' => false,
            'created_at'    => $now,
            'updated_at'    => $now,
        ])->toArray();

        Grade::insert($grades);
    }
}
