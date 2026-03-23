<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\ContractType;
use App\Models\Tenant\Teacher;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class TeacherService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Teacher::with(['user', 'subjects'])
            ->join('users', 'users.id', '=', 'teachers.user_id')
            ->select('teachers.*')
            ->withCount(['assignments as active_assignments_count' => fn ($q) => $q->where('is_active', true)])
            ->withSum(['assignments as weekly_hours_sum' => fn ($q) => $q->where('is_active', true)], 'hours_per_week');

        if (! empty($filters['search'])) {
            $term = $filters['search'];
            $query->whereHas('user', function ($q) use ($term): void {
                $q->where('first_name', 'ILIKE', "%{$term}%")
                  ->orWhere('last_name', 'ILIKE', "%{$term}%")
                  ->orWhere('email', 'ILIKE', "%{$term}%");
            })->orWhere('employee_number', 'ILIKE', "%{$term}%");
        }

        if (! empty($filters['subject_id'])) {
            $query->bySubject((int) $filters['subject_id']);
        }

        if (isset($filters['contract_type']) && $filters['contract_type'] !== '') {
            $query->where('contract_type', ContractType::from($filters['contract_type']));
        }

        if (isset($filters['is_active']) && $filters['is_active'] !== '') {
            $isActive = filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
            if ($isActive !== null) {
                $query->where('is_active', $isActive);
            }
        }

        if (! empty($filters['academic_year_id'])) {
            $yearId = (int) $filters['academic_year_id'];
            $query->withCount([
                'assignments as year_assignments_count' => fn ($q) => $q->where('academic_year_id', $yearId)->where('is_active', true),
            ]);
        }

        $perPage = (int) ($filters['per_page'] ?? 25);

        $query->orderBy('users.last_name')
              ->orderBy('users.first_name');

        return $query->paginate($perPage);
    }

    public function get(int $id): Teacher
    {
        return Teacher::with([
            'user',
            'subjects',
            'assignments.classe.level',
            'assignments.subject',
            'assignments.academicYear',
        ])->findOrFail($id);
    }

    public function create(array $data): Teacher
    {
        return DB::transaction(function () use ($data): Teacher {
            $subjectIds = $data['subject_ids'] ?? [];
            $primarySubjectId = $data['primary_subject_id'] ?? null;

            unset($data['subject_ids'], $data['primary_subject_id']);

            // L'UserObserver crée automatiquement un profil Teacher minimal lors
            // de la création d'un User avec role=teacher. On fait un updateOrCreate
            // pour mettre à jour ce profil avec les données complètes du formulaire.
            $userId = $data['user_id'];
            $teacher = Teacher::updateOrCreate(
                ['user_id' => $userId],
                $data,
            );

            if (! empty($subjectIds)) {
                $this->syncSubjects($teacher, $subjectIds, $primarySubjectId);
            }

            return $teacher->load('user', 'subjects');
        });
    }

    public function update(Teacher $teacher, array $data): Teacher
    {
        $subjectIds = $data['subject_ids'] ?? null;
        $primarySubjectId = $data['primary_subject_id'] ?? null;

        unset($data['subject_ids'], $data['primary_subject_id']);

        $teacher->update($data);

        if ($subjectIds !== null) {
            $this->syncSubjects($teacher, $subjectIds, $primarySubjectId);
        }

        return $teacher->fresh(['user', 'subjects']);
    }

    public function syncSubjects(Teacher $teacher, array $subjectIds, ?int $primarySubjectId = null): void
    {
        // Prépare le tableau de pivot
        $sync = [];
        foreach ($subjectIds as $subjectId) {
            $sync[$subjectId] = ['is_primary' => ($primarySubjectId && (int) $subjectId === $primarySubjectId)];
        }

        $teacher->subjects()->sync($sync);
    }

    public function getWorkload(Teacher $teacher, int $yearId): array
    {
        $assignments = $teacher->assignments()
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->with(['classe', 'subject'])
            ->get();

        $totalHours = (float) $assignments->sum('hours_per_week');
        $maxHours   = (float) $teacher->weekly_hours_max;

        return [
            'total_hours'     => $totalHours,
            'max_hours'       => $maxHours,
            'remaining_hours' => max(0.0, $maxHours - $totalHours),
            'is_overloaded'   => $totalHours > $maxHours,
            'assignments'     => $assignments->map(fn ($a) => [
                'classe'         => $a->classe?->display_name,
                'subject'        => $a->subject?->name,
                'hours'          => (float) $a->hours_per_week,
                'level_category' => $a->classe?->level?->category?->value,
            ])->values()->all(),
        ];
    }

    public function getStats(int $yearId): array
    {
        $activeTeachers = Teacher::where('is_active', true)->count();

        $contractBreakdown = Teacher::where('is_active', true)
            ->select('contract_type', DB::raw('count(*) as count'))
            ->groupBy('contract_type')
            ->get()
            ->mapWithKeys(fn ($row) => [
                // contract_type est déjà casté en ContractType par le modèle
                ($row->contract_type instanceof ContractType
                    ? $row->contract_type->label()
                    : ContractType::from((string) $row->contract_type)->label()
                ) => (int) $row->count,
            ])
            ->all();

        $withoutAssignment = Teacher::where('is_active', true)
            ->whereDoesntHave('assignments', fn ($q) => $q->where('academic_year_id', $yearId)->where('is_active', true))
            ->count();

        $overloaded = Teacher::where('is_active', true)
            ->withSum(
                ['assignments as total_hours' => fn ($q) => $q->where('academic_year_id', $yearId)->where('is_active', true)],
                'hours_per_week'
            )
            ->get()
            ->filter(fn ($t) => (float) ($t->total_hours ?? 0) > $t->weekly_hours_max)
            ->count();

        return [
            'total_active'        => $activeTeachers,
            'contract_breakdown'  => $contractBreakdown,
            'without_assignment'  => $withoutAssignment,
            'overloaded'          => $overloaded,
        ];
    }

    public function delete(Teacher $teacher): void
    {
        // Vérifie les affectations actives
        $activeAssignments = $teacher->assignments()->where('is_active', true)->count();

        if ($activeAssignments > 0) {
            throw new \RuntimeException(
                "Impossible de supprimer un enseignant avec {$activeAssignments} affectation(s) active(s)."
            );
        }

        $teacher->update(['is_active' => false]);
        $teacher->user?->delete(); // Soft delete du user associé
    }

}
