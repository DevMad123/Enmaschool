<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class NotificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'         => $this->id,
            'type'       => $this->type,
            'title'      => $this->title,
            'body'       => $this->body,
            'data'       => $this->data,
            'action_url' => $this->action_url,
            'icon'       => $this->icon,
            'color'      => $this->color,
            'is_read'    => $this->is_read,
            'read_at'    => $this->read_at?->toIso8601String(),
            'created_at' => $this->created_at?->toIso8601String(),
        ];
    }
}
