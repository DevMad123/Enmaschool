<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\AcademicYearStatus;
use App\Enums\EnrollmentStatus;
use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Student;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class EnrollmentService
{
    public function enroll(array $data): Enrollment
    {
        return DB::transaction(function () use ($data): Enrollment {
            $student     = Student::findOrFail($data['student_id']);
            $classe      = Classe::with('level', 'academicYear')->findOrFail($data['classe_id']);
            $academicYear = AcademicYear::findOrFail($data['academic_year_id']);

            // Vérification 1 : pas déjà inscrit cette année
            $existing = Enrollment::where('student_id', $student->id)
                ->where('academic_year_id', $academicYear->id)
                ->first();

            if ($existing) {
                throw new \RuntimeException('Cet élève est déjà inscrit pour cette année scolaire.');
            }

            // Vérification 2 : classe pas pleine
            $enrolled = Enrollment::where('classe_id', $classe->id)
                ->where('academic_year_id', $academicYear->id)
                ->where('is_active', true)
                ->count();

            if ($enrolled >= $classe->capacity) {
                throw new \RuntimeException(
                    "La classe est complète (capacité maximale de {$classe->capacity} atteinte)."
                );
            }

            // Vérification 3 : année active ou draft
            if ($academicYear->status === AcademicYearStatus::Closed) {
                throw new \RuntimeException("Impossible d'inscrire un élève dans une année scolaire clôturée.");
            }

            // Génération du numéro d'inscription
            $enrollmentNumber = $this->generateEnrollmentNumber($classe, $academicYear->id);

            // Mise à jour du matricule avec la bonne catégorie si encore générique
            $this->updateMatriculeCategory($student, $classe);

            $enrollment = Enrollment::create([
                'student_id'        => $student->id,
                'classe_id'         => $classe->id,
                'academic_year_id'  => $academicYear->id,
                'enrollment_date'   => $data['enrollment_date'],
                'enrollment_number' => $enrollmentNumber,
                'is_active'         => true,
                'status'            => EnrollmentStatus::Enrolled->value,
                'created_by'        => $data['created_by'] ?? null,
            ]);

            return $enrollment->load(['student', 'classe.level', 'academicYear']);
        });
    }

    public function bulkEnroll(int $classeId, array $studentIds, int $yearId, string $enrollmentDate): array
    {
        $enrolled = 0;
        $skipped  = 0;
        $errors   = [];

        foreach ($studentIds as $studentId) {
            try {
                $this->enroll([
                    'student_id'       => $studentId,
                    'classe_id'        => $classeId,
                    'academic_year_id' => $yearId,
                    'enrollment_date'  => $enrollmentDate,
                ]);
                $enrolled++;
            } catch (\RuntimeException $e) {
                $skipped++;
                $errors[] = ['student_id' => $studentId, 'message' => $e->getMessage()];
            }
        }

        return compact('enrolled', 'skipped', 'errors');
    }

    public function transfer(Enrollment $enrollment, int $newClasseId, string $note = ''): Enrollment
    {
        return DB::transaction(function () use ($enrollment, $newClasseId, $note): Enrollment {
            // Clôturer l'ancien enrollment
            $enrollment->update([
                'status'   => EnrollmentStatus::TransferredOut->value,
                'is_active' => false,
            ]);

            $newClasse = Classe::with('level', 'academicYear')->findOrFail($newClasseId);

            // Vérification capacité
            $enrolled = Enrollment::where('classe_id', $newClasseId)
                ->where('academic_year_id', $enrollment->academic_year_id)
                ->where('is_active', true)
                ->count();

            if ($enrolled >= $newClasse->capacity) {
                throw new \RuntimeException("La classe de destination est complète.");
            }

            $enrollmentNumber = $this->generateEnrollmentNumber($newClasse, $enrollment->academic_year_id);

            $newEnrollment = Enrollment::create([
                'student_id'        => $enrollment->student_id,
                'classe_id'         => $newClasseId,
                'academic_year_id'  => $enrollment->academic_year_id,
                'enrollment_date'   => now()->toDateString(),
                'enrollment_number' => $enrollmentNumber,
                'is_active'         => true,
                'status'            => EnrollmentStatus::TransferredIn->value,
                'transfer_note'     => $note,
                'transferred_from'  => $enrollment->classe_id,
            ]);

            return $newEnrollment->load(['student', 'classe.level', 'academicYear', 'transferredFromClasse']);
        });
    }

    public function withdraw(Enrollment $enrollment, string $reason): Enrollment
    {
        $enrollment->update([
            'status'        => EnrollmentStatus::Withdrawn->value,
            'is_active'     => false,
            'transfer_note' => $reason,
        ]);

        return $enrollment->fresh();
    }

    public function getByClasse(int $classeId, int $yearId): Collection
    {
        return Enrollment::with(['student.parents'])
            ->where('classe_id', $classeId)
            ->where('academic_year_id', $yearId)
            ->where('is_active', true)
            ->get()
            ->sortBy(fn ($e) => $e->student?->last_name);
    }

    // ── Helpers privés ─────────────────────────────────────────

    private function generateEnrollmentNumber(Classe $classe, int $yearId): string
    {
        $year  = now()->year;
        $short = $classe->display_name ?? $classe->section;

        // Compte les enrollments existants pour ce numéro de séquence
        $count = Enrollment::where('classe_id', $classe->id)
            ->where('academic_year_id', $yearId)
            ->count();

        $seq = str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);

        return "{$year}-{$short}-{$seq}";
    }

    private function updateMatriculeCategory(Student $student, Classe $classe): void
    {
        // Met à jour le matricule si encore générique (GEN)
        if (! str_contains($student->matricule, 'GEN')) {
            return;
        }

        $category = $classe->level?->category;
        if (! $category) {
            return;
        }

        $catValue = strtolower($category instanceof \BackedEnum ? $category->value : (string) $category);

        $catCode = match (true) {
            str_contains($catValue, 'maternelle') => 'MAT',
            str_contains($catValue, 'primaire')   => 'PRI',
            str_contains($catValue, 'college') || str_contains($catValue, 'collège') => 'COL',
            str_contains($catValue, 'lycee') || str_contains($catValue, 'lycée')     => 'LYC',
            default => 'GEN',
        };

        if ($catCode !== 'GEN') {
            $newMatricule = Student::generateMatricule($catCode);
            $student->update(['matricule' => $newMatricule]);
        }
    }
}
