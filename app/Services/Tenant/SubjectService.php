<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Subject;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class SubjectService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Subject::query()->orderBy('name');

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters): void {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                    ->orWhere('code', 'ilike', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['category'])) {
            $query->where('category', $filters['category']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Subject
    {
        return Subject::create($data);
    }

    public function update(Subject $subject, array $data): Subject
    {
        $subject->update($data);

        return $subject->fresh();
    }

    public function delete(Subject $subject): void
    {
        $subject->delete();
    }
}
