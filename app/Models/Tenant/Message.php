<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\MessageType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Facades\Storage;

class Message extends Model
{
    protected $keyType = 'string';

    public $incrementing = false;

    protected $fillable = [
        'id',
        'conversation_id',
        'sender_id',
        'body',
        'type',
        'attachment_path',
        'attachment_name',
        'attachment_size',
        'reply_to_id',
        'is_edited',
        'edited_at',
        'deleted_at',
    ];

    protected $casts = [
        'type'       => MessageType::class,
        'is_edited'  => 'boolean',
        'edited_at'  => 'datetime',
        'deleted_at' => 'datetime',
    ];

    // ── Relations ──────────────────────────────────────────────────────────

    public function conversation(): BelongsTo
    {
        return $this->belongsTo(Conversation::class);
    }

    public function sender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'sender_id');
    }

    public function replyTo(): BelongsTo
    {
        return $this->belongsTo(Message::class, 'reply_to_id');
    }

    public function replies(): HasMany
    {
        return $this->hasMany(Message::class, 'reply_to_id');
    }

    // ── Accessors ──────────────────────────────────────────────────────────

    public function getIsDeletedAttribute(): bool
    {
        return !is_null($this->deleted_at);
    }

    public function getDisplayBodyAttribute(): string
    {
        return $this->deleted_at ? '[Message supprimé]' : $this->body;
    }

    public function getAttachmentUrlAttribute(): ?string
    {
        if (!$this->attachment_path) {
            return null;
        }

        return Storage::disk('public')->url($this->attachment_path);
    }

    // ── Scopes ─────────────────────────────────────────────────────────────

    public function scopeForConversation(Builder $query, string $conversationId): Builder
    {
        return $query->where('conversation_id', $conversationId);
    }
}
