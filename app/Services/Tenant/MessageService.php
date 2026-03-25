<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\MessageType;
use App\Events\MessageDeleted;
use App\Events\MessageEdited;
use App\Events\MessageSent;
use App\Models\Tenant\Conversation;
use App\Models\Tenant\Message;
use App\Models\Tenant\User;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Str;

class MessageService
{
    public function getMessages(Conversation $conv, User $user, array $filters = []): LengthAwarePaginator
    {
        if (!$conv->isParticipant($user)) {
            abort(403);
        }

        $messages = Message::forConversation($conv->id)
            ->with(['sender', 'replyTo.sender'])
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        $this->markConversationRead($conv, $user);

        return $messages;
    }

    public function send(Conversation $conv, User $sender, array $data): Message
    {
        $participant = $conv->participants()
            ->where('user_id', $sender->id)
            ->whereNull('left_at')
            ->first();

        if (!$participant) {
            abort(403, "Vous n'êtes plus membre de cette conversation.");
        }

        $attachmentPath = null;
        $attachmentName = null;
        $attachmentSize = null;

        if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
            $file           = $data['attachment'];
            $attachmentName = $file->getClientOriginalName();
            $attachmentSize = $file->getSize();
            $attachmentPath = $file->store('conversations/' . $conv->id . '/attachments', 'public');
        }

        $message = Message::create([
            'id'              => (string) Str::uuid(),
            'conversation_id' => $conv->id,
            'sender_id'       => $sender->id,
            'body'            => $data['body'] ?? '',
            'type'            => $data['type'] ?? MessageType::Text->value,
            'attachment_path' => $attachmentPath,
            'attachment_name' => $attachmentName,
            'attachment_size' => $attachmentSize,
            'reply_to_id'     => $data['reply_to_id'] ?? null,
        ]);

        $conv->update([
            'last_message_at'      => now(),
            'last_message_preview' => mb_substr($message->body, 0, 200),
        ]);

        $message->load('sender', 'replyTo.sender');
        broadcast(new MessageSent($message, $conv))->toOthers();

        return $message;
    }

    public function edit(Message $message, string $newBody, User $editor): Message
    {
        if ($message->sender_id !== $editor->id) {
            abort(403);
        }

        if ($message->deleted_at) {
            abort(400, 'Message supprimé.');
        }

        $message->update([
            'body'      => $newBody,
            'is_edited' => true,
            'edited_at' => now(),
        ]);

        broadcast(new MessageEdited($message, $message->conversation))->toOthers();

        return $message;
    }

    public function delete(Message $message, User $deleter): Message
    {
        $isAdmin = $message->conversation
            ->participants()
            ->where('user_id', $deleter->id)
            ->where('role', 'admin')
            ->exists();

        if ($message->sender_id !== $deleter->id && !$isAdmin) {
            abort(403);
        }

        $message->update(['deleted_at' => now()]);
        broadcast(new MessageDeleted($message, $message->conversation))->toOthers();

        return $message;
    }

    public function sendSystemMessage(Conversation $conv, string $text): Message
    {
        return Message::create([
            'id'              => (string) Str::uuid(),
            'conversation_id' => $conv->id,
            'sender_id'       => null,
            'body'            => $text,
            'type'            => MessageType::System->value,
        ]);
    }

    private function markConversationRead(Conversation $conv, User $user): void
    {
        $conv->participants()->where('user_id', $user->id)->update(['last_read_at' => now()]);
    }
}
