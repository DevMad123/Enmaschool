<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Exports\AttendanceExport;
use App\Exports\PaymentsExport;
use App\Exports\ResultsExport;
use App\Exports\StudentsExport;
use App\Models\Tenant\Attendance;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Period;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\Student;
use App\Models\Tenant\StudentFee;
use App\Models\Tenant\SubjectAverage;
use Carbon\Carbon;
use Illuminate\Support\Facades\Storage;
use Maatwebsite\Excel\Facades\Excel;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportService
{
    // ── Données pour les rapports ────────────────────────────────────────

    public function getStudentsReport(int $yearId, array $filters = []): array
    {
        $query = Enrollment::where('academic_year_id', $yearId)
            ->where('status', 'active')
            ->with(['student.parents', 'classe.level']);

        if (! empty($filters['classe_id'])) {
            $query->where('classe_id', $filters['classe_id']);
        }
        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }
        if (! empty($filters['level_category'])) {
            $query->whereHas('classe.level', fn ($q) => $q->where('category', $filters['level_category']));
        }

        return $query->get()->map(function ($enrollment) {
            $student  = $enrollment->student;
            $parents  = $student?->parents ?? collect();
            $parent1  = $parents->first();
            $parent2  = $parents->skip(1)->first();

            return [
                'matricule'     => $student?->matricule,
                'last_name'     => $student?->last_name,
                'first_name'    => $student?->first_name,
                'birth_date'    => $student?->birth_date?->format('d/m/Y'),
                'gender'        => $student?->gender === 'male' ? 'M' : 'F',
                'classe'        => $enrollment->classe?->display_name,
                'level'         => $enrollment->classe?->level?->label,
                'category'      => $enrollment->classe?->level?->category,
                'nationality'   => $student?->nationality ?? '-',
                'status'        => $enrollment->status,
                'parent1_name'  => $parent1 ? $parent1->full_name : '-',
                'parent1_phone' => $parent1 ? $parent1->phone : '-',
                'parent2_name'  => $parent2 ? $parent2->full_name : '-',
                'parent2_phone' => $parent2 ? $parent2->phone : '-',
            ];
        })->toArray();
    }

    public function getStudentResultsReport(int $yearId, int $periodId): array
    {
        $passingAvg  = (float) SchoolSetting::get('passing_average', 10);
        $enrollments = Enrollment::where('academic_year_id', $yearId)
            ->where('status', 'active')
            ->with(['student', 'classe', 'periodAverages' => fn ($q) => $q->where('period_id', $periodId)])
            ->get();

        $subjects = \App\Models\Tenant\Subject::where('is_active', true)->orderBy('name')->get();

        return $enrollments->map(function ($enrollment) use ($periodId, $passingAvg, $subjects) {
            $periodAvg = $enrollment->periodAverages->first();
            $row = [
                'matricule'   => $enrollment->student?->matricule,
                'nom'         => $enrollment->student?->last_name,
                'prenom'      => $enrollment->student?->first_name,
                'classe'      => $enrollment->classe?->display_name,
            ];

            foreach ($subjects as $subject) {
                $subjectAvg = PeriodAverage::where('enrollment_id', $enrollment->id)
                    ->where('subject_id', $subject->id)
                    ->where('period_id', $periodId)
                    ->value('average');
                $row[$subject->name] = $subjectAvg !== null ? number_format((float) $subjectAvg, 2) : '-';
            }

            $row['moyenne_generale'] = $periodAvg?->average !== null
                ? number_format((float) $periodAvg->average, 2)
                : '-';
            $row['rang']       = $periodAvg?->rank ?? '-';
            $row['decision']   = $periodAvg?->decision ?? '-';

            return $row;
        })->toArray();
    }

    public function getAttendanceReport(int $yearId, ?int $periodId, ?int $classeId): array
    {
        $query = Enrollment::where('academic_year_id', $yearId)
            ->where('status', 'active')
            ->with(['student', 'classe']);

        if ($classeId) {
            $query->where('classe_id', $classeId);
        }

        $period = $periodId ? Period::find($periodId) : null;

        return $query->get()->map(function ($enrollment) use ($period) {
            $attendanceQuery = Attendance::where('enrollment_id', $enrollment->id);
            if ($period) {
                $attendanceQuery->whereBetween('date', [$period->start_date, $period->end_date]);
            }
            $records      = $attendanceQuery->get();
            $total        = $records->count();
            $present      = $records->whereIn('status', ['present', 'late'])->count();
            $absentHours  = $records->where('status', 'absent')->sum('duration_hours') ?? 0;
            $excusedHours = $records->where('status', 'excused')->sum('duration_hours') ?? 0;
            $rate         = $total > 0 ? round($present / $total * 100, 1) : 100.0;

            return [
                'matricule'              => $enrollment->student?->matricule,
                'nom'                    => $enrollment->student?->last_name,
                'prenom'                 => $enrollment->student?->first_name,
                'classe'                 => $enrollment->classe?->display_name,
                'heures_absence'         => $absentHours,
                'heures_justifiees'      => $excusedHours,
                'heures_non_justifiees'  => max(0, $absentHours - $excusedHours),
                'taux_presence'          => $rate,
            ];
        })->toArray();
    }

    public function getPaymentsReport(int $yearId, array $filters = []): array
    {
        $query = Payment::where('academic_year_id', $yearId)
            ->with(['studentFee.feeType', 'enrollment.student', 'enrollment.classe', 'recordedBy']);

        if (! empty($filters['date_from']) && ! empty($filters['date_to'])) {
            $query->whereBetween('payment_date', [$filters['date_from'], $filters['date_to']]);
        }
        if (! empty($filters['method'])) {
            $query->where('payment_method', $filters['method']);
        }
        if (! empty($filters['class_id'])) {
            $query->whereHas('enrollment', fn ($q) => $q->where('classe_id', $filters['class_id']));
        }

        return $query->orderByDesc('payment_date')->get()->map(fn ($p) => [
            'recu_no'       => $p->id,
            'date'          => $p->payment_date?->format('d/m/Y'),
            'eleve'         => $p->enrollment?->student?->full_name,
            'classe'        => $p->enrollment?->classe?->display_name,
            'type_frais'    => $p->studentFee?->feeType?->name,
            'montant'       => number_format((float) $p->amount, 0, ',', ' ') . ' FCFA',
            'mode_paiement' => $p->payment_method,
            'saisi_par'     => $p->recordedBy?->full_name,
        ])->toArray();
    }

    // ── Exports Excel ────────────────────────────────────────────────────

    public function exportStudents(int $yearId, array $filters = []): BinaryFileResponse
    {
        $year     = \App\Models\Tenant\AcademicYear::findOrFail($yearId);
        $filename = 'eleves-' . str_replace('/', '-', $year->name) . '.xlsx';
        return Excel::download(new StudentsExport($yearId, $filters), $filename);
    }

    public function exportResults(int $yearId, int $periodId): BinaryFileResponse
    {
        $year     = \App\Models\Tenant\AcademicYear::findOrFail($yearId);
        $period   = Period::findOrFail($periodId);
        $filename = 'resultats-' . str_replace('/', '-', $year->name) . '-' . $period->name . '.xlsx';
        return Excel::download(new ResultsExport($yearId, $periodId), $filename);
    }

    public function exportAttendance(int $yearId, ?int $periodId, ?int $classeId): BinaryFileResponse
    {
        $year     = \App\Models\Tenant\AcademicYear::findOrFail($yearId);
        $filename = 'absences-' . str_replace('/', '-', $year->name) . '.xlsx';
        return Excel::download(new AttendanceExport($yearId, $periodId, $classeId), $filename);
    }

    public function exportPayments(int $yearId, array $filters = []): BinaryFileResponse
    {
        $year     = \App\Models\Tenant\AcademicYear::findOrFail($yearId);
        $filename = 'paiements-' . str_replace('/', '-', $year->name) . '.xlsx';
        return Excel::download(new PaymentsExport($yearId, $filters), $filename);
    }

    // ── PDF ──────────────────────────────────────────────────────────────

    public function generateYearSummaryPdf(int $yearId): string
    {
        $year     = \App\Models\Tenant\AcademicYear::findOrFail($yearId);
        $dashSvc  = app(DashboardService::class);

        $data = [
            'year'       => $year,
            'direction'  => $dashSvc->getDirectionStats($yearId),
            'academic'   => $dashSvc->getAcademicStats($yearId),
            'attendance' => $dashSvc->getAttendanceStats($yearId),
            'financial'  => $dashSvc->getFinancialStats($yearId),
            'school_name'=> SchoolSetting::get('school_name', 'Enma School'),
            'generated_at' => Carbon::now()->format('d/m/Y H:i'),
        ];

        $pdf      = app('dompdf.wrapper');
        $html     = view('pdf.year_summary', $data)->render();
        $pdf->loadHTML($html);

        $filename = 'synthese-annuelle-' . $yearId . '-' . time() . '.pdf';
        $path     = 'reports/' . $filename;
        Storage::put($path, $pdf->output());

        return $path;
    }

    public function generateClassResultsPdf(int $classeId, int $periodId): string
    {
        $classe   = \App\Models\Tenant\Classe::with('level')->findOrFail($classeId);
        $period   = Period::with('academicYear')->findOrFail($periodId);
        $passingAvg = (float) SchoolSetting::get('passing_average', 10);
        $subjects = \App\Models\Tenant\Subject::where('is_active', true)->orderBy('name')->get();

        $enrollments = Enrollment::where('classe_id', $classeId)
            ->where('academic_year_id', $period->academic_year_id)
            ->where('status', 'active')
            ->with(['student', 'periodAverages' => fn ($q) => $q->where('period_id', $periodId)])
            ->get()
            ->sortBy('periodAverages.0.rank');

        $classAvg = PeriodAverage::where('period_id', $periodId)
            ->whereIn('enrollment_id', $enrollments->pluck('id'))
            ->avg('average');

        $data = [
            'classe'      => $classe,
            'period'      => $period,
            'subjects'    => $subjects,
            'enrollments' => $enrollments,
            'passing_avg' => $passingAvg,
            'class_avg'   => $classAvg ? round($classAvg, 2) : null,
            'school_name' => SchoolSetting::get('school_name', 'Enma School'),
            'generated_at'=> Carbon::now()->format('d/m/Y H:i'),
        ];

        $pdf  = app('dompdf.wrapper');
        $html = view('pdf.class_results', $data)->render();
        $pdf->loadHTML($html);

        $filename = 'resultats-classe-' . $classeId . '-' . $periodId . '-' . time() . '.pdf';
        $path     = 'reports/' . $filename;
        Storage::put($path, $pdf->output());

        return $path;
    }
}
