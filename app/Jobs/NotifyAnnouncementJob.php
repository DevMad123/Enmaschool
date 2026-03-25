<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\NotificationType;
use App\Events\AnnouncementPublished;
use App\Models\Tenant\Announcement;
use App\Models\Tenant\User;
use App\Services\Tenant\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class NotifyAnnouncementJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'notifications';

    public function __construct(public readonly int $announcementId) {}

    public function handle(NotificationService $notificationService): void
    {
        $announcement = Announcement::find($this->announcementId);

        if (!$announcement) {
            return;
        }

        $roles = $announcement->target_roles ?? [];
        $query = User::active();

        if (!in_array('all', $roles, true)) {
            $query->whereIn('role', $roles);
        }

        $userIds = $query->pluck('id')->toArray();

        $notificationService->notifyMany($userIds, NotificationType::ANNOUNCEMENT_PUBLISHED, [
            'title'           => $announcement->title,
            'announcement_id' => $announcement->id,
        ]);

        broadcast(new AnnouncementPublished($announcement));
    }
}
