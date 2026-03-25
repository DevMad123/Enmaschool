<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

class AnnouncementResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $user = $request->user();

        return [
            'id'       => $this->id,
            'title'    => $this->title,
            'body'     => $this->body,
            'type'     => [
                'value' => $this->type->value,
                'label' => $this->type->label(),
                'icon'  => $this->type->icon(),
                'color' => $this->type->color(),
            ],
            'priority' => [
                'value' => $this->priority->value,
                'label' => $this->priority->label(),
                'color' => $this->priority->color(),
            ],
            'target_roles'   => $this->target_roles,
            'is_published'   => $this->is_published,
            'is_expired'     => $this->isExpired(),
            'is_scheduled'   => $this->isScheduled(),
            'publish_at'     => $this->publish_at?->toIso8601String(),
            'expires_at'     => $this->expires_at?->toIso8601String(),
            'published_at'   => $this->published_at?->toIso8601String(),
            'attachment_url' => $this->attachment_path
                ? Storage::disk('public')->url($this->attachment_path)
                : null,
            'is_read'    => $user ? $this->isReadBy($user) : false,
            'read_count' => $this->read_count,
            'created_by' => $this->whenLoaded('createdBy', fn() => [
                'id'        => $this->createdBy->id,
                'full_name' => $this->createdBy->full_name,
            ]),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
