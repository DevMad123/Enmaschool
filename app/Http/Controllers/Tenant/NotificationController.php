<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\NotificationResource;
use App\Models\Tenant\Notification;
use App\Services\Tenant\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly NotificationService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters = $request->only(['is_read', 'type', 'per_page']);

        if (isset($filters['is_read'])) {
            $filters['is_read'] = filter_var($filters['is_read'], FILTER_VALIDATE_BOOLEAN);
        }

        $notifications = $this->service->getForUser($request->user(), $filters);

        return $this->successResponse(NotificationResource::collection($notifications)->response()->getData(true));
    }

    public function markRead(Request $request, string $notification): JsonResponse
    {
        $notif = Notification::findOrFail($notification);
        $this->service->markRead($notif, $request->user());

        return $this->successResponse(null, 'Notification marquée comme lue.');
    }

    public function markAllRead(Request $request): JsonResponse
    {
        $count = $this->service->markAllRead($request->user());

        return $this->successResponse(['marked' => $count]);
    }

    public function destroy(Request $request, string $notification): JsonResponse
    {
        $notif = Notification::findOrFail($notification);

        if ($notif->user_id !== $request->user()->id) {
            abort(403);
        }

        $notif->delete();

        return $this->successResponse(null, 'Notification supprimée.');
    }
}
