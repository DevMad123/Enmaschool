<?php

declare(strict_types=1);

namespace App\Events;

use App\Models\Tenant\Conversation;
use App\Models\Tenant\Message;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Queue\SerializesModels;

class MessageEdited implements ShouldBroadcast
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
            'is_edited'       => true,
            'edited_at'       => $this->message->edited_at?->toIso8601String(),
        ];
    }

    public function broadcastAs(): string
    {
        return 'MessageEdited';
    }
}
