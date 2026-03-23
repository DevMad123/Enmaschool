<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Jobs\RecalculatePeriodAverageJob;
use App\Models\Tenant\ClassSubject;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Evaluation;
use App\Models\Tenant\Grade;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\SubjectAverage;
use Illuminate\Support\Facades\DB;

class AverageCalculatorService
{
    public function calculatePeriodAverage(
        int $studentId,
        int $subjectId,
        int $periodId,
    ): PeriodAverage {
        $enrollment = Enrollment::where('student_id', $studentId)
            ->where('is_active', true)
            ->firstOrFail();

        // All evaluations for this subject/period
        $evaluations = Evaluation::forSubject($subjectId)
            ->forPeriod($periodId)
            ->get(['id', 'max_score', 'coefficient', 'class_id']);

        $classeId = $evaluations->first()?->class_id ?? $enrollment->classe_id;

        // Get all grades for this student
        $evalIds = $evaluations->pluck('id');

        $grades = Grade::whereIn('evaluation_id', $evalIds)
            ->where('student_id', $studentId)
            ->whereNotNull('score')
            ->get(['evaluation_id', 'score', 'is_absent']);

        // Build evaluation coefficient map
        $evalMap = $evaluations->keyBy('id');

        $totalScore      = 0.0;
        $totalCoefficient = 0.0;
        $absencesCount   = Grade::whereIn('evaluation_id', $evalIds)
            ->where('student_id', $studentId)
            ->where('is_absent', true)
            ->count();

        foreach ($grades as $grade) {
            $eval = $evalMap->get($grade->evaluation_id);
            if (!$eval) {
                continue;
            }

            $maxScore    = (float) $eval->max_score;
            $coefficient = (float) $eval->coefficient;
            $scoreOn20   = $maxScore == 20 ? (float) $grade->score : ((float) $grade->score * 20 / $maxScore);

            $totalScore       += $scoreOn20 * $coefficient;
            $totalCoefficient += $coefficient;
        }

        $average = $totalCoefficient > 0 ? round($totalScore / $totalCoefficient, 2) : null;

        // Subject coefficient from class_subjects
        $classSubject = ClassSubject::where('class_id', $classeId)
            ->where('subject_id', $subjectId)
            ->first();

        $subjectCoeff    = $classSubject ? (float) $classSubject->effective_coefficient : 1.0;
        $weightedAverage = $average !== null ? round($average * $subjectCoeff, 2) : null;

        // Class statistics
        $classStudentIds = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->pluck('student_id');

        $classAverages = $this->batchCalculateAverages($classStudentIds->toArray(), $subjectId, $periodId, $evalMap);

        $validClassAverages = collect($classAverages)->filter(fn($a) => $a !== null);
        $classAvg           = $validClassAverages->avg();
        $minScore           = $validClassAverages->min();
        $maxScore           = $validClassAverages->max();

        // Rank calculation (standard competition: tied students share same rank)
        $rank = null;
        if ($average !== null) {
            $higherCount = $validClassAverages->filter(fn($a) => $a > (float) $average)->count();
            $rank = $higherCount + 1;
        }

        return PeriodAverage::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'subject_id'    => $subjectId,
                'period_id'     => $periodId,
            ],
            [
                'student_id'        => $studentId,
                'class_id'          => $classeId,
                'academic_year_id'  => $enrollment->academic_year_id,
                'average'           => $average,
                'weighted_average'  => $weightedAverage,
                'coefficient'       => $subjectCoeff,
                'evaluations_count' => $grades->count(),
                'absences_count'    => $absencesCount,
                'rank'              => $rank,
                'class_average'     => $classAvg !== null ? round((float) $classAvg, 2) : null,
                'min_score'         => $minScore !== null ? round((float) $minScore, 2) : null,
                'max_score'         => $maxScore !== null ? round((float) $maxScore, 2) : null,
                'calculated_at'     => now(),
            ],
        );
    }

    public function calculateAllPeriodAverages(int $classeId, int $periodId): void
    {
        $enrollments = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->get(['id', 'student_id']);

        $subjects = ClassSubject::where('class_id', $classeId)
            ->pluck('subject_id');

        foreach ($enrollments as $enrollment) {
            foreach ($subjects as $subjectId) {
                RecalculatePeriodAverageJob::dispatch(
                    $enrollment->student_id,
                    $subjectId,
                    $periodId,
                    $classeId,
                );
            }
        }
    }

    public function calculateSubjectAnnualAverage(
        int $studentId,
        int $subjectId,
        int $yearId,
    ): SubjectAverage {
        $enrollment = Enrollment::where('student_id', $studentId)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->firstOrFail();

        $periodAverages = PeriodAverage::where('student_id', $studentId)
            ->where('subject_id', $subjectId)
            ->where('academic_year_id', $yearId)
            ->whereNotNull('average')
            ->get();

        $annualAverage  = null;
        $periodSnapshot = [];

        if ($periodAverages->isNotEmpty()) {
            $total = $periodAverages->sum(fn($pa) => (float) $pa->average);
            $annualAverage = round($total / $periodAverages->count(), 2);

            foreach ($periodAverages as $pa) {
                $periodSnapshot[(string) $pa->period_id] = (float) $pa->average;
            }
        }

        $subjectCoeff    = $periodAverages->first()?->coefficient ?? 1.0;
        $weightedAverage = $annualAverage !== null ? round($annualAverage * (float) $subjectCoeff, 2) : null;

        $passingAverage = (float) SchoolSetting::get('passing_average', 10.0);
        $isPassing = $annualAverage !== null ? $annualAverage >= $passingAverage : null;

        return SubjectAverage::updateOrCreate(
            [
                'enrollment_id'    => $enrollment->id,
                'subject_id'       => $subjectId,
                'academic_year_id' => $yearId,
            ],
            [
                'student_id'       => $studentId,
                'class_id'         => $enrollment->classe_id,
                'annual_average'   => $annualAverage,
                'weighted_average' => $weightedAverage,
                'coefficient'      => $subjectCoeff,
                'is_passing'       => $isPassing,
                'period_averages'  => $periodSnapshot,
                'calculated_at'    => now(),
            ],
        );
    }

    public function calculateGeneralAverage(int $studentId, int $yearId): float|null
    {
        $subjectAverages = SubjectAverage::where('student_id', $studentId)
            ->where('academic_year_id', $yearId)
            ->whereNotNull('annual_average')
            ->get(['weighted_average', 'coefficient']);

        if ($subjectAverages->isEmpty()) {
            return null;
        }

        $totalWeighted  = $subjectAverages->sum(fn($sa) => (float) $sa->weighted_average);
        $totalCoeff     = $subjectAverages->sum(fn($sa) => (float) $sa->coefficient);

        return $totalCoeff > 0 ? round($totalWeighted / $totalCoeff, 2) : null;
    }

    public function recalculateClassRanks(int $classeId, int $periodId): void
    {
        $subjects = ClassSubject::where('class_id', $classeId)->pluck('subject_id');

        foreach ($subjects as $subjectId) {
            $averages = PeriodAverage::where('class_id', $classeId)
                ->where('period_id', $periodId)
                ->where('subject_id', $subjectId)
                ->whereNotNull('average')
                ->orderBy('average', 'desc')
                ->get(['id', 'average']);

            foreach ($averages as $rank => $pa) {
                PeriodAverage::where('id', $pa->id)->update(['rank' => $rank + 1]);
            }
        }
    }

    private function batchCalculateAverages(
        array $studentIds,
        int $subjectId,
        int $periodId,
        \Illuminate\Support\Collection $evalMap,
    ): array {
        if (empty($studentIds) || $evalMap->isEmpty()) {
            return [];
        }

        $evalIds = $evalMap->keys()->toArray();

        $gradesByStudent = Grade::whereIn('evaluation_id', $evalIds)
            ->whereIn('student_id', $studentIds)
            ->whereNotNull('score')
            ->get(['evaluation_id', 'student_id', 'score'])
            ->groupBy('student_id');

        $averages = [];
        foreach ($studentIds as $sid) {
            $studentGrades  = $gradesByStudent->get($sid, collect());
            $total          = 0.0;
            $totalCoeff     = 0.0;

            foreach ($studentGrades as $grade) {
                $eval = $evalMap->get($grade->evaluation_id);
                if (!$eval) {
                    continue;
                }
                $maxScore    = (float) $eval->max_score;
                $coefficient = (float) $eval->coefficient;
                $scoreOn20   = $maxScore == 20 ? (float) $grade->score : ((float) $grade->score * 20 / $maxScore);

                $total      += $scoreOn20 * $coefficient;
                $totalCoeff += $coefficient;
            }

            $averages[$sid] = $totalCoeff > 0 ? round($total / $totalCoeff, 2) : null;
        }

        return $averages;
    }
}
