<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\ConversationType;
use App\Models\Tenant\Conversation;
use App\Models\Tenant\User;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ConversationService
{
    public function findOrCreateDirect(User $userA, User $userB): Conversation
    {
        $existing = Conversation::where('type', ConversationType::Direct)
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userA->id)->whereNull('left_at'))
            ->whereHas('participants', fn ($q) => $q->where('user_id', $userB->id)->whereNull('left_at'))
            ->first();

        if ($existing) {
            return $existing;
        }

        return DB::transaction(function () use ($userA, $userB): Conversation {
            $conv = Conversation::create([
                'id'   => (string) Str::uuid(),
                'type' => ConversationType::Direct,
            ]);

            $now = now();
            $conv->participants()->createMany([
                ['user_id' => $userA->id, 'role' => 'member', 'joined_at' => $now],
                ['user_id' => $userB->id, 'role' => 'member', 'joined_at' => $now],
            ]);

            return $conv;
        });
    }

    public function createGroup(array $data, User $creator): Conversation
    {
        return DB::transaction(function () use ($data, $creator): Conversation {
            $conv = Conversation::create([
                'id'          => (string) Str::uuid(),
                'type'        => ConversationType::Group,
                'name'        => $data['name'],
                'description' => $data['description'] ?? null,
                'created_by'  => $creator->id,
            ]);

            $now = now();
            $conv->participants()->create(['user_id' => $creator->id, 'role' => 'admin', 'joined_at' => $now]);

            foreach ($data['user_ids'] as $userId) {
                if ($userId !== $creator->id) {
                    $conv->participants()->create(['user_id' => $userId, 'role' => 'member', 'joined_at' => $now]);
                }
            }

            app(MessageService::class)->sendSystemMessage($conv, "Conversation créée par {$creator->full_name}");

            return $conv;
        });
    }

    public function listForUser(User $user, array $filters = []): LengthAwarePaginator
    {
        return Conversation::forUser($user)
            ->active()
            ->with(['lastMessage.sender', 'participants.user'])
            ->paginate(20);
    }

    public function get(string $conversationId, User $user): Conversation
    {
        $conv = Conversation::with(['participants.user', 'lastMessage'])->findOrFail($conversationId);

        if (!$conv->isParticipant($user)) {
            abort(403, 'Accès non autorisé à cette conversation.');
        }

        return $conv;
    }

    public function addParticipants(Conversation $conv, array $userIds, User $addedBy): void
    {
        if (!$conv->isGroup()) {
            abort(400, 'Opération réservée aux groupes.');
        }

        $participant = $conv->participants()->where('user_id', $addedBy->id)->first();

        if (!$participant || $participant->role !== 'admin') {
            abort(403, 'Seul un admin peut ajouter des membres.');
        }

        $now = now();

        foreach ($userIds as $userId) {
            $conv->participants()->firstOrCreate(
                ['user_id' => $userId],
                ['role' => 'member', 'joined_at' => $now, 'left_at' => null],
            );
        }

        app(MessageService::class)->sendSystemMessage($conv, "{$addedBy->full_name} a ajouté des membres.");
    }

    public function removeParticipant(Conversation $conv, User $toRemove, User $removedBy): void
    {
        $conv->participants()->where('user_id', $toRemove->id)->update(['left_at' => now()]);
        app(MessageService::class)->sendSystemMessage($conv, "{$toRemove->full_name} a été retiré du groupe.");
    }

    public function leaveConversation(Conversation $conv, User $user): void
    {
        $conv->participants()->where('user_id', $user->id)->update(['left_at' => now()]);
    }

    public function markAsRead(Conversation $conv, User $user): void
    {
        $conv->markReadFor($user);
    }
}
