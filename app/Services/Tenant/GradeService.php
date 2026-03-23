<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Jobs\RecalculatePeriodAverageJob;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Evaluation;
use App\Models\Tenant\Grade;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\User;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class GradeService
{
    public function getForEvaluation(Evaluation $evaluation): Collection
    {
        return Grade::with(['student', 'enteredBy'])
            ->forEvaluation($evaluation->id)
            ->join('students', 'students.id', '=', 'grades.student_id')
            ->select('grades.*')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->get();
    }

    public function saveGrade(
        Evaluation $evaluation,
        int $studentId,
        array $data,
        User $enteredBy,
    ): Grade {
        if (!$evaluation->isEditable()) {
            throw ValidationException::withMessages([
                'evaluation' => ['Cette évaluation ne peut plus être modifiée.'],
            ]);
        }

        $enrollment = Enrollment::where('student_id', $studentId)
            ->where('classe_id', $evaluation->class_id)
            ->where('is_active', true)
            ->firstOrFail();

        $grade = Grade::updateOrCreate(
            ['evaluation_id' => $evaluation->id, 'student_id' => $studentId],
            array_merge($data, [
                'enrollment_id' => $enrollment->id,
                'entered_by'    => $enteredBy->id,
                'entered_at'    => now(),
                'updated_by'    => $enteredBy->id,
            ]),
        );

        RecalculatePeriodAverageJob::dispatch(
            $studentId,
            $evaluation->subject_id,
            $evaluation->period_id,
            $evaluation->class_id,
        );

        return $grade;
    }

    public function bulkSave(Evaluation $evaluation, array $gradesData, User $enteredBy): array
    {
        if (!$evaluation->isEditable()) {
            throw ValidationException::withMessages([
                'evaluation' => ['Cette évaluation ne peut plus être modifiée.'],
            ]);
        }

        $saved  = 0;
        $errors = [];

        DB::transaction(function () use ($evaluation, $gradesData, $enteredBy, &$saved, &$errors) {
            foreach ($gradesData as $item) {
                try {
                    $studentId  = (int) $item['student_id'];
                    $enrollment = Enrollment::where('student_id', $studentId)
                        ->where('classe_id', $evaluation->class_id)
                        ->where('is_active', true)
                        ->first();

                    if (!$enrollment) {
                        $errors[] = "Étudiant {$studentId} non inscrit dans cette classe.";
                        continue;
                    }

                    Grade::updateOrCreate(
                        ['evaluation_id' => $evaluation->id, 'student_id' => $studentId],
                        [
                            'enrollment_id'    => $enrollment->id,
                            'score'            => $item['score'] ?? null,
                            'is_absent'        => (bool) ($item['is_absent'] ?? false),
                            'absence_justified' => (bool) ($item['absence_justified'] ?? false),
                            'comment'          => $item['comment'] ?? null,
                            'entered_by'       => $enteredBy->id,
                            'entered_at'       => now(),
                            'updated_by'       => $enteredBy->id,
                        ],
                    );

                    $saved++;
                } catch (\Throwable $e) {
                    $errors[] = "Erreur pour l'étudiant {$item['student_id']} : {$e->getMessage()}";
                }
            }
        });

        // Dispatch one recalculation job per subject/period combination
        RecalculatePeriodAverageJob::dispatch(
            null,
            $evaluation->subject_id,
            $evaluation->period_id,
            $evaluation->class_id,
        );

        return compact('saved', 'errors');
    }

    public function getGradesSheet(int $classeId, int $subjectId, int $periodId): array
    {
        $evaluations = Evaluation::with(['subject', 'period'])
            ->forClass($classeId)
            ->forSubject($subjectId)
            ->forPeriod($periodId)
            ->orderBy('date')
            ->get();

        $enrollments = Enrollment::with('student')
            ->where('classe_id', $classeId)
            ->where('is_active', true)
            ->join('students', 'students.id', '=', 'enrollments.student_id')
            ->select('enrollments.*')
            ->orderBy('students.last_name')
            ->orderBy('students.first_name')
            ->get();

        $evalIds     = $evaluations->pluck('id');
        $studentIds  = $enrollments->pluck('student_id');

        $grades = Grade::whereIn('evaluation_id', $evalIds)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->groupBy('student_id');

        $periodAverages = PeriodAverage::where('period_id', $periodId)
            ->where('subject_id', $subjectId)
            ->whereIn('student_id', $studentIds)
            ->get()
            ->keyBy('student_id');

        $students = $enrollments->map(function (Enrollment $enrollment) use ($grades, $evaluations, $periodAverages) {
            $studentId    = $enrollment->student_id;
            $studentGrades = $grades->get($studentId, collect());

            $gradesMap = [];
            foreach ($evaluations as $eval) {
                $grade = $studentGrades->firstWhere('evaluation_id', $eval->id);
                $gradesMap[(string) $eval->id] = $grade ? [
                    'score'            => $grade->score !== null ? (float) $grade->score : null,
                    'score_on_20'      => $grade->score_on_20,
                    'is_absent'        => $grade->is_absent,
                    'absence_justified' => $grade->absence_justified,
                    'comment'          => $grade->comment,
                ] : [
                    'score'            => null,
                    'score_on_20'      => null,
                    'is_absent'        => false,
                    'absence_justified' => false,
                    'comment'          => null,
                ];
            }

            $pa = $periodAverages->get($studentId);

            return [
                'student'        => $enrollment->student,
                'enrollment_id'  => $enrollment->id,
                'grades'         => $gradesMap,
                'period_average' => $pa ? (float) $pa->average : null,
                'absences_count' => $studentGrades->where('is_absent', true)->count(),
            ];
        });

        // Class stats
        $allScores = Grade::whereIn('evaluation_id', $evalIds)
            ->whereNotNull('score')
            ->pluck('score')
            ->map(fn($s) => (float) $s);

        $passingAverage = (float) \App\Models\Tenant\SchoolSetting::get('passing_average', 10.0);
        $passingCount   = $allScores->filter(fn($s) => $s >= $passingAverage)->count();

        $classStats = [
            'average'       => $allScores->avg(),
            'min'           => $allScores->min(),
            'max'           => $allScores->max(),
            'passing_count' => $passingCount,
            'total_count'   => $allScores->count(),
            'passing_rate'  => $allScores->count() > 0 ? round($passingCount / $allScores->count() * 100, 1) : 0,
        ];

        return [
            'evaluations'   => $evaluations,
            'students'      => $students,
            'class_stats'   => $classStats,
        ];
    }
}
