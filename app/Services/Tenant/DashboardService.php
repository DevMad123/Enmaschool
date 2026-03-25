<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Attendance;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Evaluation;
use App\Models\Tenant\Payment;
use App\Models\Tenant\Period;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\ReportCard;
use App\Models\Tenant\SchoolLevel;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\Student;
use App\Models\Tenant\StudentFee;
use App\Models\Tenant\Subject;
use App\Models\Tenant\Teacher;
use App\Models\Tenant\TimetableEntry;
use App\Models\Tenant\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class DashboardService
{
    // ── Dashboard Direction ────────────────────────────────────────────────

    public function getDirectionStats(int $yearId): array
    {
        $tenantId = tenant('id');
        $cacheKey = "dashboard_direction_{$tenantId}_{$yearId}";

        return Cache::remember($cacheKey, 300, function () use ($yearId) {
            $year = AcademicYear::findOrFail($yearId);

            // ── École ──────────────────────────────────────────────────────
            $schoolName    = SchoolSetting::get('school_name', 'Enma School');
            $logoUrl       = SchoolSetting::get('logo_url');
            $passingAvg    = (float) SchoolSetting::get('passing_average', 10);
            $schoolTypes   = SchoolLevel::distinct('category')->pluck('category')
                ->map(fn ($c) => match ($c) {
                    'maternelle' => 'Maternelle',
                    'primaire'   => 'Primaire',
                    'college'    => 'Collège',
                    'lycee'      => 'Lycée',
                    default      => ucfirst($c),
                })->implode(' + ');

            // ── Élèves ─────────────────────────────────────────────────────
            $enrollments = Enrollment::where('academic_year_id', $yearId)
                ->where('status', 'active')
                ->with('student')
                ->get();

            $totalStudents  = $enrollments->count();
            $maleCount      = $enrollments->filter(fn ($e) => $e->student?->gender === 'male')->count();
            $femaleCount    = $enrollments->filter(fn ($e) => $e->student?->gender === 'female')->count();

            // Par catégorie via niveau
            $byCategory = $enrollments->load('classe.level')->groupBy(fn ($e) => $e->classe?->level?->category ?? 'other')
                ->map(fn ($g) => $g->count())->toArray();

            // Nouveaux ce mois
            $now           = Carbon::now();
            $startOfMonth  = $now->copy()->startOfMonth();
            $startOfPrev   = $now->copy()->subMonth()->startOfMonth();
            $endOfPrev     = $now->copy()->subMonth()->endOfMonth();

            $newThisMonth  = Enrollment::where('academic_year_id', $yearId)
                ->whereBetween('created_at', [$startOfMonth, $now])->count();
            $prevMonth     = Enrollment::where('academic_year_id', $yearId)
                ->whereBetween('created_at', [$startOfPrev, $endOfPrev])->count();
            $trend         = $prevMonth > 0
                ? round(($newThisMonth - $prevMonth) / $prevMonth * 100, 1)
                : 0.0;

            // ── Staff ──────────────────────────────────────────────────────
            $staff = User::whereDoesntHave('roles', fn ($q) => $q->whereIn('name', ['student', 'parent', 'super_admin']))
                ->where('is_active', true)->get();
            $byRole = $staff->groupBy(fn ($u) => $u->roles->first()?->name ?? 'other')->map(fn ($g) => $g->count())->toArray();

            $teachers = Teacher::where('is_active', true)->count();

            // ── Académique ────────────────────────────────────────────────
            $classesCount  = Classe::whereHas('enrollments', fn ($q) => $q->where('academic_year_id', $yearId))->count();
            $subjectsCount = Subject::where('is_active', true)->count();

            $currentPeriod = Period::where('academic_year_id', $yearId)
                ->where('start_date', '<=', $now)
                ->where('end_date', '>=', $now)
                ->first();
            $allPeriods    = Period::where('academic_year_id', $yearId)->get();
            $periodsClosed = $allPeriods->where('is_closed', true)->count();

            // ── Présences ─────────────────────────────────────────────────
            $attendanceThreshold = (float) SchoolSetting::get('absence_alert_threshold', 20);
            $today               = Carbon::today();

            $todayAttendance = Attendance::where('date', $today)->get();
            $todayRate       = null;
            if ($todayAttendance->count() > 0) {
                $presentCount = $todayAttendance->whereIn('status', ['present', 'late'])->count();
                $todayRate    = round($presentCount / $todayAttendance->count() * 100, 1);
            }

            $weekStart    = $now->copy()->startOfWeek();
            $weekEnd      = $now->copy()->endOfWeek();
            $weekRecords  = Attendance::whereBetween('date', [$weekStart, $weekEnd])->get();
            $weekRate     = 0.0;
            if ($weekRecords->count() > 0) {
                $weekPresent = $weekRecords->whereIn('status', ['present', 'late'])->count();
                $weekRate    = round($weekPresent / $weekRecords->count() * 100, 1);
            }

            // Élèves à risque (taux présence < seuil)
            $atRisk = $this->countAtRiskStudents($yearId, $attendanceThreshold);

            // ── Finance ────────────────────────────────────────────────────
            $fees = StudentFee::where('academic_year_id', $yearId)->get();
            $totalExpected  = $fees->sum(fn ($f) => (float) $f->amount_due - (float) $f->discount_amount);
            $totalCollected = $fees->sum(fn ($f) => (float) $f->amount_paid);
            $collectionRate = $totalExpected > 0
                ? round($totalCollected / $totalExpected * 100, 1)
                : 0.0;
            $overdueCount   = $fees->filter(fn ($f) => $f->status->value === 'overdue')->count();

            // ── Bulletins ─────────────────────────────────────────────────
            $bulletins  = ReportCard::where('academic_year_id', $yearId)->get();
            $published  = $bulletins->where('status', 'published')->count();
            $pending    = $bulletins->where('status', 'draft')->count();

            return [
                'school'    => [
                    'name'               => $schoolName,
                    'logo_url'           => $logoUrl,
                    'academic_year_name' => $year->name,
                    'school_types'       => $schoolTypes,
                ],
                'students'  => [
                    'total'          => $totalStudents,
                    'active'         => $totalStudents,
                    'by_gender'      => ['male' => $maleCount, 'female' => $femaleCount],
                    'by_category'    => $byCategory,
                    'new_this_month' => $newThisMonth,
                    'trend'          => $trend,
                ],
                'staff'     => [
                    'total'    => $staff->count(),
                    'teachers' => $teachers,
                    'by_role'  => $byRole,
                ],
                'academic'  => [
                    'classes_count'  => $classesCount,
                    'subjects_count' => $subjectsCount,
                    'current_period' => $currentPeriod ? [
                        'id'   => $currentPeriod->id,
                        'name' => $currentPeriod->name,
                        'type' => $currentPeriod->type ?? 'trimestre',
                    ] : null,
                    'periods_closed' => $periodsClosed,
                    'periods_total'  => $allPeriods->count(),
                ],
                'attendance' => [
                    'today_rate'      => $todayRate,
                    'week_rate'       => $weekRate,
                    'at_risk_students'=> $atRisk,
                ],
                'finance'   => [
                    'collection_rate'             => $collectionRate,
                    'total_collected'             => $totalCollected,
                    'total_remaining'             => $totalExpected - $totalCollected,
                    'overdue_count'               => $overdueCount,
                    'total_collected_formatted'   => number_format($totalCollected, 0, ',', ' ') . ' FCFA',
                    'total_remaining_formatted'   => number_format(max(0, $totalExpected - $totalCollected), 0, ',', ' ') . ' FCFA',
                ],
                'bulletins' => [
                    'total'     => $bulletins->count(),
                    'published' => $published,
                    'pending'   => $pending,
                ],
                'recent_activity' => [],
            ];
        });
    }

    // ── Dashboard Académique ───────────────────────────────────────────────

    public function getAcademicStats(int $yearId, ?int $periodId = null): array
    {
        $tenantId = tenant('id');
        $cacheKey = "dashboard_academic_{$tenantId}_{$yearId}_{$periodId}";

        return Cache::remember($cacheKey, 600, function () use ($yearId, $periodId) {
            $passingAvg = (float) SchoolSetting::get('passing_average', 10);
            $period     = $periodId ? Period::find($periodId) : null;

            // Toutes les moyennes de la période
            $avgQuery = PeriodAverage::where('academic_year_id', $yearId)
                ->with(['enrollment.classe.level', 'enrollment.student']);
            if ($periodId) {
                $avgQuery->where('period_id', $periodId);
            }
            $averages = $avgQuery->get();

            // ── Overall ────────────────────────────────────────────────────
            $avgsWithValues = $averages->whereNotNull('average');
            $avgGeneral     = $avgsWithValues->count() > 0
                ? round($avgsWithValues->avg('average'), 2)
                : null;
            $passingCount   = $avgsWithValues->where('average', '>=', $passingAvg)->count();
            $passingRate    = $avgsWithValues->count() > 0
                ? round($passingCount / $avgsWithValues->count() * 100, 1)
                : 0.0;

            // Top / bottom classes
            $byClasse = $averages->whereNotNull('average')
                ->groupBy(fn ($a) => $a->enrollment?->classe_id);

            $classeStats = $byClasse->map(function ($items, $classeId) use ($passingAvg) {
                $classe    = $items->first()?->enrollment?->classe;
                $avgs      = $items->pluck('average')->filter();
                $classAvg  = $avgs->count() > 0 ? round($avgs->avg(), 2) : null;
                $classPass = $avgs->count() > 0
                    ? round($avgs->filter(fn ($v) => $v >= $passingAvg)->count() / $avgs->count() * 100, 1)
                    : 0.0;
                return [
                    'id'           => $classeId,
                    'display_name' => $classe?->display_name ?? "Classe {$classeId}",
                    'average'      => $classAvg,
                    'passing_rate' => $classPass,
                    'count'        => $items->count(),
                ];
            })->values();

            $topClasse    = $classeStats->where('average', '!=', null)->sortByDesc('average')->first();
            $lowestClasse = $classeStats->where('average', '!=', null)->sortBy('average')->first();

            // ── By level ───────────────────────────────────────────────────
            $byLevel = $averages->whereNotNull('average')
                ->groupBy(fn ($a) => $a->enrollment?->classe?->level?->category ?? 'other')
                ->map(function ($items, $category) use ($passingAvg, $yearId) {
                    $level   = $items->first()?->enrollment?->classe?->level;
                    $avgs    = $items->pluck('average')->filter();
                    $avg     = $avgs->count() > 0 ? round($avgs->avg(), 2) : null;
                    $passing = $avgs->count() > 0
                        ? round($avgs->filter(fn ($v) => $v >= $passingAvg)->count() / $avgs->count() * 100, 1)
                        : 0.0;
                    return [
                        'level'          => [
                            'label'    => $level?->label ?? ucfirst((string) $category),
                            'category' => $category,
                        ],
                        'classes_count'  => $items->pluck('enrollment.classe_id')->unique()->count(),
                        'students_count' => $items->count(),
                        'avg_general'    => $avg,
                        'passing_rate'   => $passing,
                    ];
                })->values();

            // ── By classe (enrichi) ────────────────────────────────────────
            $byClasseEnriched = $classeStats->map(function ($c) use ($averages, $passingAvg, $yearId, $periodId) {
                $subjectAvgs = \App\Models\Tenant\SubjectAverage::where('academic_year_id', $yearId)
                    ->when($periodId, fn ($q) => $q->where('period_id', $periodId))
                    ->whereHas('enrollment', fn ($q) => $q->where('classe_id', $c['id']))
                    ->with('subject')
                    ->get()
                    ->groupBy('subject_id')
                    ->map(fn ($items) => [
                        'name'    => $items->first()?->subject?->name,
                        'average' => round($items->avg('average'), 2),
                    ]);

                $bestSubject  = $subjectAvgs->sortByDesc('average')->first();
                $worstSubject = $subjectAvgs->sortBy('average')->first();

                return [
                    'classe'        => ['id' => $c['id'], 'display_name' => $c['display_name']],
                    'students_count'=> $c['count'],
                    'avg_general'   => $c['average'],
                    'passing_rate'  => $c['passing_rate'],
                    'best_subject'  => $bestSubject,
                    'worst_subject' => $worstSubject,
                ];
            })->values();

            // ── By subject ─────────────────────────────────────────────────
            $subjectAverages = \App\Models\Tenant\SubjectAverage::where('academic_year_id', $yearId)
                ->when($periodId, fn ($q) => $q->where('period_id', $periodId))
                ->with('subject')
                ->get()
                ->groupBy('subject_id')
                ->map(function ($items) use ($passingAvg) {
                    $subject = $items->first()?->subject;
                    $avgs    = $items->pluck('average')->filter();
                    $avg     = $avgs->count() > 0 ? round($avgs->avg(), 2) : null;
                    $passing = $avgs->count() > 0
                        ? round($avgs->filter(fn ($v) => $v >= $passingAvg)->count() / $avgs->count() * 100, 1)
                        : 0.0;
                    return [
                        'subject'        => [
                            'id'    => $subject?->id,
                            'name'  => $subject?->name,
                            'code'  => $subject?->code,
                            'color' => $subject?->color ?? '#6b7280',
                        ],
                        'avg'            => $avg,
                        'passing_rate'   => $passing,
                        'classes_count'  => $items->pluck('enrollment.classe_id')->unique()->count(),
                    ];
                })->values();

            // ── Distribution des notes ─────────────────────────────────────
            $allAvgs = $avgsWithValues->pluck('average');
            $distribution = [
                '0-5'   => $allAvgs->filter(fn ($v) => $v < 5)->count(),
                '5-10'  => $allAvgs->filter(fn ($v) => $v >= 5 && $v < 10)->count(),
                '10-12' => $allAvgs->filter(fn ($v) => $v >= 10 && $v < 12)->count(),
                '12-14' => $allAvgs->filter(fn ($v) => $v >= 12 && $v < 14)->count(),
                '14-16' => $allAvgs->filter(fn ($v) => $v >= 14 && $v < 16)->count(),
                '16-20' => $allAvgs->filter(fn ($v) => $v >= 16)->count(),
            ];

            $evaluationsCount = Evaluation::where('academic_year_id', $yearId)
                ->when($periodId, fn ($q) => $q->where('period_id', $periodId))
                ->count();

            return [
                'period'                 => $period ? ['id' => $period->id, 'name' => $period->name] : null,
                'overall'                => [
                    'avg_general'    => $avgGeneral,
                    'passing_rate'   => $passingRate,
                    'top_classe'     => $topClasse ? ['display_name' => $topClasse['display_name'], 'average' => $topClasse['average']] : null,
                    'lowest_classe'  => $lowestClasse ? ['display_name' => $lowestClasse['display_name'], 'average' => $lowestClasse['average']] : null,
                ],
                'by_level'               => $byLevel,
                'by_classe'              => $byClasseEnriched,
                'by_subject'             => $subjectAverages,
                'grade_distribution'     => $distribution,
                'evaluations_this_period'=> $evaluationsCount,
            ];
        });
    }

    // ── Dashboard Présences ────────────────────────────────────────────────

    public function getAttendanceStats(int $yearId, ?int $periodId = null, ?Carbon $date = null): array
    {
        $tenantId  = tenant('id');
        $dateStr   = $date ? $date->toDateString() : Carbon::today()->toDateString();
        $cacheKey  = "dashboard_attendance_{$tenantId}_{$yearId}_{$periodId}_{$dateStr}";

        return Cache::remember($cacheKey, 120, function () use ($yearId, $periodId, $date) {
            $today     = $date ?? Carbon::today();
            $threshold = (float) SchoolSetting::get('absence_alert_threshold', 20);

            // ── Aujourd'hui ────────────────────────────────────────────────
            $todayRecords = Attendance::where('date', $today)->get();
            $totalToday   = $todayRecords->count();
            $presentToday = $todayRecords->where('status', 'present')->count();
            $absentToday  = $todayRecords->where('status', 'absent')->count();
            $lateToday    = $todayRecords->where('status', 'late')->count();
            $excusedToday = $todayRecords->where('status', 'excused')->count();
            $todayRate    = $totalToday > 0
                ? round(($presentToday + $lateToday) / $totalToday * 100, 1)
                : null;

            $classesWithRecord = $todayRecords->pluck('enrollment_id')
                ->map(fn ($id) => Enrollment::find($id)?->classe_id)
                ->filter()->unique()->count();
            $classesTotal = Classe::whereHas('enrollments', fn ($q) => $q->where('academic_year_id', $yearId))->count();

            // ── Période ────────────────────────────────────────────────────
            $periodRecords = Attendance::when($periodId, function ($q) use ($periodId) {
                $period = Period::find($periodId);
                if ($period) {
                    $q->whereBetween('date', [$period->start_date, $period->end_date]);
                }
            })->get();

            $periodTotal   = $periodRecords->count();
            $periodPresent = $periodRecords->whereIn('status', ['present', 'late'])->count();
            $avgRate       = $periodTotal > 0 ? round($periodPresent / $periodTotal * 100, 1) : 0.0;
            $absentHours   = $periodRecords->where('status', 'absent')->sum('duration_hours') ?? 0.0;
            $excusedHours  = $periodRecords->where('status', 'excused')->sum('duration_hours') ?? 0.0;

            // ── Élèves à risque ────────────────────────────────────────────
            $atRiskStudents = $this->getAtRiskStudents($yearId, $threshold);

            // ── Calendrier 30 jours ────────────────────────────────────────
            $byDay = [];
            for ($i = 29; $i >= 0; $i--) {
                $day     = Carbon::today()->subDays($i);
                $records = Attendance::where('date', $day)->get();
                $rate    = null;
                if ($records->count() > 0) {
                    $p    = $records->whereIn('status', ['present', 'late'])->count();
                    $rate = round($p / $records->count() * 100, 1);
                }
                $byDay[] = [
                    'date'     => $day->toDateString(),
                    'rate'     => $rate,
                    'recorded' => $records->count() > 0,
                ];
            }

            // ── Par classe ─────────────────────────────────────────────────
            $byClass = Classe::whereHas('enrollments', fn ($q) => $q->where('academic_year_id', $yearId))
                ->with('enrollments')
                ->get()
                ->map(function ($classe) use ($yearId, $threshold) {
                    $enrollmentIds = $classe->enrollments->where('academic_year_id', $yearId)->pluck('id');
                    $records       = Attendance::whereIn('enrollment_id', $enrollmentIds)->get();
                    $total         = $records->count();
                    $present       = $records->whereIn('status', ['present', 'late'])->count();
                    $rate          = $total > 0 ? round($present / $total * 100, 1) : 100.0;

                    $atRiskCount = $enrollmentIds->filter(function ($enrollmentId) use ($threshold) {
                        $recs  = Attendance::where('enrollment_id', $enrollmentId)->get();
                        $total = $recs->count();
                        if ($total === 0) return false;
                        $pres  = $recs->whereIn('status', ['present', 'late'])->count();
                        return ($pres / $total * 100) < (100 - $threshold);
                    })->count();

                    return [
                        'classe'          => ['id' => $classe->id, 'display_name' => $classe->display_name],
                        'attendance_rate' => $rate,
                        'at_risk_count'   => $atRiskCount,
                    ];
                })->values();

            // ── Justifications ─────────────────────────────────────────────
            $pendingJustif  = \App\Models\Tenant\AbsenceJustification::where('status', 'pending')->count();
            $approvedMonth  = \App\Models\Tenant\AbsenceJustification::where('status', 'approved')
                ->where('created_at', '>=', Carbon::now()->startOfMonth())->count();

            return [
                'today'           => [
                    'date'                => $today->toDateString(),
                    'overall_rate'        => $todayRate,
                    'present'             => $presentToday,
                    'absent'              => $absentToday,
                    'late'                => $lateToday,
                    'excused'             => $excusedToday,
                    'total'               => $totalToday,
                    'classes_with_record' => $classesWithRecord,
                    'classes_total'       => $classesTotal,
                ],
                'period'          => [
                    'avg_rate'           => $avgRate,
                    'total_absent_hours' => $absentHours,
                    'total_excused_hours'=> $excusedHours,
                    'most_absent_class'  => $byClass->sortBy('attendance_rate')->first(),
                    'best_class'         => $byClass->sortByDesc('attendance_rate')->first(),
                ],
                'at_risk_students'=> $atRiskStudents,
                'by_day'          => $byDay,
                'by_class'        => $byClass,
                'justifications'  => [
                    'pending'              => $pendingJustif,
                    'approved_this_month'  => $approvedMonth,
                ],
            ];
        });
    }

    // ── Dashboard Financier ────────────────────────────────────────────────

    public function getFinancialStats(int $yearId): array
    {
        $tenantId = tenant('id');
        $cacheKey = "dashboard_financial_{$tenantId}_{$yearId}";

        return Cache::remember($cacheKey, 300, function () use ($yearId) {
            $fees = StudentFee::where('academic_year_id', $yearId)
                ->with(['feeType', 'enrollment.classe.level'])
                ->get();

            $totalExpected   = $fees->sum(fn ($f) => max(0, (float) $f->amount_due - (float) $f->discount_amount));
            $totalCollected  = $fees->sum(fn ($f) => (float) $f->amount_paid);
            $totalRemaining  = max(0, $totalExpected - $totalCollected);
            $totalDiscounts  = $fees->sum(fn ($f) => (float) $f->discount_amount);
            $collectionRate  = $totalExpected > 0 ? round($totalCollected / $totalExpected * 100, 1) : 0.0;

            // ── By status ──────────────────────────────────────────────────
            $byStatus = [];
            foreach (['paid', 'partial', 'pending', 'overdue', 'waived'] as $status) {
                $group = $fees->filter(fn ($f) => $f->status->value === $status);
                $byStatus[$status] = [
                    'count'            => $group->count(),
                    'amount'           => $group->sum(fn ($f) => (float) $f->amount_paid),
                    'amount_remaining' => $group->sum(fn ($f) => max(0, (float) $f->amount_due - (float) $f->discount_amount - (float) $f->amount_paid)),
                ];
            }

            // ── By fee type ────────────────────────────────────────────────
            $byFeeType = $fees->groupBy('fee_type_id')->map(function ($items) {
                $feeType  = $items->first()?->feeType;
                $expected = $items->sum(fn ($f) => max(0, (float) $f->amount_due - (float) $f->discount_amount));
                $collected= $items->sum(fn ($f) => (float) $f->amount_paid);
                $rate     = $expected > 0 ? round($collected / $expected * 100, 1) : 0.0;
                return [
                    'fee_type'  => ['name' => $feeType?->name, 'code' => $feeType?->code],
                    'expected'  => $expected,
                    'collected' => $collected,
                    'rate'      => $rate,
                ];
            })->values();

            // ── By level ───────────────────────────────────────────────────
            $byLevel = $fees->groupBy(fn ($f) => $f->enrollment?->classe?->level?->category ?? 'other')
                ->map(function ($items, $category) {
                    $expected = $items->sum(fn ($f) => max(0, (float) $f->amount_due - (float) $f->discount_amount));
                    $collected= $items->sum(fn ($f) => (float) $f->amount_paid);
                    $rate     = $expected > 0 ? round($collected / $expected * 100, 1) : 0.0;
                    return [
                        'level'          => ucfirst((string) $category),
                        'expected'       => $expected,
                        'collected'      => $collected,
                        'rate'           => $rate,
                        'students_count' => $items->count(),
                    ];
                })->values();

            // ── Monthly trend (6 derniers mois) ───────────────────────────
            $monthlyTrend = [];
            for ($i = 5; $i >= 0; $i--) {
                $month     = Carbon::now()->subMonths($i);
                $monthStr  = $month->format('Y-m');
                $payments  = Payment::where('academic_year_id', $yearId)
                    ->whereYear('payment_date', $month->year)
                    ->whereMonth('payment_date', $month->month)
                    ->get();
                $monthlyTrend[] = [
                    'month'          => $monthStr,
                    'amount'         => $payments->sum('amount'),
                    'payments_count' => $payments->count(),
                ];
            }

            // ── By method ─────────────────────────────────────────────────
            $totalPaid = Payment::where('academic_year_id', $yearId)->sum('amount') ?: 1;
            $byMethod  = Payment::where('academic_year_id', $yearId)
                ->selectRaw('payment_method, SUM(amount) as total, COUNT(*) as cnt')
                ->groupBy('payment_method')
                ->get()
                ->map(fn ($r) => [
                    'method'     => $r->payment_method,
                    'amount'     => (float) $r->total,
                    'count'      => (int) $r->cnt,
                    'percentage' => round((float) $r->total / $totalPaid * 100, 1),
                ])->values();

            // ── Overdue students (top 10) ──────────────────────────────────
            $overdueStudents = StudentFee::where('academic_year_id', $yearId)
                ->where('status', 'overdue')
                ->with(['enrollment.student', 'enrollment.classe'])
                ->get()
                ->sortByDesc(fn ($f) => (float) $f->amount_due - (float) $f->discount_amount - (float) $f->amount_paid)
                ->take(10)
                ->map(function ($f) {
                    $remaining  = max(0, (float) $f->amount_due - (float) $f->discount_amount - (float) $f->amount_paid);
                    $daysOverdue = $f->due_date ? Carbon::now()->diffInDays($f->due_date, false) * -1 : 0;
                    return [
                        'student'                  => [
                            'full_name' => $f->enrollment?->student?->full_name,
                            'matricule' => $f->enrollment?->student?->matricule,
                        ],
                        'classe'                   => $f->enrollment?->classe?->display_name,
                        'amount_remaining'         => $remaining,
                        'amount_remaining_formatted' => number_format($remaining, 0, ',', ' ') . ' FCFA',
                        'days_overdue'             => (int) max(0, $daysOverdue),
                    ];
                })->values();

            return [
                'summary'          => [
                    'total_expected'           => $totalExpected,
                    'total_collected'          => $totalCollected,
                    'total_remaining'          => $totalRemaining,
                    'total_discounts'          => $totalDiscounts,
                    'collection_rate'          => $collectionRate,
                    'total_expected_formatted' => number_format($totalExpected, 0, ',', ' ') . ' FCFA',
                    'total_collected_formatted'=> number_format($totalCollected, 0, ',', ' ') . ' FCFA',
                    'total_remaining_formatted'=> number_format($totalRemaining, 0, ',', ' ') . ' FCFA',
                ],
                'by_status'        => $byStatus,
                'by_fee_type'      => $byFeeType,
                'by_level'         => $byLevel,
                'monthly_trend'    => $monthlyTrend,
                'by_method'        => $byMethod,
                'overdue_students' => $overdueStudents,
            ];
        });
    }

    // ── Dashboard Enseignant ───────────────────────────────────────────────

    public function getTeacherDashboard(int $teacherId, int $yearId): array
    {
        $cacheKey = "dashboard_teacher_{$teacherId}_{$yearId}";

        return Cache::remember($cacheKey, 180, function () use ($teacherId, $yearId) {
            $teacher = Teacher::with('user')->findOrFail($teacherId);

            // ── Classes affectées ──────────────────────────────────────────
            $assignments = \App\Models\Tenant\TeacherClass::where('teacher_id', $teacherId)
                ->where('academic_year_id', $yearId)
                ->with(['classe.enrollments' => fn ($q) => $q->where('academic_year_id', $yearId), 'subject'])
                ->get();

            $classes = $assignments->map(function ($a) use ($yearId, $teacherId) {
                $classeId   = $a->classe_id;
                $periodId   = Period::where('academic_year_id', $yearId)
                    ->where('start_date', '<=', Carbon::today())
                    ->where('end_date', '>=', Carbon::today())
                    ->value('id');
                $enrollmentIds = $a->classe->enrollments->pluck('id');

                $subjectAvgs = \App\Models\Tenant\SubjectAverage::where('subject_id', $a->subject_id)
                    ->whereIn('enrollment_id', $enrollmentIds)
                    ->when($periodId, fn ($q) => $q->where('period_id', $periodId))
                    ->pluck('average')
                    ->filter();
                $avg         = $subjectAvgs->count() > 0 ? round($subjectAvgs->avg(), 2) : null;
                $passingAvg  = (float) SchoolSetting::get('passing_average', 10);
                $passingRate = $subjectAvgs->count() > 0
                    ? round($subjectAvgs->filter(fn ($v) => $v >= $passingAvg)->count() / $subjectAvgs->count() * 100, 1)
                    : 0.0;

                $attendanceRecords = Attendance::whereIn('enrollment_id', $enrollmentIds)->get();
                $attTotal    = $attendanceRecords->count();
                $attPresent  = $attendanceRecords->whereIn('status', ['present', 'late'])->count();
                $attRate     = $attTotal > 0 ? round($attPresent / $attTotal * 100, 1) : 100.0;

                $evalCount = Evaluation::where('class_id', $classeId)
                    ->where('subject_id', $a->subject_id)
                    ->where('academic_year_id', $yearId)->count();

                $nextEval  = Evaluation::where('class_id', $classeId)
                    ->where('subject_id', $a->subject_id)
                    ->where('date', '>', Carbon::today())
                    ->orderBy('date')
                    ->first();

                return [
                    'classe'           => ['id' => $classeId, 'display_name' => $a->classe->display_name],
                    'subject'          => ['name' => $a->subject?->name, 'code' => $a->subject?->code, 'color' => $a->subject?->color ?? '#6b7280'],
                    'students_count'   => $enrollmentIds->count(),
                    'evaluations_count'=> $evalCount,
                    'avg_general'      => $avg,
                    'passing_rate'     => $passingRate,
                    'attendance_rate'  => $attRate,
                    'next_evaluation'  => $nextEval ? ['title' => $nextEval->title, 'date' => $nextEval->date] : null,
                ];
            })->values();

            // ── Cette semaine ──────────────────────────────────────────────
            $weekStart = Carbon::now()->startOfWeek();
            $weekEnd   = Carbon::now()->endOfWeek();
            $weekEntries = TimetableEntry::where('teacher_id', $teacherId)
                ->with(['classe', 'subject', 'timeSlot', 'room'])
                ->get();

            $schedule = [];
            $days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
            foreach ($weekEntries as $entry) {
                $dayIndex = ($entry->timeSlot?->day_of_week ?? 1) - 1;
                $schedule[] = [
                    'day_label'  => $days[$dayIndex] ?? 'Lundi',
                    'time_range' => ($entry->timeSlot?->start_time ?? '08:00') . ' - ' . ($entry->timeSlot?->end_time ?? '09:00'),
                    'classe'     => $entry->classe?->display_name,
                    'subject'    => $entry->subject?->name,
                    'room'       => $entry->room?->name,
                    'is_cancelled' => false,
                ];
            }

            $totalHours = collect($weekEntries)->sum(function ($e) {
                $start = Carbon::parse($e->timeSlot?->start_time ?? '08:00');
                $end   = Carbon::parse($e->timeSlot?->end_time ?? '09:00');
                return $end->diffInMinutes($start) / 60;
            });

            // ── Notes récentes ─────────────────────────────────────────────
            $recentGrades = Evaluation::where('academic_year_id', $yearId)
                ->whereHas('teacherClass', fn ($q) => $q->where('teacher_id', $teacherId))
                ->with('classe')
                ->orderByDesc('date')
                ->take(10)
                ->get()
                ->map(fn ($e) => [
                    'evaluation_title' => $e->title,
                    'classe'           => $e->classe?->display_name,
                    'date'             => $e->date,
                    'avg_score'        => \App\Models\Tenant\Grade::where('evaluation_id', $e->id)->avg('score'),
                ]);

            // ── Actions en attente ─────────────────────────────────────────
            $evalsToLock = Evaluation::where('academic_year_id', $yearId)
                ->whereHas('teacherClass', fn ($q) => $q->where('teacher_id', $teacherId))
                ->where('is_locked', false)->count();
            $absencesToRecord = TimetableEntry::where('teacher_id', $teacherId)
                ->whereDoesntHave('attendances', fn ($q) => $q->where('date', Carbon::today()))
                ->count();

            return [
                'teacher'         => [
                    'full_name'       => $teacher->user?->full_name,
                    'employee_number' => $teacher->employee_number,
                    'weekly_hours'    => round($totalHours, 1),
                    'max_hours'       => $teacher->max_hours_per_week ?? 40,
                ],
                'classes'         => $classes,
                'this_week'       => [
                    'courses_count' => count($weekEntries),
                    'total_hours'   => round($totalHours, 1),
                    'schedule'      => $schedule,
                ],
                'recent_grades'   => $recentGrades,
                'pending_actions' => [
                    'evaluations_to_lock'   => $evalsToLock,
                    'absences_to_record'    => $absencesToRecord,
                ],
            ];
        });
    }

    // ── Invalidation du cache ──────────────────────────────────────────────

    public function invalidateDashboardCache(string $key = 'all'): void
    {
        $tenantId = tenant('id');

        if ($key === 'all') {
            Cache::forget("dashboard_direction_{$tenantId}_*");
            Cache::forget("dashboard_academic_{$tenantId}_*");
            Cache::forget("dashboard_attendance_{$tenantId}_*");
            Cache::forget("dashboard_financial_{$tenantId}_*");

            // Flush par pattern (Redis)
            try {
                $redis = Cache::getStore();
                if (method_exists($redis, 'getRedis')) {
                    $prefix  = config('cache.prefix');
                    $pattern = "{$prefix}dashboard_*_{$tenantId}_*";
                    $keys    = $redis->getRedis()->keys($pattern);
                    if (! empty($keys)) {
                        $redis->getRedis()->del($keys);
                    }
                }
            } catch (\Throwable) {
                // Fallback silencieux si Redis non disponible
            }
        } else {
            Cache::forget($key);
        }
    }

    // ── Helpers privés ────────────────────────────────────────────────────

    private function countAtRiskStudents(int $yearId, float $threshold): int
    {
        return $this->getAtRiskStudents($yearId, $threshold)->count();
    }

    private function getAtRiskStudents(int $yearId, float $threshold): \Illuminate\Support\Collection
    {
        $enrollments = Enrollment::where('academic_year_id', $yearId)
            ->where('status', 'active')
            ->with(['student', 'classe'])
            ->get();

        return $enrollments->filter(function ($enrollment) use ($threshold) {
            $records = Attendance::where('enrollment_id', $enrollment->id)->get();
            $total   = $records->count();
            if ($total === 0) return false;
            $present = $records->whereIn('status', ['present', 'late'])->count();
            $rate    = $present / $total * 100;
            return $rate < (100 - $threshold);
        })->take(10)->map(fn ($e) => [
            'student'         => ['full_name' => $e->student?->full_name, 'matricule' => $e->student?->matricule],
            'classe'          => $e->classe?->display_name,
            'attendance_rate' => (function () use ($e) {
                $records = Attendance::where('enrollment_id', $e->id)->get();
                $total   = $records->count();
                if ($total === 0) return 100.0;
                $present = $records->whereIn('status', ['present', 'late'])->count();
                return round($present / $total * 100, 1);
            })(),
            'absent_hours'    => Attendance::where('enrollment_id', $e->id)->where('status', 'absent')->sum('duration_hours') ?? 0,
        ])->values();
    }
}
