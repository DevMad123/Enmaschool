<?php
// ===== app/Http/Resources/Central/SupportTicketResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Central;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use App\Models\Central\SupportTicket;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin SupportTicket */
class SupportTicketResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var SupportTicket $this */
        $status   = $this->status instanceof TicketStatus
            ? $this->status
            : TicketStatus::tryFrom((string) $this->status);

        $priority = $this->priority instanceof TicketPriority
            ? $this->priority
            : TicketPriority::tryFrom((string) $this->priority);

        return [
            'id'                   => $this->id,
            'tenant_name'          => $this->tenant_name,
            'submitted_by_name'    => $this->submitted_by_name,
            'submitted_by_email'   => $this->submitted_by_email,
            'subject'              => $this->subject,
            'description'          => $this->description,
            'status'               => $status?->value,
            'status_label'         => $status?->label(),
            'status_color'         => $status?->color(),
            'priority'             => $priority?->value,
            'priority_label'       => $priority?->label(),
            'priority_color'       => $priority?->color(),

            'assigned_to' => $this->whenLoaded('assignee', function () {
                if ($this->assignee === null) {
                    return null;
                }
                return [
                    'id'   => $this->assignee->id,
                    'name' => $this->assignee->name,
                ];
            }),

            'replies_count' => $this->whenCounted('replies', fn () => $this->replies_count),
            'resolved_at'   => $this->resolved_at?->toIso8601String(),
            'created_at'    => $this->created_at?->toIso8601String(),
        ];
    }
}
