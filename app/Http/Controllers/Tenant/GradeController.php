<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\BulkSaveGradesRequest;
use App\Http\Resources\Tenant\GradeResource;
use App\Http\Resources\Tenant\GradesSheetResource;
use App\Http\Resources\Tenant\PeriodAverageResource;
use App\Http\Resources\Tenant\StudentGradesSummaryResource;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Evaluation;
use App\Models\Tenant\Grade;
use App\Models\Tenant\Period;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\Student;
use App\Models\Tenant\Subject;
use App\Models\Tenant\SubjectAverage;
use App\Services\Tenant\AverageCalculatorService;
use App\Services\Tenant\GradeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class GradeController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly GradeService              $gradeService,
        private readonly AverageCalculatorService  $calcService,
    ) {}

    public function sheet(Request $request): JsonResponse
    {
        $classeId  = (int) $request->query('class_id');
        $subjectId = (int) $request->query('subject_id');
        $periodId  = (int) $request->query('period_id');

        if (!$classeId || !$subjectId || !$periodId) {
            return $this->error('Les paramètres class_id, subject_id et period_id sont requis.', 422);
        }

        $sheet = $this->gradeService->getGradesSheet($classeId, $subjectId, $periodId);

        $classe  = Classe::findOrFail($classeId);
        $subject = Subject::findOrFail($subjectId);
        $period  = Period::findOrFail($periodId);

        return $this->success(new GradesSheetResource([
            'classe'       => $classe,
            'subject'      => $subject,
            'period'       => $period,
            'evaluations'  => $sheet['evaluations'],
            'students'     => $sheet['students'],
            'class_stats'  => $sheet['class_stats'],
        ]));
    }

    public function bulkSave(BulkSaveGradesRequest $request): JsonResponse
    {
        $evaluation = Evaluation::with('period')->findOrFail($request->input('evaluation_id'));

        $result = $this->gradeService->bulkSave(
            $evaluation,
            $request->input('grades', []),
            $request->user(),
        );

        return $this->success($result);
    }

    public function saveOne(Request $request, Grade $grade): JsonResponse
    {
        $evaluation = $grade->evaluation()->with('period')->first();

        if (!$evaluation || !$evaluation->isEditable()) {
            return $this->error('Cette note ne peut plus être modifiée.', 422);
        }

        $data = $request->only(['score', 'is_absent', 'absence_justified', 'comment']);
        $data['updated_by'] = $request->user()->id;
        $data['entered_at'] = $data['entered_at'] ?? now();

        $grade->update($data);

        return $this->success(new GradeResource($grade->refresh()->load(['student', 'evaluation'])));
    }

    public function studentSummary(Request $request, Student $student): JsonResponse
    {
        $yearId = (int) $request->query('academic_year_id');
        if (!$yearId) {
            return $this->error('Le paramètre academic_year_id est requis.', 422);
        }

        $enrollment = Enrollment::where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->firstOrFail();

        $periods = Period::where('academic_year_id', $yearId)->orderBy('order')->get();

        $periodAveragesData = $periods->map(function (Period $period) use ($student, $yearId) {
            $averages = PeriodAverage::with('subject')
                ->where('student_id', $student->id)
                ->where('period_id', $period->id)
                ->where('academic_year_id', $yearId)
                ->get();

            $totalWeighted = $averages->sum(fn($a) => (float) $a->weighted_average);
            $totalCoeff    = $averages->sum(fn($a) => (float) $a->coefficient);
            $generalAvg    = $totalCoeff > 0 ? round($totalWeighted / $totalCoeff, 2) : null;

            return [
                'period'          => $period,
                'averages'        => $averages->map(fn($a) => [
                    'subject'    => $a->subject,
                    'average'    => $a->average,
                    'rank'       => $a->rank,
                    'is_passing' => $a->is_passing,
                ]),
                'general_average' => $generalAvg,
                'general_rank'    => null, // Phase 7
            ];
        });

        $annualAverages = SubjectAverage::with('subject')
            ->where('student_id', $student->id)
            ->where('academic_year_id', $yearId)
            ->get()
            ->map(fn($sa) => [
                'subject'        => $sa->subject,
                'annual_average' => $sa->annual_average,
                'is_passing'     => $sa->is_passing,
            ]);

        $generalAnnual = $this->calcService->calculateGeneralAverage($student->id, $yearId);

        return $this->success(new StudentGradesSummaryResource([
            'student'                => $student,
            'enrollment_id'          => $enrollment->id,
            'period_averages'        => $periodAveragesData,
            'annual_averages'        => $annualAverages,
            'general_annual_average' => $generalAnnual,
        ]));
    }

    public function classSummary(Request $request, Classe $classe): JsonResponse
    {
        $periodId = (int) $request->query('period_id');
        $yearId   = (int) $request->query('academic_year_id');

        if (!$periodId || !$yearId) {
            return $this->error('Les paramètres period_id et academic_year_id sont requis.', 422);
        }

        $averages = PeriodAverage::with(['student', 'subject'])
            ->where('class_id', $classe->id)
            ->where('period_id', $periodId)
            ->where('academic_year_id', $yearId)
            ->get();

        return $this->success(PeriodAverageResource::collection($averages));
    }

    public function periodAverages(Request $request): JsonResponse
    {
        $query = PeriodAverage::with(['subject', 'period', 'student']);

        foreach (['class_id', 'period_id', 'subject_id', 'student_id'] as $filter) {
            if ($request->filled($filter)) {
                $query->where($filter, $request->query($filter));
            }
        }

        $perPage = (int) ($request->query('per_page', 20));

        return $this->paginated($query->paginate($perPage));
    }

    public function recalculate(Request $request): JsonResponse
    {
        $classeId = (int) $request->input('class_id');
        $periodId = (int) $request->input('period_id');

        if (!$classeId || !$periodId) {
            return $this->error('Les paramètres class_id et period_id sont requis.', 422);
        }

        $this->calcService->calculateAllPeriodAverages($classeId, $periodId);

        return $this->success(['message' => 'Recalcul lancé en arrière-plan.']);
    }
}
