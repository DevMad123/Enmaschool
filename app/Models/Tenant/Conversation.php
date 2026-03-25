<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\ConversationType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Conversation extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'type',
        'name',
        'description',
        'avatar',
        'created_by',
        'last_message_at',
        'last_message_preview',
        'is_archived',
    ];

    protected $casts = [
        'type'            => ConversationType::class,
        'last_message_at' => 'datetime',
        'is_archived'     => 'boolean',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function participants(): HasMany
    {
        return $this->hasMany(ConversationParticipant::class);
    }

    public function users(): BelongsToMany
    {
        return $this->belongsToMany(User::class, 'conversation_participants')
            ->withPivot('role', 'joined_at', 'left_at', 'last_read_at', 'is_muted')
            ->withTimestamps();
    }

    public function messages(): HasMany
    {
        return $this->hasMany(Message::class)->orderBy('created_at', 'desc');
    }

    public function lastMessage(): HasOne
    {
        return $this->hasOne(Message::class)->latest();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Methods ────────────────────────────────────────────────────────────

    public function isParticipant(User $user): bool
    {
        return $this->participants()
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->exists();
    }

    public function getUnreadCountFor(User $user): int
    {
        $participant = $this->participants()
            ->where('user_id', $user->id)
            ->whereNull('left_at')
            ->first();

        if (!$participant) {
            return 0;
        }

        $query = $this->messages()->where('sender_id', '!=', $user->id);

        if ($participant->last_read_at) {
            $query->where('created_at', '>', $participant->last_read_at);
        }

        return $query->count();
    }

    public function isDirect(): bool
    {
        return $this->type === ConversationType::Direct;
    }

    public function isGroup(): bool
    {
        return $this->type === ConversationType::Group;
    }

    public function getNameFor(User $user): string
    {
        if ($this->isDirect()) {
            $other = $this->participants()
                ->where('user_id', '!=', $user->id)
                ->whereNull('left_at')
                ->with('user')
                ->first();

            return $other?->user?->full_name ?? 'Utilisateur inconnu';
        }

        return $this->name ?? 'Groupe sans nom';
    }

    public function markReadFor(User $user): void
    {
        $this->participants()
            ->where('user_id', $user->id)
            ->update(['last_read_at' => now()]);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForUser(Builder $query, User $user): Builder
    {
        return $query->whereHas('participants', function (Builder $q) use ($user): void {
            $q->where('user_id', $user->id)->whereNull('left_at');
        });
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('is_archived', false);
    }

    public function scopeDirect(Builder $query): Builder
    {
        return $query->where('type', ConversationType::Direct);
    }

    public function scopeGroup(Builder $query): Builder
    {
        return $query->where('type', ConversationType::Group);
    }
}
