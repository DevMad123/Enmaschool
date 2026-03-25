<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Tenant\Announcement;
use Illuminate\Broadcasting\Channel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class AnnouncementPublished implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public readonly Announcement $announcement,
    ) {}

    public function broadcastOn(): Channel
    {
        return new Channel('announcements.' . tenant()->getTenantKey());
    }

    public function broadcastWith(): array
    {
        return [
            'id'    => $this->announcement->id,
            'title' => $this->announcement->title,
            'type'  => [
                'value' => $this->announcement->type->value,
                'label' => $this->announcement->type->label(),
            ],
            'priority' => [
                'value' => $this->announcement->priority->value,
                'label' => $this->announcement->priority->label(),
            ],
            'created_at' => $this->announcement->created_at?->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'AnnouncementPublished';
    }
}
