<?php
// ===== app/Models/Central/SupportTicket.php =====

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\TicketPriority;
use App\Enums\TicketStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class SupportTicket extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'tenant_id',
        'tenant_name',
        'submitted_by_name',
        'submitted_by_email',
        'subject',
        'description',
        'status',
        'priority',
        'assigned_to',
        'resolved_at',
        'closed_at',
    ];

    protected function casts(): array
    {
        return [
            'status'      => TicketStatus::class,
            'priority'    => TicketPriority::class,
            'resolved_at' => 'datetime',
            'closed_at'   => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function assignee(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'assigned_to');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(TicketReply::class, 'ticket_id');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeOpen(Builder $query): Builder
    {
        return $query->whereIn('status', [
            TicketStatus::Open->value,
            TicketStatus::InProgress->value,
        ]);
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->where('priority', TicketPriority::Urgent->value);
    }

    public function scopeAssignedTo(Builder $query, int $superAdminId): Builder
    {
        return $query->where('assigned_to', $superAdminId);
    }
}
