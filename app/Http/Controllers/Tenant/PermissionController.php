<?php
// ===== app/Http/Controllers/Tenant/PermissionController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\UpdateRolePermissionsRequest;
use App\Http\Resources\Tenant\RolePermissionsResource;
use App\Services\Tenant\PermissionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use RuntimeException;

class PermissionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PermissionService $service,
    ) {}

    public function index(): JsonResponse
    {
        $roles = $this->service->getRolesWithPermissions();

        return $this->success(
            data: RolePermissionsResource::collection($roles),
        );
    }

    public function updateRole(UpdateRolePermissionsRequest $request, string $roleName): JsonResponse
    {
        try {
            $this->service->updateRolePermissions($roleName, $request->validated('permissions'));
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(message: "Permissions du rôle «{$roleName}» mises à jour.");
    }

    public function availablePermissions(): JsonResponse
    {
        $permissions = $this->service->getAvailablePermissions();

        return $this->success(data: $permissions);
    }
}
