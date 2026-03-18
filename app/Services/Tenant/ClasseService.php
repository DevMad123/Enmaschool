<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\LyceeSerie;
use App\Models\Tenant\Classe;
use App\Models\Tenant\SchoolLevel;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class ClasseService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Classe::with(['level', 'mainTeacher', 'room'])
            ->withCount('subjects');

        if (! empty($filters['academic_year_id'])) {
            $query->forYear((int) $filters['academic_year_id']);
        }

        if (! empty($filters['school_level_id'])) {
            $query->where('school_level_id', $filters['school_level_id']);
        }

        if (! empty($filters['category'])) {
            $query->whereHas('level', function ($q) use ($filters): void {
                $q->where('category', $filters['category']);
            });
        }

        if (! empty($filters['search'])) {
            $query->where('display_name', 'ilike', "%{$filters['search']}%");
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->orderBy('display_name')->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Classe
    {
        $level = SchoolLevel::findOrFail($data['school_level_id']);

        $this->validateSerieConsistency($level, $data['serie'] ?? null);

        if (! $level->requires_serie) {
            $data['serie'] = null;
        }

        return Classe::create($data)->load(['level', 'mainTeacher', 'room']);
    }

    public function bulkCreate(array $data): Collection
    {
        $level = SchoolLevel::findOrFail($data['school_level_id']);
        $serie = $data['serie'] ?? null;

        $this->validateSerieConsistency($level, $serie);

        if (! $level->requires_serie) {
            $serie = null;
        }

        return DB::transaction(function () use ($data, $level, $serie): Collection {
            $classes = collect();

            foreach ($data['sections'] as $section) {
                $classe = new Classe([
                    'academic_year_id' => $data['academic_year_id'],
                    'school_level_id' => $data['school_level_id'],
                    'serie' => $serie,
                    'section' => $section,
                    'capacity' => $data['capacity'] ?? 40,
                ]);
                $classe->setRelation('level', $level);
                $classe->save();
                $classes->push($classe);
            }

            return $classes->load(['level', 'mainTeacher', 'room']);
        });
    }

    public function update(Classe $classe, array $data): Classe
    {
        $levelId = $data['school_level_id'] ?? $classe->school_level_id;
        $level = SchoolLevel::findOrFail($levelId);

        $this->validateSerieConsistency($level, $data['serie'] ?? null);

        if (! $level->requires_serie) {
            $data['serie'] = null;
        }

        $classe->update($data);

        return $classe->fresh()->load(['level', 'mainTeacher', 'room']);
    }

    public function delete(Classe $classe): void
    {
        // Phase 4: vérifier qu'il n'y a pas d'élèves inscrits
        $classe->delete();
    }

    public function syncSubjects(Classe $classe, array $subjectIds): void
    {
        $classe->subjects()->sync($subjectIds);
    }

    /**
     * @return string[]
     */
    public function generateSectionOptions(): array
    {
        return ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'A', 'B', 'C', 'D', 'E', 'F'];
    }

    /**
     * @return array<int, array{value: string, label: string}>
     */
    public function generateSerieOptions(): array
    {
        return array_map(
            fn (LyceeSerie $serie) => [
                'value' => $serie->value,
                'label' => $serie->label(),
            ],
            LyceeSerie::cases()
        );
    }

    // ── Private ────────────────────────────────────────────────

    private function validateSerieConsistency(SchoolLevel $level, ?string $serie): void
    {
        if ($level->requires_serie && empty($serie)) {
            throw new \InvalidArgumentException(
                "La série est obligatoire pour le niveau {$level->label} ({$level->short_label})."
            );
        }
    }
}
