<?php
// ===== app/Services/Tenant/InvitationService.php =====

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\InvitationStatus;
use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Tenant\User;
use App\Models\Tenant\UserInvitation;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use RuntimeException;

class InvitationService
{
    public function invite(array $data, User $invitedBy): UserInvitation
    {
        // Vérifier qu'il n'existe pas déjà une invitation pending
        $existing = UserInvitation::pending()
            ->where('email', $data['email'])
            ->first();

        if ($existing) {
            throw new RuntimeException('Une invitation est déjà en attente pour cet email.');
        }

        // Vérifier que l'email n'est pas déjà un utilisateur actif
        $activeUser = User::where('email', $data['email'])
            ->where('status', UserStatus::Active)
            ->first();

        if ($activeUser) {
            throw new RuntimeException('Un utilisateur actif avec cet email existe déjà.');
        }

        $invitation = UserInvitation::create([
            'email'      => $data['email'],
            'role'       => $data['role'],
            'token'      => UserInvitation::generateToken(),
            'invited_by' => $invitedBy->id,
            'expires_at' => now()->addHours(72),
        ]);

        // En production : dispatch job SendInvitationEmail
        Log::info('Invitation created', [
            'email' => $invitation->email,
            'token' => $invitation->token,
            'link'  => $this->buildLink($invitation->token),
        ]);

        return $invitation->load('invitedBy');
    }

    public function accept(string $token, array $data): array
    {
        $invitation = UserInvitation::where('token', $token)->first();

        if (!$invitation || !$invitation->isValid()) {
            throw new RuntimeException('Ce lien d\'invitation est invalide ou a expiré.');
        }

        // Créer l'utilisateur
        $role = UserRole::from($invitation->role);

        $user = User::create([
            'first_name' => $data['first_name'],
            'last_name'  => $data['last_name'],
            'email'      => $invitation->email,
            'password'   => Hash::make($data['password']),
            'phone'      => $data['phone'] ?? null,
            'role'       => $role,
            'status'     => UserStatus::Active,
        ]);

        $user->syncRoles([$role->value]);

        // Marquer l'invitation comme acceptée
        $invitation->accepted_at = now();
        $invitation->save();

        // Générer un token Sanctum
        $sanctumToken = $user->createToken('invitation-accept')->plainTextToken;

        return ['user' => $user, 'token' => $sanctumToken];
    }

    public function resend(UserInvitation $invitation, User $resendBy): UserInvitation
    {
        if ($invitation->status === InvitationStatus::Accepted) {
            throw new RuntimeException('Cette invitation a déjà été acceptée.');
        }

        $invitation->token      = UserInvitation::generateToken();
        $invitation->expires_at = now()->addHours(72);
        $invitation->revoked_at = null;
        $invitation->save();

        Log::info('Invitation resent', [
            'email' => $invitation->email,
            'link'  => $this->buildLink($invitation->token),
        ]);

        return $invitation->load('invitedBy');
    }

    public function revoke(UserInvitation $invitation): UserInvitation
    {
        $invitation->revoked_at = now();
        $invitation->save();

        return $invitation;
    }

    public function list(array $filters): LengthAwarePaginator
    {
        $query = UserInvitation::with('invitedBy')->latest();

        if (!empty($filters['email'])) {
            $query->where('email', 'ilike', "%{$filters['email']}%");
        }

        if (!empty($filters['status'])) {
            match ($filters['status']) {
                'pending'  => $query->pending(),
                'expired'  => $query->expired(),
                'accepted' => $query->whereNotNull('accepted_at'),
                'revoked'  => $query->whereNotNull('revoked_at'),
                default    => null,
            };
        }

        return $query->paginate((int) ($filters['per_page'] ?? 20));
    }

    private function buildLink(string $token): string
    {
        return url('/accept-invitation?token=' . $token);
    }
}
