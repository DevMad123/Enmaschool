<?php
// ===== app/Models/Tenant/UserInvitation.php =====

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\InvitationStatus;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class UserInvitation extends Model
{
    protected $fillable = [
        'email',
        'role',
        'token',
        'invited_by',
        'accepted_at',
        'expires_at',
        'revoked_at',
    ];

    protected function casts(): array
    {
        return [
            'accepted_at' => 'datetime',
            'expires_at'  => 'datetime',
            'revoked_at'  => 'datetime',
        ];
    }

    // -------------------------------------------------------------------------
    // Relations
    // -------------------------------------------------------------------------

    public function invitedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'invited_by');
    }

    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------

    public function getStatusAttribute(): InvitationStatus
    {
        if ($this->revoked_at !== null) {
            return InvitationStatus::Revoked;
        }

        if ($this->accepted_at !== null) {
            return InvitationStatus::Accepted;
        }

        if ($this->expires_at->isPast()) {
            return InvitationStatus::Expired;
        }

        return InvitationStatus::Pending;
    }

    // -------------------------------------------------------------------------
    // Methods
    // -------------------------------------------------------------------------

    public function isValid(): bool
    {
        return $this->status === InvitationStatus::Pending && $this->expires_at->isFuture();
    }

    public static function generateToken(): string
    {
        return hash('sha256', Str::random(60));
    }

    // -------------------------------------------------------------------------
    // Scopes
    // -------------------------------------------------------------------------

    public function scopePending(Builder $query): Builder
    {
        return $query
            ->whereNull('revoked_at')
            ->whereNull('accepted_at')
            ->where('expires_at', '>', now());
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query
            ->whereNull('accepted_at')
            ->where('expires_at', '<=', now());
    }
}
