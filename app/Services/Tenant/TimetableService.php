<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Exceptions\TimetableConflictException;
use App\Models\Tenant\TimetableEntry;
use App\Models\Tenant\TimetableOverride;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class TimetableService
{
    // ── Week View ──────────────────────────────────────────────────────────

    /**
     * Returns entries grouped by day_of_week for a given class and year.
     *
     * @return array<int, Collection<TimetableEntry>>
     */
    public function getWeekViewForClass(int $classId, int $academicYearId): array
    {
        $entries = TimetableEntry::with(['timeSlot', 'subject', 'teacher.user', 'room'])
            ->forClass($classId)
            ->forYear($academicYearId)
            ->active()
            ->get()
            ->groupBy(fn (TimetableEntry $e) => $e->timeSlot?->day_of_week?->value ?? 0);

        return $entries->toArray();
    }

    /**
     * Returns entries for a given teacher and year grouped by day_of_week.
     *
     * @return array<int, Collection<TimetableEntry>>
     */
    public function getWeekViewForTeacher(int $teacherId, int $academicYearId): array
    {
        $entries = TimetableEntry::with(['timeSlot', 'subject', 'classe', 'room'])
            ->forTeacher($teacherId)
            ->forYear($academicYearId)
            ->active()
            ->get()
            ->groupBy(fn (TimetableEntry $e) => $e->timeSlot?->day_of_week?->value ?? 0);

        return $entries->toArray();
    }

    // ── CRUD ───────────────────────────────────────────────────────────────

    /**
     * Create a timetable entry after conflict detection.
     *
     * @param array<string, mixed> $data
     * @throws TimetableConflictException
     */
    public function create(array $data): TimetableEntry
    {
        $this->assertNoConflicts(
            academicYearId: (int) $data['academic_year_id'],
            timeSlotId:     (int) $data['time_slot_id'],
            teacherId:      isset($data['teacher_id']) ? (int) $data['teacher_id'] : null,
            roomId:         isset($data['room_id']) ? (int) $data['room_id'] : null,
        );

        return DB::transaction(function () use ($data): TimetableEntry {
            return TimetableEntry::create($data);
        });
    }

    /**
     * Update an entry after conflict detection.
     *
     * @param array<string, mixed> $data
     * @throws TimetableConflictException
     */
    public function update(TimetableEntry $entry, array $data): TimetableEntry
    {
        $this->assertNoConflicts(
            academicYearId: (int) ($data['academic_year_id'] ?? $entry->academic_year_id),
            timeSlotId:     (int) ($data['time_slot_id'] ?? $entry->time_slot_id),
            teacherId:      isset($data['teacher_id']) ? (int) $data['teacher_id'] : $entry->teacher_id,
            roomId:         isset($data['room_id']) ? (int) $data['room_id'] : $entry->room_id,
            excludeEntryId: $entry->id,
        );

        return DB::transaction(function () use ($entry, $data): TimetableEntry {
            $entry->update($data);

            return $entry->fresh();
        });
    }

    public function delete(TimetableEntry $entry): void
    {
        $entry->delete();
    }

    /**
     * Bulk upsert a set of entries for a class+year (replace all).
     *
     * @param list<array<string, mixed>> $entries
     * @throws TimetableConflictException
     */
    public function bulkStore(int $classId, int $academicYearId, array $entries): Collection
    {
        // Validate each entry individually
        foreach ($entries as $data) {
            $this->assertNoConflicts(
                academicYearId: $academicYearId,
                timeSlotId:     (int) $data['time_slot_id'],
                teacherId:      isset($data['teacher_id']) ? (int) $data['teacher_id'] : null,
                roomId:         isset($data['room_id']) ? (int) $data['room_id'] : null,
                excludeClassId: $classId,
            );
        }

        return DB::transaction(function () use ($classId, $academicYearId, $entries): Collection {
            // Remove existing entries for this class+year
            TimetableEntry::where('class_id', $classId)
                ->where('academic_year_id', $academicYearId)
                ->delete();

            $created = collect();
            foreach ($entries as $data) {
                $data['class_id']          = $classId;
                $data['academic_year_id']  = $academicYearId;
                $created->push(TimetableEntry::create($data));
            }

            return $created;
        });
    }

    // ── Overrides ──────────────────────────────────────────────────────────

    /**
     * @param array<string, mixed> $data
     */
    public function createOverride(TimetableEntry $entry, array $data): TimetableOverride
    {
        return TimetableOverride::updateOrCreate(
            [
                'timetable_entry_id' => $entry->id,
                'date'               => $data['date'],
            ],
            $data + ['timetable_entry_id' => $entry->id],
        );
    }

    public function deleteOverride(TimetableOverride $override): void
    {
        $override->delete();
    }

    // ── Conflict Detection ─────────────────────────────────────────────────

    /**
     * Check for conflicts without throwing — returns conflict details.
     *
     * @return array<string, array<int, mixed>>
     */
    public function checkConflicts(
        int $academicYearId,
        int $timeSlotId,
        ?int $teacherId = null,
        ?int $roomId = null,
        ?int $excludeEntryId = null,
    ): array {
        $conflicts = [];

        if ($teacherId !== null) {
            $teacherConflict = TimetableEntry::where('academic_year_id', $academicYearId)
                ->where('time_slot_id', $timeSlotId)
                ->where('teacher_id', $teacherId)
                ->where('is_active', true)
                ->when($excludeEntryId, fn ($q) => $q->where('id', '!=', $excludeEntryId))
                ->with(['classe', 'subject'])
                ->first();

            if ($teacherConflict) {
                $conflicts['teacher'] = [
                    'entry_id'  => $teacherConflict->id,
                    'class'     => $teacherConflict->classe?->display_name,
                    'subject'   => $teacherConflict->subject?->name,
                    'message'   => "Cet enseignant est déjà assigné à {$teacherConflict->classe?->display_name} sur ce créneau.",
                ];
            }
        }

        if ($roomId !== null) {
            $roomConflict = TimetableEntry::where('academic_year_id', $academicYearId)
                ->where('time_slot_id', $timeSlotId)
                ->where('room_id', $roomId)
                ->where('is_active', true)
                ->when($excludeEntryId, fn ($q) => $q->where('id', '!=', $excludeEntryId))
                ->with(['classe', 'subject'])
                ->first();

            if ($roomConflict) {
                $conflicts['room'] = [
                    'entry_id'  => $roomConflict->id,
                    'class'     => $roomConflict->classe?->display_name,
                    'subject'   => $roomConflict->subject?->name,
                    'message'   => "Cette salle est déjà utilisée par {$roomConflict->classe?->display_name} sur ce créneau.",
                ];
            }
        }

        return $conflicts;
    }

    /**
     * @throws TimetableConflictException
     */
    private function assertNoConflicts(
        int $academicYearId,
        int $timeSlotId,
        ?int $teacherId = null,
        ?int $roomId = null,
        ?int $excludeEntryId = null,
        ?int $excludeClassId = null,
    ): void {
        $query = TimetableEntry::where('academic_year_id', $academicYearId)
            ->where('time_slot_id', $timeSlotId)
            ->where('is_active', true);

        if ($excludeEntryId !== null) {
            $query->where('id', '!=', $excludeEntryId);
        }

        if ($excludeClassId !== null) {
            $query->where('class_id', '!=', $excludeClassId);
        }

        $conflicts = [];

        if ($teacherId !== null) {
            $conflict = (clone $query)
                ->where('teacher_id', $teacherId)
                ->with(['classe', 'subject'])
                ->first();

            if ($conflict) {
                $conflicts['teacher'] = [
                    'entry_id'  => $conflict->id,
                    'class'     => $conflict->classe?->display_name,
                    'subject'   => $conflict->subject?->name,
                    'message'   => "Cet enseignant est déjà assigné à {$conflict->classe?->display_name} sur ce créneau.",
                ];
            }
        }

        if ($roomId !== null) {
            $conflict = (clone $query)
                ->where('room_id', $roomId)
                ->with(['classe', 'subject'])
                ->first();

            if ($conflict) {
                $conflicts['room'] = [
                    'entry_id'  => $conflict->id,
                    'class'     => $conflict->classe?->display_name,
                    'subject'   => $conflict->subject?->name,
                    'message'   => "Cette salle est déjà utilisée par {$conflict->classe?->display_name} sur ce créneau.",
                ];
            }
        }

        if (! empty($conflicts)) {
            throw new TimetableConflictException($conflicts);
        }
    }
}
