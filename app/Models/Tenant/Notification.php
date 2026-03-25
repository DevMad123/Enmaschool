<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\MorphTo;
use Illuminate\Support\Str;

class Notification extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    const UPDATED_AT = null;

    protected $fillable = [
        'id',
        'user_id',
        'type',
        'title',
        'body',
        'data',
        'notifiable_type',
        'notifiable_id',
        'action_url',
        'icon',
        'color',
        'is_read',
        'read_at',
        'sent_via_email',
        'email_sent_at',
    ];

    protected $casts = [
        'data'          => 'array',
        'is_read'       => 'boolean',
        'read_at'       => 'datetime',
        'email_sent_at' => 'datetime',
    ];

    // ── Boot ───────────────────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (self $model): void {
            $model->id ??= (string) Str::uuid();
        });
    }

    // ── Relations ──────────────────────────────────────────────────────────

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function notifiable(): MorphTo
    {
        return $this->morphTo();
    }

    // ── Methods ────────────────────────────────────────────────────────────

    public function markAsRead(): void
    {
        $this->is_read = true;
        $this->read_at = now();
        $this->save();
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForUser(Builder $query, int $userId): Builder
    {
        return $query->where('user_id', $userId);
    }

    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('is_read', false);
    }

    public function scopeRead(Builder $query): Builder
    {
        return $query->where('is_read', true);
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }
}
