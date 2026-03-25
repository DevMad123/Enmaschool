<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreAnnouncementRequest;
use App\Http\Resources\Tenant\AnnouncementResource;
use App\Models\Tenant\Announcement;
use App\Services\Tenant\AnnouncementService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AnnouncementController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AnnouncementService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['type', 'priority', 'is_read', 'per_page']);

        if (isset($filters['is_read'])) {
            $filters['is_read'] = filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN);
        }

        $announcements = $this->service->list($request->user(), $filters);

        return $this->successResponse(AnnouncementResource::collection($announcements)->response()->getData(true));
    }

    public function store(StoreAnnouncementRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment');
        }

        $announcement = $this->service->create($data, $request->user());

        return $this->successResponse(
            AnnouncementResource::make($announcement->load('createdBy')),
            'Annonce créée.',
            201
        );
    }

    public function show(Request $request, Announcement $announcement): JsonResponse
    {
        $this->service->markRead($announcement, $request->user());

        return $this->successResponse(AnnouncementResource::make($announcement->load('createdBy')));
    }

    public function update(Request $request, Announcement $announcement): JsonResponse
    {
        if (
            $announcement->is_published
            && $announcement->published_at
            && $announcement->published_at->diffInMinutes(now()) > 5
        ) {
            return $this->errorResponse('Impossible de modifier une annonce publiée depuis plus de 5 minutes.', 403);
        }

        $announcement = $this->service->update($announcement, $request->only(['title', 'body', 'expires_at']));

        return $this->successResponse(AnnouncementResource::make($announcement));
    }

    public function publish(Request $request, Announcement $announcement): JsonResponse
    {
        $announcement = $this->service->publish($announcement);

        return $this->successResponse(AnnouncementResource::make($announcement), 'Annonce publiée.');
    }

    public function destroy(Announcement $announcement): JsonResponse
    {
        $this->service->delete($announcement);

        return $this->successResponse(null, 'Annonce supprimée.');
    }

    public function markRead(Request $request, Announcement $announcement): JsonResponse
    {
        $this->service->markRead($announcement, $request->user());

        return $this->successResponse(null, 'Annonce marquée comme lue.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->service->markAllRead($request->user());

        return $this->successResponse(['marked' => $count]);
    }
}
