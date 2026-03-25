<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\StudentFeeStatus;
use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\FeeSchedule;
use App\Models\Tenant\FeeType;
use App\Models\Tenant\StudentFee;
use App\Models\Tenant\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class FeeService
{
    // ── Configuration des frais ────────────────────────────────────────

    public function getFeeTypes(bool $activeOnly = true): Collection
    {
        $query = FeeType::orderBy('order')->orderBy('name');

        if ($activeOnly) {
            $query->active();
        }

        return $query->withCount('schedules')->get();
    }

    public function createFeeType(array $data): FeeType
    {
        return FeeType::create($data);
    }

    public function updateFeeType(FeeType $type, array $data): FeeType
    {
        $type->update($data);
        return $type->fresh();
    }

    public function getFeeSchedules(int $yearId): Collection
    {
        return FeeSchedule::with(['feeType', 'schoolLevel', 'academicYear'])
            ->where('academic_year_id', $yearId)
            ->get()
            ->groupBy('fee_type_id');
    }

    public function setFeeSchedule(array $data): FeeSchedule
    {
        return FeeSchedule::updateOrCreate(
            [
                'academic_year_id' => $data['academic_year_id'],
                'fee_type_id'      => $data['fee_type_id'],
                'school_level_id'  => $data['school_level_id'] ?? null,
            ],
            $data,
        );
    }

    public function bulkSetSchedules(int $yearId, array $schedules): void
    {
        DB::transaction(function () use ($yearId, $schedules): void {
            foreach ($schedules as $schedule) {
                $schedule['academic_year_id'] = $yearId;
                $this->setFeeSchedule($schedule);
            }
        });
    }

    /**
     * Copie les grilles tarifaires d'une année vers une autre.
     * Retourne le nombre de schedules copiés.
     */
    public function copySchedulesFromYear(int $fromYearId, int $toYearId): int
    {
        $source   = FeeSchedule::where('academic_year_id', $fromYearId)->get();
        $count    = 0;

        DB::transaction(function () use ($source, $toYearId, &$count): void {
            foreach ($source as $schedule) {
                FeeSchedule::updateOrCreate(
                    [
                        'academic_year_id' => $toYearId,
                        'fee_type_id'      => $schedule->fee_type_id,
                        'school_level_id'  => $schedule->school_level_id,
                    ],
                    [
                        'amount'               => $schedule->amount,
                        'installments_allowed' => $schedule->installments_allowed,
                        'max_installments'     => $schedule->max_installments,
                        'due_date'             => null, // date à reconfigurer pour la nouvelle année
                        'notes'                => $schedule->notes,
                    ],
                );
                $count++;
            }
        });

        return $count;
    }

    // ── Frais élève ────────────────────────────────────────────────────

    /**
     * Crée les student_fees pour un élève nouvellement inscrit.
     * Récupère les fee_schedules applicables selon l'année et le niveau.
     */
    public function generateForEnrollment(Enrollment $enrollment): Collection
    {
        // S'assurer que les relations sont chargées
        $enrollment->loadMissing('classe.schoolLevel');

        $yearId    = $enrollment->academic_year_id;
        $level     = $enrollment->classe?->schoolLevel;
        $levelId   = $level?->id;
        $category  = $level?->category ?? null; // ex: 'college', 'primaire'...

        // Récupère les types de frais actifs applicables à ce niveau
        $applicableTypeIds = FeeType::active()
            ->when($category !== null, fn ($q) => $q->forCategory((string) $category))
            ->pluck('id');

        if ($applicableTypeIds->isEmpty()) {
            return collect();
        }

        // Récupère les schedules : priorité au niveau spécifique, sinon tarif par défaut (NULL)
        $schedules = FeeSchedule::where('academic_year_id', $yearId)
            ->whereIn('fee_type_id', $applicableTypeIds)
            ->where(function ($q) use ($levelId): void {
                $q->where('school_level_id', $levelId)
                  ->orWhereNull('school_level_id');
            })
            ->with('feeType')
            ->get();

        // Dédupliquer : pour chaque fee_type, préférer le tarif spécifique au niveau
        $bestSchedules = $schedules
            ->groupBy('fee_type_id')
            ->map(function (Collection $group) use ($levelId) {
                // Si un tarif spécifique au niveau existe, on le prend en priorité
                return $group->firstWhere('school_level_id', $levelId)
                    ?? $group->firstWhere('school_level_id', null);
            })
            ->filter();

        $created = collect();

        DB::transaction(function () use ($enrollment, $yearId, $bestSchedules, &$created): void {
            foreach ($bestSchedules as $schedule) {
                $fee = StudentFee::updateOrCreate(
                    [
                        'enrollment_id' => $enrollment->id,
                        'fee_type_id'   => $schedule->fee_type_id,
                    ],
                    [
                        'fee_schedule_id' => $schedule->id,
                        'academic_year_id' => $yearId,
                        'amount_due'      => $schedule->amount,
                        'due_date'        => $schedule->due_date,
                        'status'          => StudentFeeStatus::Pending->value,
                    ],
                );
                $created->push($fee);
            }
        });

        return $created;
    }

    public function getStudentFees(int $enrollmentId): Collection
    {
        return StudentFee::forEnrollment($enrollmentId)
            ->with(['feeType', 'payments' => fn ($q) => $q->whereNull('cancelled_at'), 'installments'])
            ->get();
    }

    public function getStudentBalance(int $enrollmentId): array
    {
        $fees = $this->getStudentFees($enrollmentId);

        $enrollment = Enrollment::with(['student', 'academicYear'])->findOrFail($enrollmentId);

        $totalDue      = $fees->sum(fn ($f) => (float) $f->amount_due);
        $totalDiscount = $fees->sum(fn ($f) => (float) $f->discount_amount);
        $totalPaid     = $fees->sum(fn ($f) => (float) $f->amount_paid);
        $totalRemaining = max(0, $totalDue - $totalDiscount - $totalPaid);

        return [
            'total_due'       => $totalDue,
            'total_discount'  => $totalDiscount,
            'total_paid'      => $totalPaid,
            'total_remaining' => $totalRemaining,
            'is_fully_paid'   => $totalRemaining <= 0,
            'enrollment'      => $enrollment,
            'fees'            => $fees,
        ];
    }

    public function applyDiscount(StudentFee $fee, float $amount, string $reason, User $by): StudentFee
    {
        $fee->discount_amount = $amount;
        $fee->discount_reason = $reason;
        $fee->save();
        $fee->recalculateBalance();

        return $fee->fresh();
    }

    public function waive(StudentFee $fee, string $reason, User $by): StudentFee
    {
        // L'exonération remet le solde à 0 en appliquant une remise égale au montant restant
        $remaining = (float) ($fee->amount_due - $fee->discount_amount - $fee->amount_paid);
        $fee->status          = StudentFeeStatus::Waived;
        $fee->discount_amount = $fee->discount_amount + max(0, $remaining);
        $fee->discount_reason = $reason;
        $fee->save();

        return $fee->fresh();
    }

    public function createInstallmentPlan(StudentFee $fee, array $installments): Collection
    {
        // Supprime les tranches existantes et recrée
        $fee->installments()->delete();

        $created = collect();

        DB::transaction(function () use ($fee, $installments, &$created): void {
            foreach ($installments as $data) {
                $installment = $fee->installments()->create([
                    'installment_number' => $data['installment_number'],
                    'amount_due'         => $data['amount_due'],
                    'due_date'           => $data['due_date'],
                    'status'             => 'pending',
                ]);
                $created->push($installment);
            }
        });

        return $created;
    }

    // ── Statistiques ───────────────────────────────────────────────────

    public function getYearStats(int $yearId): array
    {
        $fees = StudentFee::forYear($yearId)->get();

        $totalExpected  = $fees->sum(fn ($f) => (float) ($f->amount_due - $f->discount_amount));
        $totalCollected = $fees->sum(fn ($f) => (float) $f->amount_paid);
        $totalRemaining = max(0, $totalExpected - $totalCollected);
        $collectionRate = $totalExpected > 0
            ? round(($totalCollected / $totalExpected) * 100, 1)
            : 0.0;

        $byStatus = $fees->groupBy(fn ($f) => $f->status->value)
            ->map(fn ($g) => $g->count())
            ->all();

        // Stats par type de frais
        $byFeeType = $fees->groupBy('fee_type_id')
            ->map(function (Collection $group): array {
                $expected  = $group->sum(fn ($f) => (float) ($f->amount_due - $f->discount_amount));
                $collected = $group->sum(fn ($f) => (float) $f->amount_paid);
                $first     = $group->first();

                return [
                    'fee_type_name' => $first->feeType?->name ?? '—',
                    'expected'      => $expected,
                    'collected'     => $collected,
                    'rate'          => $expected > 0 ? round(($collected / $expected) * 100, 1) : 0.0,
                ];
            })
            ->values()
            ->all();

        return [
            'total_expected'            => $totalExpected,
            'total_collected'           => $totalCollected,
            'total_remaining'           => $totalRemaining,
            'collection_rate'           => $collectionRate,
            'total_expected_formatted'  => number_format($totalExpected, 0, ',', ' ') . ' FCFA',
            'total_collected_formatted' => number_format($totalCollected, 0, ',', ' ') . ' FCFA',
            'by_status'                 => $byStatus,
            'by_fee_type'               => $byFeeType,
            'by_level'                  => [],   // calculé via requête dédiée si besoin
        ];
    }

    public function getOverdueStudents(int $yearId): Collection
    {
        return StudentFee::forYear($yearId)
            ->overdue()
            ->with(['enrollment.student', 'enrollment.classe', 'feeType'])
            ->get()
            ->sortByDesc(fn ($f) => $f->amount_remaining);
    }

    public function getClassPaymentSummary(int $classeId, int $yearId): array
    {
        $fees = StudentFee::forYear($yearId)
            ->whereHas('enrollment', fn ($q) => $q->where('classe_id', $classeId))
            ->with(['enrollment.student'])
            ->get();

        $enrollmentIds = $fees->pluck('enrollment_id')->unique();
        $totalStudents = $enrollmentIds->count();

        $byEnrollment = $fees->groupBy('enrollment_id');

        $fullyPaid = 0;
        $partial   = 0;
        $pending   = 0;
        $overdue   = 0;

        foreach ($byEnrollment as $enrollFees) {
            $allPaid = $enrollFees->every(fn ($f) => $f->status->isSettled());
            $anyOverdue = $enrollFees->contains(fn ($f) => $f->status->value === 'overdue');
            $anyPartial = $enrollFees->contains(fn ($f) => $f->status->value === 'partial');

            if ($allPaid) {
                $fullyPaid++;
            } elseif ($anyOverdue) {
                $overdue++;
            } elseif ($anyPartial) {
                $partial++;
            } else {
                $pending++;
            }
        }

        $totalExpected  = $fees->sum(fn ($f) => (float) ($f->amount_due - $f->discount_amount));
        $totalCollected = $fees->sum(fn ($f) => (float) $f->amount_paid);

        return [
            'total_students'            => $totalStudents,
            'fully_paid'                => $fullyPaid,
            'partial'                   => $partial,
            'pending'                   => $pending,
            'overdue'                   => $overdue,
            'total_expected'            => $totalExpected,
            'total_collected'           => $totalCollected,
            'collection_rate'           => $totalExpected > 0
                ? round(($totalCollected / $totalExpected) * 100, 1)
                : 0.0,
            'total_expected_formatted'  => number_format($totalExpected, 0, ',', ' ') . ' FCFA',
            'total_collected_formatted' => number_format($totalCollected, 0, ',', ' ') . ' FCFA',
        ];
    }
}
