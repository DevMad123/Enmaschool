<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\DayOfWeek;
use App\Exceptions\TimetableConflictException;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\BulkStoreTimetableRequest;
use App\Http\Requests\Tenant\CheckConflictsRequest;
use App\Http\Requests\Tenant\StoreOverrideRequest;
use App\Http\Requests\Tenant\StoreTimetableEntryRequest;
use App\Http\Requests\Tenant\UpdateTimetableEntryRequest;
use App\Http\Resources\Tenant\TimetableEntryResource;
use App\Http\Resources\Tenant\TimetableOverrideResource;
use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Classe;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\TimeSlot;
use App\Models\Tenant\TimetableEntry;
use App\Models\Tenant\TimetableOverride;
use App\Services\Tenant\TimetableService;
use App\Traits\ApiResponse;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\StreamedResponse;

class TimetableController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly TimetableService $service,
    ) {}

    // ── Week View ──────────────────────────────────────────────────────────

    /**
     * Emploi du temps hebdomadaire pour une classe ou un enseignant.
     * GET /api/school/timetable?class_id=X&year_id=Y
     * GET /api/school/timetable?teacher_id=X&year_id=Y
     */
    public function weekView(Request $request): JsonResponse
    {
        $request->validate([
            'year_id'    => ['required', 'integer', 'exists:academic_years,id'],
            'class_id'   => ['nullable', 'integer', 'exists:classes,id'],
            'teacher_id' => ['nullable', 'integer', 'exists:teachers,id'],
        ]);

        $yearId = (int) $request->input('year_id');

        if ($request->filled('class_id')) {
            $entriesByDay = TimetableEntry::with(['timeSlot', 'subject', 'teacher.user', 'room'])
                ->forClass((int) $request->input('class_id'))
                ->forYear($yearId)
                ->active()
                ->get()
                ->groupBy(fn (TimetableEntry $e) => $e->timeSlot?->day_of_week?->value ?? 0);

            $slots = TimeSlot::active()->orderBy('day_of_week')->orderBy('order')->get();

            return $this->success([
                'entries'    => $entriesByDay->map(fn ($entries) => TimetableEntryResource::collection($entries)),
                'time_slots' => $slots->groupBy(fn ($s) => $s->day_of_week?->value ?? 0),
            ]);
        }

        if ($request->filled('teacher_id')) {
            $entriesByDay = TimetableEntry::with(['timeSlot', 'subject', 'classe', 'room'])
                ->forTeacher((int) $request->input('teacher_id'))
                ->forYear($yearId)
                ->active()
                ->get()
                ->groupBy(fn (TimetableEntry $e) => $e->timeSlot?->day_of_week?->value ?? 0);

            $slots = TimeSlot::active()->orderBy('day_of_week')->orderBy('order')->get();

            return $this->success([
                'entries'    => $entriesByDay->map(fn ($entries) => TimetableEntryResource::collection($entries)),
                'time_slots' => $slots->groupBy(fn ($s) => $s->day_of_week?->value ?? 0),
            ]);
        }

        return $this->error('Veuillez fournir class_id ou teacher_id.', 422);
    }

    // ── CRUD Entries ───────────────────────────────────────────────────────

    public function store(StoreTimetableEntryRequest $request): JsonResponse
    {
        try {
            $data    = $request->validated();
            $data['created_by'] = auth()->id();

            $entry = $this->service->create($data);
            $entry->load(['timeSlot', 'subject', 'teacher.user', 'room']);

            return $this->created(new TimetableEntryResource($entry));
        } catch (TimetableConflictException $e) {
            return response()->json([
                'success'   => false,
                'message'   => $e->getMessage(),
                'conflicts' => $e->getConflicts(),
            ], 409);
        }
    }

    public function show(TimetableEntry $timetableEntry): JsonResponse
    {
        $timetableEntry->load(['timeSlot', 'subject', 'teacher.user', 'room', 'classe', 'overrides']);

        return $this->success(new TimetableEntryResource($timetableEntry));
    }

    public function update(UpdateTimetableEntryRequest $request, TimetableEntry $timetableEntry): JsonResponse
    {
        try {
            $entry = $this->service->update($timetableEntry, $request->validated());
            $entry->load(['timeSlot', 'subject', 'teacher.user', 'room']);

            return $this->success(new TimetableEntryResource($entry));
        } catch (TimetableConflictException $e) {
            return response()->json([
                'success'   => false,
                'message'   => $e->getMessage(),
                'conflicts' => $e->getConflicts(),
            ], 409);
        }
    }

    public function destroy(TimetableEntry $timetableEntry): JsonResponse
    {
        $this->service->delete($timetableEntry);

        return $this->success(null, 'Entrée supprimée.');
    }

    // ── Bulk ───────────────────────────────────────────────────────────────

    public function bulkStore(BulkStoreTimetableRequest $request): JsonResponse
    {
        try {
            $entries = $this->service->bulkStore(
                classId:        $request->integer('class_id'),
                academicYearId: $request->integer('academic_year_id'),
                entries:        $request->input('entries'),
            );

            return $this->success([
                'count'   => $entries->count(),
                'entries' => TimetableEntryResource::collection($entries),
            ], 'Emploi du temps enregistré.');
        } catch (TimetableConflictException $e) {
            return response()->json([
                'success'   => false,
                'message'   => $e->getMessage(),
                'conflicts' => $e->getConflicts(),
            ], 409);
        }
    }

    // ── Conflict Check ─────────────────────────────────────────────────────

    public function checkConflicts(CheckConflictsRequest $request): JsonResponse
    {
        $conflicts = $this->service->checkConflicts(
            academicYearId: $request->integer('academic_year_id'),
            timeSlotId:     $request->integer('time_slot_id'),
            teacherId:      $request->filled('teacher_id') ? $request->integer('teacher_id') : null,
            roomId:         $request->filled('room_id') ? $request->integer('room_id') : null,
            excludeEntryId: $request->filled('exclude_entry_id') ? $request->integer('exclude_entry_id') : null,
        );

        return $this->success([
            'has_conflicts' => ! empty($conflicts),
            'conflicts'     => $conflicts,
        ]);
    }

    // ── Overrides ──────────────────────────────────────────────────────────

    public function overrides(TimetableEntry $timetableEntry): JsonResponse
    {
        $overrides = $timetableEntry->overrides()
            ->with(['substituteTeacher', 'newRoom', 'rescheduledToSlot'])
            ->orderBy('date')
            ->get();

        return $this->success(TimetableOverrideResource::collection($overrides));
    }

    public function storeOverride(StoreOverrideRequest $request, TimetableEntry $timetableEntry): JsonResponse
    {
        $data             = $request->validated();
        $data['created_by'] = auth()->id();

        $override = $this->service->createOverride($timetableEntry, $data);
        $override->load(['substituteTeacher', 'newRoom', 'rescheduledToSlot']);

        return $this->created(new TimetableOverrideResource($override));
    }

    public function destroyOverride(TimetableOverride $override): JsonResponse
    {
        $this->service->deleteOverride($override);

        return $this->success(null, 'Dérogation supprimée.');
    }

    // ── PDF Export ─────────────────────────────────────────────────────────

    public function downloadPdf(Request $request): StreamedResponse
    {
        $request->validate([
            'class_id' => ['required', 'integer', 'exists:classes,id'],
            'year_id'  => ['required', 'integer', 'exists:academic_years,id'],
        ]);

        $classe       = Classe::with('mainTeacher')->findOrFail($request->integer('class_id'));
        $academicYear = AcademicYear::findOrFail($request->integer('year_id'));

        // Tous les créneaux actifs, groupés par ordre
        $slots = TimeSlot::active()
            ->orderBy('day_of_week')
            ->orderBy('order')
            ->get();

        $slotsByOrder = $slots->groupBy('order');
        $slotOrders   = $slotsByOrder->keys()->sort()->values();

        // Entrées groupées par day_of_week
        $entries = TimetableEntry::with(['timeSlot', 'subject', 'teacher.user', 'room'])
            ->forClass($request->integer('class_id'))
            ->forYear($request->integer('year_id'))
            ->active()
            ->get()
            ->groupBy(fn (TimetableEntry $e) => $e->timeSlot?->day_of_week?->value ?? 0);

        // Jours affichés (seulement ceux qui ont des créneaux)
        $activeDays = $slots->pluck('day_of_week')
            ->map(fn ($d) => $d instanceof DayOfWeek ? $d->value : (int) $d)
            ->unique()
            ->sort()
            ->values();

        $dayLabels = [
            1 => 'Lundi', 2 => 'Mardi', 3 => 'Mercredi',
            4 => 'Jeudi', 5 => 'Vendredi', 6 => 'Samedi',
        ];

        $days = $activeDays->mapWithKeys(fn ($d) => [$d => $dayLabels[$d] ?? "Jour {$d}"])->toArray();

        $school = [
            'name'  => SchoolSetting::get('school_name', 'École'),
            'motto' => SchoolSetting::get('school_motto', ''),
        ];

        $pdf = Pdf::loadView('pdf.timetable', compact(
            'classe', 'academicYear', 'entries', 'slotsByOrder', 'slotOrders', 'days', 'school'
        ))->setPaper('A4', 'landscape');

        $filename = 'emploi_du_temps_' . str_replace(' ', '_', $classe->display_name) . '.pdf';

        return response()->streamDownload(
            fn () => print($pdf->output()),
            $filename,
            ['Content-Type' => 'application/pdf'],
        );
    }
}
