<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreRoomRequest;
use App\Http\Requests\Tenant\UpdateRoomRequest;
use App\Http\Resources\Tenant\RoomResource;
use App\Models\Tenant\Room;
use App\Services\Tenant\RoomService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RoomController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly RoomService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $rooms = $this->service->list($request->all());

        return $this->paginated(
            $rooms->through(fn ($r) => new RoomResource($r)),
        );
    }

    public function store(StoreRoomRequest $request): JsonResponse
    {
        $room = $this->service->create($request->validated());

        return $this->success(
            data: new RoomResource($room),
            message: 'Salle créée.',
            code: 201,
        );
    }

    public function show(Room $room): JsonResponse
    {
        return $this->success(data: new RoomResource($room));
    }

    public function update(UpdateRoomRequest $request, Room $room): JsonResponse
    {
        $room = $this->service->update($room, $request->validated());

        return $this->success(
            data: new RoomResource($room),
            message: 'Salle mise à jour.',
        );
    }

    public function destroy(Room $room): JsonResponse
    {
        $this->service->delete($room);

        return $this->success(message: 'Salle supprimée.');
    }
}
