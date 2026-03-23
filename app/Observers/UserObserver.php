<?php

declare(strict_types=1);

namespace App\Observers;

use App\Enums\UserRole;
use App\Models\Tenant\Teacher;
use App\Models\Tenant\User;

class UserObserver
{
    /**
     * Crée automatiquement un profil Teacher quand un User avec role=teacher est créé.
     */
    public function created(User $user): void
    {
        if ($user->role === UserRole::Teacher) {
            Teacher::create(['user_id' => $user->id]);
        }
    }

    /**
     * Gère les changements de rôle :
     * - Si le rôle passe À teacher → créer le profil si absent
     * - Si le rôle passe DEPUIS teacher → désactiver le profil
     */
    public function updated(User $user): void
    {
        if (! $user->wasChanged('role')) {
            return;
        }

        $newRole = $user->role;
        $oldRole = $user->getOriginal('role');

        // Rôle passe VERS teacher
        if ($newRole === UserRole::Teacher) {
            if (! $user->teacherProfile()->exists()) {
                Teacher::create(['user_id' => $user->id]);
            } else {
                // Réactiver le profil si désactivé
                $user->teacherProfile()->update(['is_active' => true]);
            }
        }

        // Rôle passe DEPUIS teacher
        if ($oldRole === UserRole::Teacher->value || $oldRole === UserRole::Teacher) {
            Teacher::where('user_id', $user->id)->update(['is_active' => false]);
        }
    }
}
