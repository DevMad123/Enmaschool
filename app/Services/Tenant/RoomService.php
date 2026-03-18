<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Models\Tenant\Room;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class RoomService
{
    public function list(array $filters = []): LengthAwarePaginator
    {
        $query = Room::query()->orderBy('name');

        if (! empty($filters['search'])) {
            $query->where(function ($q) use ($filters): void {
                $q->where('name', 'ilike', "%{$filters['search']}%")
                    ->orWhere('code', 'ilike', "%{$filters['search']}%");
            });
        }

        if (! empty($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['is_active'])) {
            $query->where('is_active', filter_var($filters['is_active'], FILTER_VALIDATE_BOOLEAN));
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data): Room
    {
        return Room::create($data);
    }

    public function update(Room $room, array $data): Room
    {
        $room->update($data);

        return $room->fresh();
    }

    public function delete(Room $room): void
    {
        $room->delete();
    }
}
