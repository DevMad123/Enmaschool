<?php
// ===== app/Http/Controllers/Tenant/UserController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreUserRequest;
use App\Http\Requests\Tenant\UpdateUserRequest;
use App\Http\Resources\Tenant\UserPermissionsResource;
use App\Http\Resources\Tenant\UserResource;
use App\Models\Tenant\User;
use App\Services\Tenant\PermissionService;
use App\Services\Tenant\UserService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly UserService $service,
        private readonly PermissionService $permissionService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $users = $this->service->list($request->all());

        return $this->paginated(
            $users->through(fn ($u) => new UserResource($u)),
        );
    }

    public function store(StoreUserRequest $request): JsonResponse
    {
        $user = $this->service->create($request->validated());

        return $this->success(
            data: new UserResource($user->load('roles')),
            message: 'Utilisateur créé.',
            code: 201,
        );
    }

    public function show(User $user): JsonResponse
    {
        $user->load(['roles', 'permissions']);

        return $this->success(data: new UserResource($user));
    }

    public function update(UpdateUserRequest $request, User $user): JsonResponse
    {
        $user = $this->service->update($user, $request->validated());

        return $this->success(
            data: new UserResource($user->load('roles')),
            message: 'Utilisateur mis à jour.',
        );
    }

    public function destroy(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return $this->error('Vous ne pouvez pas supprimer votre propre compte.', 403);
        }

        $this->service->delete($user);

        return $this->success(message: 'Utilisateur supprimé.');
    }

    public function activate(User $user): JsonResponse
    {
        $user = $this->service->activate($user);

        return $this->success(
            data: new UserResource($user),
            message: 'Utilisateur activé.',
        );
    }

    public function deactivate(Request $request, User $user): JsonResponse
    {
        if ($request->user()->id === $user->id) {
            return $this->error('Vous ne pouvez pas vous désactiver vous-même.', 403);
        }

        $user = $this->service->deactivate($user);

        return $this->success(
            data: new UserResource($user),
            message: 'Utilisateur désactivé.',
        );
    }

    public function suspend(Request $request, User $user): JsonResponse
    {
        $reason = $request->input('reason', '');
        $user   = $this->service->suspend($user, $reason);

        return $this->success(
            data: new UserResource($user),
            message: 'Utilisateur suspendu.',
        );
    }

    public function resetPassword(User $user): JsonResponse
    {
        $temporary = $this->service->resetPassword($user);

        return $this->success(
            data: ['temporary_password' => $temporary],
            message: 'Mot de passe réinitialisé.',
        );
    }

    public function permissions(User $user): JsonResponse
    {
        $data = $this->permissionService->getUserPermissions($user);

        return $this->success(data: new UserPermissionsResource($data));
    }

    public function search(Request $request): JsonResponse
    {
        $term = (string) $request->query('q', '');
        $excludeSelf = (bool) $request->query('exclude_self', true);

        $query = User::query()
            ->with('roles')
            ->active()
            ->where(function ($q) use ($term): void {
                $q->where('first_name', 'ilike', "%{$term}%")
                  ->orWhere('last_name', 'ilike', "%{$term}%")
                  ->orWhere('email', 'ilike', "%{$term}%");
            })
            ->limit(15);

        if ($excludeSelf) {
            $query->where('id', '!=', $request->user()->id);
        }

        $users = $query->get();

        return $this->success(data: $users->map(fn ($u) => [
            'id'         => $u->id,
            'full_name'  => $u->full_name,
            'email'      => $u->email,
            'avatar_url' => $u->avatar_url,
            'role'       => $u->roles->first()?->name,
        ]));
    }
}
