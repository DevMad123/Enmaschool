<?php
// ===== app/Http/Controllers/Tenant/InvitationController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\AcceptInvitationRequest;
use App\Http\Requests\Tenant\InviteUserRequest;
use App\Http\Resources\Tenant\UserInvitationResource;
use App\Http\Resources\Tenant\UserResource;
use App\Models\Tenant\UserInvitation;
use App\Services\Tenant\InvitationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use RuntimeException;

class InvitationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly InvitationService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $invitations = $this->service->list($request->all());

        return $this->paginated(
            $invitations->through(fn ($i) => new UserInvitationResource($i)),
        );
    }

    public function store(InviteUserRequest $request): JsonResponse
    {
        try {
            $invitation = $this->service->invite($request->validated(), $request->user());
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(
            data: new UserInvitationResource($invitation),
            message: 'Invitation envoyée.',
            code: 201,
        );
    }

    public function show(UserInvitation $invitation): JsonResponse
    {
        $invitation->load('invitedBy');

        return $this->success(data: new UserInvitationResource($invitation));
    }

    public function resend(Request $request, UserInvitation $invitation): JsonResponse
    {
        try {
            $invitation = $this->service->resend($invitation, $request->user());
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(
            data: new UserInvitationResource($invitation),
            message: 'Invitation renvoyée.',
        );
    }

    public function revoke(UserInvitation $invitation): JsonResponse
    {
        $invitation = $this->service->revoke($invitation);

        return $this->success(
            data: new UserInvitationResource($invitation),
            message: 'Invitation révoquée.',
        );
    }

    /**
     * Endpoint public — accepter une invitation (sans auth Sanctum).
     */
    public function accept(AcceptInvitationRequest $request): JsonResponse
    {
        try {
            ['user' => $user, 'token' => $token] = $this->service->accept(
                $request->input('token'),
                $request->validated(),
            );
        } catch (RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }

        return $this->success(
            data: [
                'user'  => new UserResource($user->load('roles')),
                'token' => $token,
            ],
            message: 'Compte activé avec succès.',
        );
    }
}
