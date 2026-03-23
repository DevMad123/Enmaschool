<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\RecordAttendanceRequest;
use App\Http\Resources\Tenant\AttendanceResource;
use App\Http\Resources\Tenant\AttendanceSheetResource;
use App\Http\Resources\Tenant\ClassAttendanceStatsResource;
use App\Http\Resources\Tenant\StudentAttendanceStatsResource;
use App\Models\Tenant\Attendance;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\TimetableEntry;
use App\Services\Tenant\AttendanceService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Carbon;

class AttendanceController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AttendanceService $service) {}

    /**
     * GET /school/attendance/sheet
     * params: entry_id?, class_id, date
     */
    public function sheet(Request $request): JsonResponse
    {
        $request->validate([
            'date'     => ['required', 'date'],
            'class_id' => ['required', 'exists:classes,id'],
            'entry_id' => ['nullable', 'exists:timetable_entries,id'],
        ]);

        $date = Carbon::parse($request->date);

        if ($request->filled('entry_id')) {
            $entry = TimetableEntry::with(['timeSlot', 'subject', 'teacher.user', 'room'])
                ->findOrFail($request->integer('entry_id'));

            $sheet = $this->service->getSheetForEntry($entry, $date);
        } else {
            $sheet = [
                'entry'       => null,
                'date'        => $date->toDateString(),
                'is_recorded' => false,
                'students'    => [],
                'summary'     => ['present' => 0, 'absent' => 0, 'late' => 0, 'excused' => 0, 'total' => 0, 'attendance_rate' => 0.0],
            ];
            $classData = $this->service->getForClass($request->integer('class_id'), $date);
            // Return grouped view (all courses of the day)
            return $this->success(
                collect($classData)->map(fn ($row) => (new AttendanceSheetResource($row))->toArray($request))->all()
            );
        }

        return $this->success(new AttendanceSheetResource($sheet));
    }

    /**
     * POST /school/attendance/record
     */
    public function record(RecordAttendanceRequest $request): JsonResponse
    {
        $data    = $request->validated();
        $date    = Carbon::parse($data['date']);
        $user    = $request->user();
        $records = $data['records'];

        if (! empty($data['entry_id'])) {
            $entry  = TimetableEntry::findOrFail($data['entry_id']);
            $result = $this->service->recordForEntry($entry, $date, $records, $user);

            // Return updated sheet
            $entry->loadMissing(['timeSlot', 'subject', 'teacher.user', 'room']);
            $sheet = $this->service->getSheetForEntry($entry, $date);

            return $this->success([
                'recorded' => $result['recorded'],
                'errors'   => $result['errors'],
                'sheet'    => (new AttendanceSheetResource($sheet))->toArray($request),
            ]);
        }

        $request->validate(['class_id' => ['required', 'exists:classes,id']]);
        $result = $this->service->recordForDay($request->integer('class_id'), $date, $records, $user);

        return $this->success(['recorded' => $result['recorded'], 'errors' => $result['errors']]);
    }

    /**
     * GET /school/attendance/student/{enrollment}
     */
    public function studentStats(Request $request, Enrollment $enrollment): JsonResponse
    {
        $request->validate([
            'period_id'        => ['nullable', 'exists:periods,id'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
        ]);

        $stats = $this->service->getStudentStats(
            $enrollment->id,
            $request->integer('period_id') ?: null,
            $request->integer('academic_year_id') ?: null,
        );

        $stats['enrollment_id'] = $enrollment->id;
        $stats['student']       = $enrollment->load('student')->student;

        return $this->success(new StudentAttendanceStatsResource($stats));
    }

    /**
     * GET /school/attendance/student/{enrollment}/history
     */
    public function studentHistory(Request $request, Enrollment $enrollment): AnonymousResourceCollection
    {
        $request->validate([
            'date_from' => ['nullable', 'date'],
            'date_to'   => ['nullable', 'date'],
            'status'    => ['nullable', 'string'],
            'per_page'  => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = Attendance::forEnrollment($enrollment->id)
            ->with(['timetableEntry.subject', 'timetableEntry.timeSlot', 'recordedBy', 'period']);

        if ($request->filled('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }
        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        $perPage = $request->integer('per_page', 25);

        return AttendanceResource::collection($query->latest('date')->paginate($perPage));
    }

    /**
     * GET /school/attendance/class/{classe}
     */
    public function classStats(Request $request, Classe $classe): JsonResponse
    {
        $request->validate([
            'period_id'        => ['nullable', 'exists:periods,id'],
            'academic_year_id' => ['nullable', 'exists:academic_years,id'],
            'date'             => ['nullable', 'date'],
        ]);

        if ($request->filled('period_id')) {
            $data = $this->service->getPeriodStats($classe->id, $request->integer('period_id'));
            $data['classe']  = $classe;
            $data['period']  = \App\Models\Tenant\Period::find($request->integer('period_id'));
            $data['date']    = null;
            $data['threshold'] = 80.0;
        } else {
            $date   = Carbon::parse($request->date ?? now()->toDateString());
            $data   = $this->service->getClassStats($classe->id, $date);
            $data['classe']    = $classe;
            $data['period']    = null;
            $data['date']      = $date->toDateString();
            $data['threshold'] = 80.0;

            // Build per-student stats for display
            $data['students'] = collect($data['enrollments'])->map(function ($enrollment) use ($data) {
                $stats = $this->service->getStudentStats($enrollment->id);
                $stats['enrollment_id'] = $enrollment->id;
                $stats['student']       = $enrollment->student;
                return $stats;
            })->sortByDesc('absent_hours')->values()->toArray();
        }

        return $this->success(new ClassAttendanceStatsResource($data));
    }

    /**
     * GET /school/attendance/class/{classe}/calendar
     */
    public function classCalendar(Request $request, Classe $classe): JsonResponse
    {
        $request->validate([
            'year_id' => ['required', 'exists:academic_years,id'],
            'month'   => ['required', 'regex:/^\d{4}-\d{2}$/'],
        ]);

        $days = $this->service->getClassCalendar(
            $classe->id,
            $request->integer('year_id'),
            $request->string('month'),
        );

        return $this->success($days);
    }
}
