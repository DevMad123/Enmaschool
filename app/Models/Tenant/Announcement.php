<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\AnnouncementPriority;
use App\Enums\AnnouncementType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\SoftDeletes;

class Announcement extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'title',
        'body',
        'type',
        'priority',
        'target_roles',
        'target_class_ids',
        'attachment_path',
        'publish_at',
        'expires_at',
        'is_published',
        'published_at',
        'created_by',
    ];

    protected $casts = [
        'type'             => AnnouncementType::class,
        'priority'         => AnnouncementPriority::class,
        'target_roles'     => 'array',
        'target_class_ids' => 'array',
        'publish_at'       => 'datetime',
        'expires_at'       => 'datetime',
        'published_at'     => 'datetime',
        'is_published'     => 'boolean',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function reads(): HasMany
    {
        return $this->hasMany(AnnouncementRead::class);
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getReadCountAttribute(): int
    {
        return $this->reads()->count();
    }

    // ── Methods ────────────────────────────────────────────────────────────

    public function isTargetedTo(User $user): bool
    {
        $roles = $this->target_roles ?? [];

        return in_array('all', $roles, true)
            || in_array($user->role->value, $roles, true);
    }

    public function isExpired(): bool
    {
        return $this->expires_at !== null && $this->expires_at->isPast();
    }

    public function isScheduled(): bool
    {
        return $this->publish_at !== null
            && $this->publish_at->isFuture()
            && !$this->is_published;
    }

    public function isReadBy(User $user): bool
    {
        return $this->reads()->where('user_id', $user->id)->exists();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('is_published', true)
            ->where(function (Builder $q): void {
                $q->whereNull('expires_at')->orWhere('expires_at', '>', now());
            });
    }

    public function scopeForUser(Builder $query, User $user): Builder
    {
        return $query->published()
            ->where(function (Builder $q) use ($user): void {
                $q->whereJsonContains('target_roles', 'all')
                  ->orWhereJsonContains('target_roles', $user->role->value);
            });
    }

    public function scopeScheduled(Builder $query): Builder
    {
        return $query->where('is_published', false)
            ->whereNotNull('publish_at')
            ->where('publish_at', '>', now());
    }
}
