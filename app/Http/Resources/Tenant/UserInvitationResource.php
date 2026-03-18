<?php
// ===== app/Http/Resources/Tenant/UserInvitationResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Enums\InvitationStatus;
use App\Enums\UserRole;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserInvitationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Tenant\UserInvitation $this */
        $status = $this->status;
        $role   = UserRole::tryFrom($this->role);

        return [
            'id'    => $this->id,
            'email' => $this->email,
            'role'  => [
                'value' => $this->role,
                'label' => $role?->label() ?? $this->role,
            ],
            'status' => [
                'value' => $status->value,
                'label' => $status->label(),
                'color' => $status->color(),
            ],
            'invited_by' => $this->whenLoaded('invitedBy', fn () => [
                'id'        => $this->invitedBy->id,
                'full_name' => $this->invitedBy->full_name,
            ]),
            'is_valid'        => $this->isValid(),
            'expires_at'      => $this->expires_at->toIso8601String(),
            'accepted_at'     => $this->accepted_at?->toIso8601String(),
            'created_at'      => $this->created_at->toIso8601String(),
            // Lien d'invitation uniquement si Pending
            'invitation_link' => $this->when(
                $status === InvitationStatus::Pending,
                fn () => url('/accept-invitation?token=' . $this->token),
            ),
        ];
    }
}
