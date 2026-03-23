<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\StudentStatus;
use App\Models\Tenant\ParentModel;
use App\Models\Tenant\Student;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;

class StudentService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Student::with(['currentEnrollment.classe.level'])
            ->withCount('enrollments');

        if (! empty($filters['search'])) {
            $query->search($filters['search']);
        }

        if (! empty($filters['status'])) {
            $status = StudentStatus::from($filters['status']);
            $query->byStatus($status);
        }

        if (! empty($filters['gender'])) {
            $query->where('gender', $filters['gender']);
        }

        if (! empty($filters['classe_id'])) {
            $query->inClasse((int) $filters['classe_id']);
        }

        if (! empty($filters['academic_year_id'])) {
            $query->inYear((int) $filters['academic_year_id']);
        }

        if (! empty($filters['level_category'])) {
            $query->whereHas('currentEnrollment.classe.level', function ($q) use ($filters): void {
                $q->where('category', $filters['level_category']);
            });
        }

        $perPage = (int) ($filters['per_page'] ?? 25);

        return $query->orderBy('last_name')->orderBy('first_name')->paginate($perPage);
    }

    public function get(int $id): Student
    {
        return Student::with(['enrollments.classe.level', 'parents', 'createdBy'])
            ->findOrFail($id);
    }

    public function create(array $data): Student
    {
        return DB::transaction(function () use ($data): Student {
            $parentsData = $data['parents'] ?? null;
            unset($data['parents']);

            $student = Student::create($data);

            if (! empty($parentsData)) {
                $this->syncParents($student, $parentsData);
            }

            return $student->load(['parents']);
        });
    }

    public function update(Student $student, array $data): Student
    {
        $parentsData = $data['parents'] ?? null;
        unset($data['parents']);

        $student->update($data);

        if ($parentsData !== null) {
            $this->syncParents($student, $parentsData);
        }

        return $student->fresh(['parents', 'currentEnrollment.classe.level']);
    }

    public function updateStatus(Student $student, StudentStatus $newStatus): Student
    {
        $student->update(['status' => $newStatus->value]);

        return $student;
    }

    public function delete(Student $student): void
    {
        $hasActiveEnrollments = $student->enrollments()
            ->where('is_active', true)
            ->exists();

        if ($hasActiveEnrollments) {
            throw new \RuntimeException('Impossible de supprimer un élève avec des inscriptions actives.');
        }

        $student->delete();
    }

    /**
     * Synchronise les parents d'un élève.
     *
     * @param  array<int, array{parent_id?: int, first_name?: string, last_name?: string,
     *                          phone?: string, relationship: string, is_primary_contact: bool,
     *                          can_pickup: bool}>  $parentsData
     */
    public function syncParents(Student $student, array $parentsData): void
    {
        if (\count($parentsData) > 2) {
            throw new \InvalidArgumentException('Un élève ne peut avoir que 2 parents/tuteurs maximum.');
        }

        $primaryCount = \count(array_filter($parentsData, fn ($p) => $p['is_primary_contact'] ?? false));
        if ($primaryCount > 1) {
            throw new \InvalidArgumentException('Un seul parent peut être le contact principal.');
        }

        $syncData    = [];
        $usedIds     = [];
        $parentSvc   = new ParentService();

        foreach ($parentsData as $entry) {
            if (! empty($entry['parent_id'])) {
                $parentId = (int) $entry['parent_id'];
            } else {
                // Créer ou retrouver le parent par téléphone/email
                $parent   = $parentSvc->createOrFind([
                    'first_name'    => $entry['first_name'] ?? '',
                    'last_name'     => $entry['last_name'] ?? '',
                    'phone'         => $entry['phone'] ?? null,
                    'relationship'  => $entry['relationship'] ?? 'other',
                    'gender'        => $entry['gender'] ?? null,
                ]);
                $parentId = $parent->id;
            }

            if (\in_array($parentId, $usedIds, true)) {
                throw new \InvalidArgumentException('Les deux parents ont le même numéro de téléphone. Utilisez des numéros différents pour les distinguer.');
            }

            $usedIds[]           = $parentId;
            $syncData[$parentId] = [
                'is_primary_contact' => (bool) ($entry['is_primary_contact'] ?? false),
                'can_pickup'         => (bool) ($entry['can_pickup'] ?? true),
            ];
        }

        $student->parents()->sync($syncData);
    }

    public function getStats(int $yearId): array
    {
        $enrollments = \App\Models\Tenant\Enrollment::with('student', 'classe.level')
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->get();

        $total  = $enrollments->count();
        $male   = $enrollments->filter(fn ($e) => $e->student?->gender?->value === 'male')->count();
        $female = $enrollments->filter(fn ($e) => $e->student?->gender?->value === 'female')->count();

        $byCategory = $enrollments
            ->groupBy(fn ($e) => $e->classe?->level?->category ?? 'unknown')
            ->map->count()
            ->toArray();

        $byLevel = $enrollments
            ->groupBy(fn ($e) => $e->classe?->level?->label ?? 'unknown')
            ->map->count()
            ->map(fn ($count, $level) => ['level' => $level, 'count' => $count])
            ->values()
            ->toArray();

        $newThisMonth = \App\Models\Tenant\Enrollment::where('academic_year_id', $yearId)
            ->whereMonth('enrollment_date', now()->month)
            ->whereYear('enrollment_date', now()->year)
            ->count();

        return compact('total', 'male', 'female', 'byCategory', 'byLevel', 'newThisMonth');
    }

    public function importFromCsv(UploadedFile $file, int $yearId, int $classeId): array
    {
        // Délégation au Job pour les gros fichiers (> 50 lignes)
        // Implémentation simplifiée pour l'instant
        return [
            'created' => 0,
            'errors'  => [['row' => 0, 'field' => 'file', 'message' => 'Import CSV non encore implémenté — à faire en Phase 4 avancée.']],
        ];
    }

    public function exportToCsv(array $filters): string
    {
        $students = Student::with(['currentEnrollment.classe.level', 'parents'])
            ->when(! empty($filters['search']), fn ($q) => $q->search($filters['search']))
            ->when(! empty($filters['status']), fn ($q) => $q->byStatus(StudentStatus::from($filters['status'])))
            ->orderBy('last_name')
            ->get();

        $path = storage_path('app/exports/students_'.now()->format('Ymd_His').'.csv');
        $dir  = \dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($path, 'w');
        fputcsv($handle, ['Matricule', 'Nom', 'Prénom', 'Date naissance', 'Genre', 'Statut', 'Classe', 'Nationalité']);

        foreach ($students as $student) {
            fputcsv($handle, [
                $student->matricule,
                $student->last_name,
                $student->first_name,
                $student->birth_date?->format('d/m/Y'),
                $student->gender?->label(),
                $student->status?->label(),
                $student->currentEnrollment?->classe?->display_name ?? '',
                $student->nationality,
            ]);
        }

        fclose($handle);

        return $path;
    }
}
