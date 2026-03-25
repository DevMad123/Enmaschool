<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Tenant\Notification;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class NotificationReceived implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public readonly Notification $notification,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('user.' . $this->notification->user_id . '.notifications');
    }

    public function broadcastWith(): array
    {
        return [
            'id'         => $this->notification->id,
            'type'       => $this->notification->type,
            'title'      => $this->notification->title,
            'body'       => $this->notification->body,
            'action_url' => $this->notification->action_url,
            'icon'       => $this->notification->icon,
            'color'      => $this->notification->color,
            'is_read'    => false,
            'created_at' => $this->notification->created_at?->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'NotificationReceived';
    }
}
