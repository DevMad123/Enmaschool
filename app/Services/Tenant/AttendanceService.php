<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\AttendanceStatus;
use App\Enums\JustificationStatus;
use App\Jobs\UpdateReportCardAbsencesJob;
use App\Models\Tenant\AbsenceJustification;
use App\Models\Tenant\Attendance;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Period;
use App\Models\Tenant\ReportCard;
use App\Models\Tenant\TimetableEntry;
use App\Models\Tenant\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Storage;

class AttendanceService
{
    // ── Saisie des présences ───────────────────────────────────────────────

    /**
     * Saisir les présences pour un créneau précis à une date donnée.
     *
     * $records = [
     *   ['enrollment_id' => 1, 'status' => 'present'],
     *   ['enrollment_id' => 2, 'status' => 'absent', 'note' => '...'],
     *   ['enrollment_id' => 3, 'status' => 'late', 'minutes_late' => 15],
     * ]
     */
    public function recordForEntry(
        TimetableEntry $entry,
        Carbon         $date,
        array          $records,
        User           $by,
    ): array {
        $periodId = $this->resolvePeriodId($date, $entry->academic_year_id);
        $errors   = [];
        $recorded = 0;

        foreach ($records as $record) {
            try {
                Attendance::updateOrCreate(
                    [
                        'enrollment_id'      => $record['enrollment_id'],
                        'timetable_entry_id' => $entry->id,
                        'date'               => $date->toDateString(),
                    ],
                    [
                        'period_id'   => $periodId,
                        'status'      => $record['status'],
                        'minutes_late' => ($record['status'] === 'late') ? ($record['minutes_late'] ?? null) : null,
                        'note'        => $record['note'] ?? null,
                        'recorded_by' => $by->id,
                        'recorded_at' => now(),
                    ]
                );
                $recorded++;
            } catch (\Throwable $e) {
                $errors[] = [
                    'enrollment_id' => $record['enrollment_id'],
                    'error'         => $e->getMessage(),
                ];
            }
        }

        return ['recorded' => $recorded, 'errors' => $errors];
    }

    /**
     * Saisie journée entière (timetable_entry_id = NULL).
     */
    public function recordForDay(
        int    $classeId,
        Carbon $date,
        array  $records,
        User   $by,
    ): array {
        // Résoudre l'academic_year_id depuis les inscriptions actives
        $firstEnrollment = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->first();

        $periodId = $firstEnrollment
            ? $this->resolvePeriodId($date, $firstEnrollment->academic_year_id)
            : null;

        $errors   = [];
        $recorded = 0;

        foreach ($records as $record) {
            try {
                Attendance::updateOrCreate(
                    [
                        'enrollment_id'      => $record['enrollment_id'],
                        'timetable_entry_id' => null,
                        'date'               => $date->toDateString(),
                    ],
                    [
                        'period_id'    => $periodId,
                        'status'       => $record['status'],
                        'minutes_late' => ($record['status'] === 'late') ? ($record['minutes_late'] ?? null) : null,
                        'note'         => $record['note'] ?? null,
                        'recorded_by'  => $by->id,
                        'recorded_at'  => now(),
                    ]
                );
                $recorded++;
            } catch (\Throwable $e) {
                $errors[] = [
                    'enrollment_id' => $record['enrollment_id'],
                    'error'         => $e->getMessage(),
                ];
            }
        }

        return ['recorded' => $recorded, 'errors' => $errors];
    }

    /**
     * Toutes les présences pour un créneau à une date (eager load enrollment.student).
     */
    public function getForEntry(TimetableEntry $entry, Carbon $date): Collection
    {
        return Attendance::forEntry($entry->id)
            ->forDate($date)
            ->with(['enrollment.student'])
            ->get();
    }

    /**
     * Présences de tous les élèves d'une classe pour une date,
     * organisées par timetable_entry (cours du jour).
     */
    public function getForClass(int $classeId, Carbon $date): array
    {
        $dayOfWeek = $date->dayOfWeekIso; // 1=Lun … 6=Sam

        $entries = TimetableEntry::with(['timeSlot', 'subject', 'teacher.user', 'room'])
            ->where('class_id', $classeId)
            ->where('is_active', true)
            ->whereHas('timeSlot', fn ($q) => $q->where('day_of_week', $dayOfWeek)
                                                 ->where('is_break', false))
            ->get();

        $enrollments = Enrollment::with('student')
            ->where('classe_id', $classeId)
            ->where('is_active', true)
            ->get();

        $result = [];

        foreach ($entries as $entry) {
            $attendances = Attendance::forEntry($entry->id)->forDate($date)
                ->with(['enrollment.student'])
                ->get()
                ->keyBy('enrollment_id');

            $students = $enrollments->map(function ($enrollment) use ($attendances) {
                $att = $attendances->get($enrollment->id);
                return [
                    'enrollment_id' => $enrollment->id,
                    'student'       => $enrollment->student,
                    'status'        => $att?->status,
                    'is_recorded'   => $att !== null,
                ];
            })->values()->toArray();

            $summary = $this->buildSummary($attendances->values());

            $result[] = [
                'time_slot'        => $entry->timeSlot,
                'timetable_entry'  => $entry,
                'attendances'      => $students,
                'summary'          => $summary,
            ];
        }

        return $result;
    }

    /**
     * Feuille d'appel pour un créneau précis.
     * Tous les élèves inscrits + leur statut (null si pas encore saisi).
     */
    public function getSheetForEntry(TimetableEntry $entry, Carbon $date): array
    {
        $enrollments = Enrollment::with('student')
            ->where('classe_id', $entry->class_id)
            ->where('is_active', true)
            ->get()
            ->sortBy(fn ($e) => $e->student?->last_name);

        $attendances = Attendance::forEntry($entry->id)->forDate($date)
            ->get()
            ->keyBy('enrollment_id');

        $isRecorded = $attendances->isNotEmpty();

        $students = $enrollments->map(function ($enrollment) use ($attendances) {
            $att = $attendances->get($enrollment->id);
            return [
                'enrollment_id' => $enrollment->id,
                'student'       => $enrollment->student,
                'attendance'    => $att,
                'status'        => $att?->status,
            ];
        })->values()->toArray();

        $summary = $this->buildSummary($attendances->values());

        return [
            'entry'       => $entry,
            'date'        => $date->toDateString(),
            'is_recorded' => $isRecorded,
            'students'    => $students,
            'summary'     => $summary,
        ];
    }

    // ── Statistiques ──────────────────────────────────────────────────────

    public function getStudentStats(
        int  $enrollmentId,
        ?int $periodId  = null,
        ?int $yearId    = null,
    ): array {
        $query = Attendance::forEnrollment($enrollmentId);

        if ($periodId) {
            $query->forPeriod($periodId);
        } elseif ($yearId) {
            $query->whereHas('period', fn ($q) => $q->whereHas(
                'academicYear', fn ($q2) => $q2->where('id', $yearId)
            ));
        }

        $attendances = $query->get();

        $present = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Present)->count();
        $absent  = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Absent)->count();
        $late    = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Late)->count();
        $excused = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Excused)->count();
        $total   = $attendances->count();

        // Calcul des heures : durée du time_slot ou 1h par défaut
        $absentHours  = $this->calcHours($attendances->where('status', AttendanceStatus::Absent));
        $excusedHours = $this->calcHours($attendances->where('status', AttendanceStatus::Excused));

        $attendanceRate = $total > 0
            ? round((($present + $late) / $total) * 100, 1)
            : 100.0;

        return [
            'total_courses'      => $total,
            'present'            => $present,
            'absent'             => $absent,
            'late'               => $late,
            'excused'            => $excused,
            'total_absent_hours' => round($absentHours + $excusedHours, 2),
            'absent_hours'       => round($absentHours, 2),
            'excused_hours'      => round($excusedHours, 2),
            'attendance_rate'    => $attendanceRate,
        ];
    }

    public function getClassStats(int $classeId, Carbon $date): array
    {
        $enrollments = Enrollment::with('student')
            ->where('classe_id', $classeId)
            ->where('is_active', true)
            ->get();

        $attendances = Attendance::forClass($classeId)->forDate($date)->get();
        $summary     = $this->buildSummary($attendances);

        return [
            'classe_id'   => $classeId,
            'date'        => $date->toDateString(),
            'summary'     => $summary,
            'enrollments' => $enrollments,
        ];
    }

    public function getPeriodStats(int $classeId, int $periodId): array
    {
        $enrollments = Enrollment::with('student')
            ->where('classe_id', $classeId)
            ->where('is_active', true)
            ->get();

        $students = $enrollments->map(function ($enrollment) use ($periodId) {
            $stats = $this->getStudentStats($enrollment->id, $periodId);
            return array_merge($stats, [
                'enrollment_id' => $enrollment->id,
                'student'       => $enrollment->student,
            ]);
        })->sortByDesc('absent_hours')->values()->toArray();

        $avgRate = count($students) > 0
            ? round(array_sum(array_column($students, 'attendance_rate')) / count($students), 1)
            : 100.0;

        return [
            'students'    => $students,
            'avg_rate'    => $avgRate,
        ];
    }

    /**
     * Recalcule absences_justified / absences_unjustified sur un bulletin.
     */
    public function updateReportCardAbsences(int $enrollmentId, int $reportCardId): void
    {
        $reportCard = ReportCard::find($reportCardId);
        if (! $reportCard) {
            return;
        }

        $stats = $this->getStudentStats($enrollmentId, $reportCard->period_id ?? null);

        $reportCard->update([
            'absences_justified'   => $stats['excused'],
            'absences_unjustified' => $stats['absent'],
        ]);
    }

    // ── Justifications ─────────────────────────────────────────────────────

    public function submitJustification(array $data, User $submittedBy): AbsenceJustification
    {
        $documentPath = null;

        if (isset($data['document']) && $data['document'] instanceof UploadedFile) {
            $documentPath = $data['document']->store(
                'justifications',
                'tenant'
            );
        }

        return AbsenceJustification::create([
            'enrollment_id' => $data['enrollment_id'],
            'date_from'     => $data['date_from'],
            'date_to'       => $data['date_to'],
            'reason'        => $data['reason'],
            'document_path' => $documentPath,
            'status'        => JustificationStatus::Pending,
            'submitted_by'  => $submittedBy->id,
        ]);
    }

    public function approveJustification(
        AbsenceJustification $justif,
        User                 $reviewer,
        string               $note = '',
    ): AbsenceJustification {
        $justif->update([
            'status'      => JustificationStatus::Approved,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'review_note' => $note ?: null,
        ]);

        // Toutes les absences non justifiées dans la plage → excused
        Attendance::forEnrollment($justif->enrollment_id)
            ->betweenDates($justif->date_from->toDateString(), $justif->date_to->toDateString())
            ->where('status', AttendanceStatus::Absent)
            ->update(['status' => AttendanceStatus::Excused]);

        // Recalcul asynchrone des bulletins
        $reportCardIds = ReportCard::whereHas('enrollment', fn ($q) =>
            $q->where('id', $justif->enrollment_id)
        )->pluck('id')->toArray();

        if (! empty($reportCardIds)) {
            dispatch(new UpdateReportCardAbsencesJob($justif->enrollment_id, $reportCardIds));
        }

        return $justif->fresh();
    }

    public function rejectJustification(
        AbsenceJustification $justif,
        User                 $reviewer,
        string               $note,
    ): AbsenceJustification {
        $justif->update([
            'status'      => JustificationStatus::Rejected,
            'reviewed_by' => $reviewer->id,
            'reviewed_at' => now(),
            'review_note' => $note,
        ]);

        return $justif;
    }

    // ── Calendrier mensuel ─────────────────────────────────────────────────

    /**
     * Pour chaque jour du mois : taux de présence de la classe.
     */
    public function getClassCalendar(int $classeId, int $yearId, string $month): array
    {
        $start = Carbon::parse($month . '-01')->startOfMonth();
        $end   = $start->copy()->endOfMonth();

        $enrollments = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->count();

        $attendances = Attendance::forClass($classeId)
            ->whereBetween('date', [$start->toDateString(), $end->toDateString()])
            ->get()
            ->groupBy(fn ($a) => $a->date->toDateString());

        $days   = [];
        $cursor = $start->copy();

        while ($cursor->lte($end)) {
            $dateStr  = $cursor->toDateString();
            $dayAttrs = $attendances->get($dateStr);

            if ($dayAttrs && $dayAttrs->isNotEmpty() && $enrollments > 0) {
                $presentCount = $dayAttrs->filter(fn ($a) => $a->status->isPresent())->count();
                $rate         = round(($presentCount / max($dayAttrs->count(), 1)) * 100, 1);
                $days[]       = ['date' => $dateStr, 'attendance_rate' => $rate, 'recorded' => true];
            } else {
                $days[] = ['date' => $dateStr, 'attendance_rate' => null, 'recorded' => false];
            }

            $cursor->addDay();
        }

        return $days;
    }

    // ── Helpers ───────────────────────────────────────────────────────────

    private function resolvePeriodId(Carbon $date, int $academicYearId): ?int
    {
        return Period::where('academic_year_id', $academicYearId)
            ->where('start_date', '<=', $date->toDateString())
            ->where('end_date', '>=', $date->toDateString())
            ->value('id');
    }

    private function buildSummary(Collection $attendances): array
    {
        $present = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Present)->count();
        $absent  = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Absent)->count();
        $late    = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Late)->count();
        $excused = $attendances->filter(fn ($a) => $a->status === AttendanceStatus::Excused)->count();
        $total   = $attendances->count();

        return [
            'present'         => $present,
            'absent'          => $absent,
            'late'            => $late,
            'excused'         => $excused,
            'total'           => $total,
            'attendance_rate' => $total > 0
                ? round((($present + $late) / $total) * 100, 1)
                : 0.0,
        ];
    }

    private function calcHours(Collection $attendances): float
    {
        $hours = 0.0;
        foreach ($attendances as $att) {
            if ($att->timetableEntry?->timeSlot) {
                $slot     = $att->timetableEntry->timeSlot;
                $start    = Carbon::parse($slot->start_time);
                $end      = Carbon::parse($slot->end_time);
                $hours   += $start->diffInMinutes($end) / 60;
            } else {
                $hours += 1.0; // 1h par défaut si pas de créneau associé
            }
        }
        return $hours;
    }
}
