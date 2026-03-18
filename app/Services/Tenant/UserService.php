<?php
// ===== app/Services/Tenant/UserService.php =====

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\UserRole;
use App\Enums\UserStatus;
use App\Models\Tenant\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use RuntimeException;

class UserService
{
    public function list(array $filters): LengthAwarePaginator
    {
        $query = User::query()->staff()->with('roles');

        if (!empty($filters['role'])) {
            $query->where('role', $filters['role']);
        }

        if (!empty($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (!empty($filters['search'])) {
            $term = $filters['search'];
            $query->where(function ($q) use ($term): void {
                $q->where('first_name', 'ilike', "%{$term}%")
                  ->orWhere('last_name', 'ilike', "%{$term}%")
                  ->orWhere('email', 'ilike', "%{$term}%");
            });
        }

        return $query->latest()->paginate((int) ($filters['per_page'] ?? 20));
    }

    public function create(array $data): User
    {
        $data['password'] = Hash::make($data['password']);
        $data['status'] ??= UserStatus::Active;

        $role = UserRole::from($data['role']);
        $user = User::create($data);

        // Synchroniser Spatie + colonne role (cache dénormalisé)
        $user->syncRoles([$role->value]);

        return $user;
    }

    public function update(User $user, array $data): User
    {
        if (isset($data['password'])) {
            $data['password'] = Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->fill($data)->save();

        if (isset($data['role'])) {
            $newRole = UserRole::from($data['role']);
            $user->syncRoles([$newRole->value]);
            $user->role = $newRole;
            $user->save();
        }

        return $user->refresh();
    }

    public function updateRole(User $user, UserRole $newRole): User
    {
        $user->syncRoles([$newRole->value]);
        $user->role = $newRole;
        $user->save();

        return $user;
    }

    public function activate(User $user): User
    {
        $user->status = UserStatus::Active;
        $user->save();

        return $user;
    }

    public function deactivate(User $user): User
    {
        $user->status = UserStatus::Inactive;
        $user->save();
        $user->tokens()->delete();

        return $user;
    }

    public function suspend(User $user, string $reason): User
    {
        $user->status = UserStatus::Suspended;
        $user->save();
        $user->tokens()->delete();

        return $user;
    }

    public function resetPassword(User $user): string
    {
        $temporary = Str::password(12);

        $user->password = Hash::make($temporary);
        $user->save();
        $user->tokens()->delete();

        return $temporary;
    }

    public function delete(User $user): void
    {
        // Protection : ne pas supprimer le dernier school_admin
        if ($user->role === UserRole::SchoolAdmin) {
            $adminCount = User::where('role', UserRole::SchoolAdmin)
                ->where('status', UserStatus::Active)
                ->whereNull('deleted_at')
                ->count();

            if ($adminCount <= 1) {
                throw new RuntimeException('Impossible de supprimer le dernier administrateur actif.');
            }
        }

        $user->tokens()->delete();
        $user->delete();
    }

    public function getPermissions(User $user): array
    {
        return $user->getAllPermissions()->pluck('name')->toArray();
    }
}
