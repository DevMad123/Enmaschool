<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\AcademicYearStatus;
use App\Models\Tenant\AcademicYear;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;

class AcademicYearService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = AcademicYear::with('periods')
            ->orderByDesc('start_date');

        if (! empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (! empty($filters['search'])) {
            $query->where('name', 'ilike', "%{$filters['search']}%");
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): AcademicYear
    {
        return DB::transaction(function () use ($data): AcademicYear {
            $year = AcademicYear::create($data);

            // Auto-create periods based on period_type
            $periodNames = $year->period_type->periodNames();

            foreach ($periodNames as $index => $name) {
                $year->periods()->create([
                    'name' => $name,
                    'type' => $year->period_type,
                    'order' => $index + 1,
                    'start_date' => $year->start_date,
                    'end_date' => $year->end_date,
                ]);
            }

            return $year->load('periods');
        });
    }

    public function update(AcademicYear $year, array $data): AcademicYear
    {
        $year->update($data);

        return $year->fresh()->load('periods');
    }

    public function activate(AcademicYear $year): AcademicYear
    {
        if (! $year->canBeActivated()) {
            throw new \LogicException("Cette année scolaire ne peut pas être activée (statut actuel : {$year->status->label()}).");
        }

        return DB::transaction(function () use ($year): AcademicYear {
            // Close the currently active year if any
            AcademicYear::where('status', AcademicYearStatus::Active)
                ->where('id', '!=', $year->id)
                ->update([
                    'status' => AcademicYearStatus::Closed,
                    'is_current' => false,
                    'closed_at' => now(),
                ]);

            $year->update([
                'status' => AcademicYearStatus::Active,
                'is_current' => true,
            ]);

            return $year->fresh()->load('periods');
        });
    }

    public function close(AcademicYear $year): AcademicYear
    {
        $year->update([
            'status' => AcademicYearStatus::Closed,
            'is_current' => false,
            'closed_at' => now(),
        ]);

        return $year->fresh();
    }

    public function delete(AcademicYear $year): void
    {
        if ($year->status !== AcademicYearStatus::Draft) {
            throw new \LogicException('Seule une année scolaire en brouillon peut être supprimée.');
        }

        $year->delete();
    }
}
