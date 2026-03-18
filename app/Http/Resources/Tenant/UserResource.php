<?php
// ===== app/Http/Resources/Tenant/UserResource.php =====

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var \App\Models\Tenant\User $this */
        $authUser = $request->user();

        return [
            'id'             => $this->id,
            'first_name'     => $this->first_name,
            'last_name'      => $this->last_name,
            'full_name'      => $this->full_name,
            'email'          => $this->email,
            'phone'          => $this->phone,
            'avatar_url'     => $this->avatar_url,
            'role'           => [
                'value' => $this->role->value,
                'label' => $this->role->label(),
                'color' => $this->role->color(),
            ],
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],
            'last_login_at' => $this->last_login_at?->toIso8601String(),
            'created_at'    => $this->created_at->toIso8601String(),

            // Relations conditionnelles
            'roles'       => $this->whenLoaded('roles', fn () => $this->roles->pluck('name')),
            'permissions' => $this->when(
                $this->relationLoaded('permissions'),
                fn () => $this->permissions->pluck('name'),
            ),

            // Méta : ce que l'utilisateur courant peut faire
            'can' => $this->when($authUser !== null, fn () => [
                'edit'        => $authUser->can('users.edit'),
                'delete'      => $authUser->can('users.delete'),
                'manage_role' => $authUser->can('users.roles.manage'),
            ]),
        ];
    }
}
