<?php
// ===== app/Http/Controllers/Tenant/Auth/AuthController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Tenant\Auth;

use App\Enums\TenantStatus;
use App\Enums\UserStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Tenant\User;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $user = User::where('email', $validated['email'])->first();

        if (! $user || ! Hash::check($validated['password'], $user->password)) {
            return $this->error('Email ou mot de passe incorrect.', 401);
        }

        // Vérifier le statut de l'utilisateur
        if ($user->status === UserStatus::Suspended) {
            return $this->error('Votre compte est suspendu. Contactez l\'administration.', 403);
        }

        if ($user->status === UserStatus::Inactive) {
            return $this->error('Votre compte est inactif. Contactez l\'administration.', 403);
        }

        // Vérifier le statut du tenant
        $tenant = tenant();

        if ($tenant->status === TenantStatus::Suspended) {
            return response()->json([
                'success' => false,
                'message' => 'L\'établissement est suspendu.',
                'code' => 'TENANT_SUSPENDED',
            ], 403);
        }

        if ($tenant->status === TenantStatus::Cancelled) {
            return response()->json([
                'success' => false,
                'message' => 'L\'abonnement de l\'établissement est annulé.',
                'code' => 'TENANT_CANCELLED',
            ], 403);
        }

        // Vérifier l'expiration du trial
        if ($tenant->status === TenantStatus::Trial && $tenant->trial_ends_at?->isPast()) {
            return response()->json([
                'success' => false,
                'message' => 'La période d\'essai est expirée.',
                'code' => 'TRIAL_EXPIRED',
            ], 402);
        }

        // Créer le token Sanctum
        $deviceName = $validated['device_name'] ?? 'web';
        $token = $user->createToken($deviceName)->plainTextToken;

        // Mettre à jour last_login_at
        $user->update(['last_login_at' => now()]);

        return $this->success(
            data: $this->buildAuthPayload($user, $token),
            message: 'Connexion réussie',
        );
    }

    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(message: 'Déconnecté avec succès');
    }

    public function me(Request $request): JsonResponse
    {
        $user = $request->user();

        return $this->success(
            data: $this->buildAuthPayload($user),
        );
    }

    public function refreshToken(Request $request): JsonResponse
    {
        $user = $request->user();
        $tokenName = $user->currentAccessToken()->name;

        // Révoquer l'ancien token
        $user->currentAccessToken()->delete();

        // Créer un nouveau token
        $newToken = $user->createToken($tokenName)->plainTextToken;

        return $this->success(
            data: ['token' => $newToken],
            message: 'Token rafraîchi avec succès',
        );
    }

    /**
     * @return array<string, mixed>
     */
    private function buildAuthPayload(User $user, ?string $token = null): array
    {
        $tenant = tenant();
        $profile = $tenant->profile;

        $payload = [
            'user' => [
                'id' => $user->id,
                'first_name' => $user->first_name,
                'last_name' => $user->last_name,
                'full_name' => $user->full_name,
                'email' => $user->email,
                'role' => $user->role->value,
                'avatar_url' => $user->avatar_url,
                'status' => $user->status->value,
                'phone' => $user->phone,
            ],
            'permissions' => $user->getAllPermissions()->pluck('name')->values()->all(),
            'roles' => $user->getRoleNames()->push($user->role->value)->unique()->values()->all(),
            'school' => [
                'name' => $tenant->name,
                'logo' => $profile?->logo,
                'has_primary' => $tenant->has_primary,
                'has_college' => $tenant->has_college,
                'has_lycee' => $tenant->has_lycee,
                'has_maternelle' => $tenant->has_maternelle,
                'active_modules' => $tenant->plan?->features ?? [],
            ],
        ];

        if ($token !== null) {
            $payload['token'] = $token;
        }

        return $payload;
    }
}
