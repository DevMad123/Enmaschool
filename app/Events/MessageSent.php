<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Tenant\Conversation;
use App\Models\Tenant\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MessageSent implements ShouldBroadcast
{
    use SerializesModels;

    public function __construct(
        public readonly Message $message,
        public readonly Conversation $conversation,
    ) {}

    public function broadcastOn(): PrivateChannel
    {
        return new PrivateChannel('conversation.' . $this->conversation->id);
    }

    public function broadcastWith(): array
    {
        return [
            'id'              => $this->message->id,
            'conversation_id' => $this->conversation->id,
            'body'            => $this->message->display_body,
            'type'            => [
                'value' => $this->message->type->value,
                'label' => $this->message->type->label(),
            ],
            'sender_id'  => $this->message->sender_id,
            'created_at' => $this->message->created_at?->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageSent';
    }
}
