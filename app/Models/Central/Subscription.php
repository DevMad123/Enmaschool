<?php
// ===== app/Models/Central/Subscription.php =====

declare(strict_types=1);

namespace App\Models\Central;

use App\Enums\SubscriptionStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Carbon;

class Subscription extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'tenant_id',
        'plan_id',
        'status',
        'starts_at',
        'ends_at',
        'trial_ends_at',
        'cancelled_at',
        'cancellation_reason',
        'price_paid',
        'billing_cycle',
        'notes',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'status'        => SubscriptionStatus::class,
            'starts_at'     => 'datetime',
            'ends_at'       => 'datetime',
            'trial_ends_at' => 'datetime',
            'cancelled_at'  => 'datetime',
            'price_paid'    => 'decimal:2',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class, 'tenant_id', 'id');
    }

    public function plan(): BelongsTo
    {
        return $this->belongsTo(Plan::class);
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(SuperAdmin::class, 'created_by');
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', SubscriptionStatus::Active->value)
            ->where(function (Builder $q): void {
                $q->whereNull('ends_at')
                    ->orWhere('ends_at', '>', now());
            });
    }

    public function scopeTrial(Builder $query): Builder
    {
        return $query->where('status', SubscriptionStatus::Trial->value);
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->where(function (Builder $q): void {
            $q->where('status', SubscriptionStatus::Expired->value)
                ->orWhere(function (Builder $inner): void {
                    $inner->whereNotNull('ends_at')
                        ->where('ends_at', '<', now());
                });
        });
    }

    // -------------------------------------------------------------------------
    // Methods
    // -------------------------------------------------------------------------

    public function isActive(): bool
    {
        return $this->status === SubscriptionStatus::Active
            && ($this->ends_at === null || $this->ends_at->isFuture());
    }

    public function isExpired(): bool
    {
        return $this->status === SubscriptionStatus::Expired
            || ($this->ends_at !== null && $this->ends_at->isPast());
    }

    public function daysLeft(): ?int
    {
        if ($this->ends_at === null) {
            return null; // Pas de date de fin = pas de limite
        }

        if ($this->ends_at->isPast()) {
            return 0;
        }

        return (int) Carbon::now()->diffInDays($this->ends_at);
    }
}
