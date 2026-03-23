<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Classe;
use App\Models\Tenant\ClassSubject;
use App\Models\Tenant\Teacher;
use App\Models\Tenant\TeacherClass;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;

class AssignmentService
{
    /**
     * Affectations d'une classe, avec détection des matières sans enseignant.
     */
    public function listByClasse(int $classeId, int $yearId): array
    {
        $assignments = TeacherClass::where('class_id', $classeId)
            ->where('academic_year_id', $yearId)
            ->with(['teacher.user', 'subject'])
            ->orderBy('is_active', 'desc')
            ->get();

        $unassigned = $this->getUnassignedSubjects($classeId, $yearId);

        return [
            'assignments'         => $assignments,
            'unassigned_subjects' => $unassigned,
        ];
    }

    /**
     * Toutes les affectations d'un enseignant pour une année, avec charge totale.
     */
    public function listByTeacher(int $teacherId, int $yearId): array
    {
        $assignments = TeacherClass::where('teacher_id', $teacherId)
            ->where('academic_year_id', $yearId)
            ->with(['classe.level', 'subject'])
            ->orderBy('is_active', 'desc')
            ->get();

        $totalHours = $assignments->where('is_active', true)->sum('hours_per_week');

        return [
            'assignments' => $assignments,
            'total_hours' => (float) $totalHours,
        ];
    }

    /**
     * Affecte un enseignant à une classe+matière.
     *
     * @return array{assignment: TeacherClass, warning: string|null}
     * @throws \RuntimeException si l'enseignant est inactif ou si une affectation active existe déjà
     */
    public function assign(array $data): array
    {
        $teacher    = Teacher::with('subjects')->findOrFail($data['teacher_id']);
        $classeId   = (int) $data['class_id'];
        $subjectId  = (int) $data['subject_id'];
        $yearId     = (int) $data['academic_year_id'];
        $hoursPerWeek = isset($data['hours_per_week']) ? (float) $data['hours_per_week'] : null;

        // 1. L'enseignant doit être actif
        if (! $teacher->is_active) {
            throw new \RuntimeException("L'enseignant est inactif et ne peut pas être affecté.");
        }

        // 2. Vérifier si la matière est dans les compétences (warning, pas blocage)
        $warning = null;
        $hasSubjectQualification = $teacher->subjects->contains('id', $subjectId);
        if (! $hasSubjectQualification) {
            $subject = \App\Models\Tenant\Subject::find($subjectId);
            $warning = "L'enseignant n'est pas qualifié pour la matière \"{$subject?->name}\". L'affectation a quand même été créée.";
        }

        // 3. Vérifier l'unicité (une matière active = un seul enseignant par classe par an)
        $existing = TeacherClass::where('class_id', $classeId)
            ->where('subject_id', $subjectId)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->first();

        if ($existing) {
            throw new \RuntimeException(
                "Cette matière a déjà un enseignant actif dans cette classe pour cette année scolaire."
            );
        }

        // 4. Vérification de la charge horaire (warning, pas blocage)
        if ($hoursPerWeek !== null) {
            $currentHours = (float) TeacherClass::where('teacher_id', $teacher->id)
                ->where('academic_year_id', $yearId)
                ->where('is_active', true)
                ->sum('hours_per_week');

            $newTotal = $currentHours + $hoursPerWeek;
            if ($newTotal > $teacher->weekly_hours_max) {
                $overloadWarning = "L'enseignant dépasse sa charge maximale ({$newTotal}h/{$teacher->weekly_hours_max}h max).";
                $warning = $warning ? $warning.' '.$overloadWarning : $overloadWarning;
            }
        }

        // Créer l'affectation
        $assignment = TeacherClass::create([
            'teacher_id'       => $teacher->id,
            'class_id'         => $classeId,
            'subject_id'       => $subjectId,
            'academic_year_id' => $yearId,
            'hours_per_week'   => $hoursPerWeek,
            'is_active'        => true,
            'assigned_at'      => $data['assigned_at'] ?? now()->toDateString(),
            'assigned_by'      => $data['assigned_by'] ?? null,
            'notes'            => $data['notes'] ?? null,
        ]);

        $this->invalidateTeacherCache($teacher->id);

        return [
            'assignment' => $assignment->load(['teacher.user', 'classe', 'subject', 'academicYear']),
            'warning'    => $warning,
        ];
    }

    /**
     * Met à jour les champs modifiables d'une affectation (heures, notes, date).
     */
    public function update(TeacherClass $assignment, array $data): TeacherClass
    {
        $fields = array_intersect_key($data, array_flip(['hours_per_week', 'notes', 'assigned_at']));
        $assignment->update($fields);
        $this->invalidateTeacherCache($assignment->teacher_id);

        return $assignment->fresh(['teacher.user', 'classe', 'subject', 'academicYear']);
    }

    /**
     * Désactive une affectation (is_active = false).
     */
    public function unassign(TeacherClass $assignment): TeacherClass
    {
        $assignment->update(['is_active' => false]);
        $this->invalidateTeacherCache($assignment->teacher_id);

        return $assignment;
    }

    /**
     * Remplace l'enseignant d'une affectation existante.
     *
     * @return array{assignment: TeacherClass, warning: string|null}
     */
    public function reassign(TeacherClass $oldAssignment, int $newTeacherId): array
    {
        return DB::transaction(function () use ($oldAssignment, $newTeacherId): array {
            $this->unassign($oldAssignment);

            return $this->assign([
                'teacher_id'       => $newTeacherId,
                'class_id'         => $oldAssignment->class_id,
                'subject_id'       => $oldAssignment->subject_id,
                'academic_year_id' => $oldAssignment->academic_year_id,
                'hours_per_week'   => $oldAssignment->hours_per_week,
                'assigned_by'      => $oldAssignment->assigned_by,
            ]);
        });
    }

    /**
     * Assigne plusieurs classes/matières à un enseignant en une seule requête.
     *
     * @param array<int, array{class_id: int, subject_id: int, hours_per_week?: float|null}> $assignments
     * @return array{assigned: int, skipped: int, warnings: string[]}
     */
    public function bulkAssign(int $teacherId, array $assignments, int $yearId): array
    {
        $assigned = 0;
        $skipped  = 0;
        $warnings = [];

        foreach ($assignments as $item) {
            try {
                $result = $this->assign([
                    'teacher_id'       => $teacherId,
                    'class_id'         => $item['class_id'],
                    'subject_id'       => $item['subject_id'],
                    'academic_year_id' => $yearId,
                    'hours_per_week'   => $item['hours_per_week'] ?? null,
                ]);

                $assigned++;

                if ($result['warning']) {
                    $warnings[] = $result['warning'];
                }
            } catch (\RuntimeException $e) {
                $skipped++;
                $warnings[] = $e->getMessage();
            }
        }

        return compact('assigned', 'skipped', 'warnings');
    }

    /**
     * Définit l'enseignant principal d'une classe.
     */
    public function setMainTeacher(int $classeId, int $teacherId): Classe
    {
        // Vérifie que l'enseignant a au moins une affectation dans cette classe
        $hasAssignment = TeacherClass::where('teacher_id', $teacherId)
            ->where('class_id', $classeId)
            ->where('is_active', true)
            ->exists();

        if (! $hasAssignment) {
            throw new \RuntimeException(
                "L'enseignant doit avoir au moins une affectation active dans cette classe."
            );
        }

        $classe = Classe::findOrFail($classeId);

        // Récupérer le user_id depuis le teacher
        $teacher = Teacher::findOrFail($teacherId);
        $classe->update(['main_teacher_id' => $teacher->user_id]);

        return $classe->fresh();
    }

    /**
     * Retourne les matières de class_subjects sans affectation enseignant active.
     */
    public function getUnassignedSubjects(int $classeId, int $yearId): Collection
    {
        $assignedSubjectIds = TeacherClass::where('class_id', $classeId)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->pluck('subject_id');

        return ClassSubject::where('class_id', $classeId)
            ->where('is_active', true)
            ->whereNotIn('subject_id', $assignedSubjectIds)
            ->with('subject')
            ->get();
    }

    // ── Helpers ────────────────────────────────────────────────

    private function invalidateTeacherCache(int $teacherId): void
    {
        Cache::forget("teacher_{$teacherId}_weekly_hours");
    }
}
