<?php
// ===== app/Http/Controllers/Central/Auth/SuperAdminAuthController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\Central\SuperAdmin;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class SuperAdminAuthController extends Controller
{
    use ApiResponse;

    public function login(LoginRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $admin = SuperAdmin::where('email', $validated['email'])->first();

        if (! $admin || ! Hash::check($validated['password'], $admin->password)) {
            return $this->error('Email ou mot de passe incorrect.', 401);
        }

        // Créer le token Sanctum
        $deviceName = $validated['device_name'] ?? 'web';
        $token = $admin->createToken($deviceName)->plainTextToken;

        // Mettre à jour last_login_at
        $admin->update(['last_login_at' => now()]);

        return $this->success(
            data: [
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ],
                'token' => $token,
                'roles' => ['super_admin'],
            ],
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
        $admin = $request->user();

        return $this->success(
            data: [
                'user' => [
                    'id' => $admin->id,
                    'name' => $admin->name,
                    'email' => $admin->email,
                ],
                'roles' => ['super_admin'],
            ],
        );
    }
}
