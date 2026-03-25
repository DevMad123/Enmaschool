<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class MessageResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'body'       => $this->display_body,
            'type'       => ['value' => $this->type->value, 'label' => $this->type->label()],
            'is_edited'  => $this->is_edited,
            'is_deleted' => $this->is_deleted,
            'edited_at'  => $this->edited_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
            'attachment' => $this->attachment_path ? [
                'path' => $this->attachment_path,
                'name' => $this->attachment_name,
                'size' => $this->attachment_size,
                'url'  => $this->attachment_url,
            ] : null,
            'reply_to' => $this->when($this->relationLoaded('replyTo') && $this->replyTo, [
                'id'     => $this->replyTo?->id,
                'body'   => $this->replyTo?->display_body,
                'sender' => $this->replyTo?->sender ? [
                    'id'        => $this->replyTo->sender->id,
                    'full_name' => $this->replyTo->sender->full_name,
                ] : null,
            ]),
            'sender' => $this->sender ? [
                'id'         => $this->sender->id,
                'full_name'  => $this->sender->full_name,
                'avatar_url' => $this->sender->avatar_url,
                'role'       => ['value' => $this->sender->role->value, 'label' => $this->sender->role->label()],
            ] : null,
            'is_mine'       => $request->user() && $this->sender_id === $request->user()->id,
            'read_by_count' => $this->reads()->count(),
        ];
    }
}
