<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ConversationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'                   => $this->id,
            'type'                 => ['value' => $this->type->value, 'label' => $this->type->label()],
            'name'                 => $this->getNameFor($user),
            'avatar'               => $this->avatar,
            'is_archived'          => $this->is_archived,
            'last_message_at'      => $this->last_message_at?->toIso8601String(),
            'last_message_preview' => $this->last_message_preview,
            'unread_count'         => $this->getUnreadCountFor($user),
            'participants_count'   => $this->participants->count(),
            'participants'         => $this->participants->take(5)->map(fn($p) => [
                'id'         => $p->user->id ?? null,
                'full_name'  => $p->user->full_name ?? '',
                'avatar_url' => $p->user->avatar_url ?? null,
                'role'       => ['value' => $p->role, 'label' => $p->role === 'admin' ? 'Admin' : 'Membre'],
            ]),
            'last_message' => $this->whenLoaded('lastMessage', fn() => new MessageResource($this->lastMessage)),
            'created_at'   => $this->created_at?->toIso8601String(),
        ];
    }
}
