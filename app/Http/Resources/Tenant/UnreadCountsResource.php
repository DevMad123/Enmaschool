<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UnreadCountsResource extends JsonResource
{
    // $this->resource is an array with keys: messages, notifications, announcements

    public function toArray(Request $request): array
    {
        return [
            'messages'      => $this->resource['messages'] ?? 0,
            'notifications' => $this->resource['notifications'] ?? 0,
            'announcements' => $this->resource['announcements'] ?? 0,
            'total'         => ($this->resource['messages'] ?? 0)
                + ($this->resource['notifications'] ?? 0)
                + ($this->resource['announcements'] ?? 0),
        ];
    }
}
