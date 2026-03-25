<?php

use Illuminate\Support\Facades\Broadcast;

Broadcast::channel('App.Models.User.{id}', function ($user, $id) {
    return (int) $user->id === (int) $id;
});

Broadcast::channel('conversation.{id}', function (\App\Models\Tenant\User $user, string $id) {
    $conv = \App\Models\Tenant\Conversation::find($id);

    return $conv && $conv->participants()->where('user_id', $user->id)->whereNull('left_at')->exists();
});

Broadcast::channel('user.{userId}.notifications', function (\App\Models\Tenant\User $user, int $userId) {
    return (int) $user->id === $userId;
});
