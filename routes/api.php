<?php
// ===== routes/api.php =====

declare(strict_types=1);

use App\Http\Controllers\Tenant\Auth\AuthController;
use Illuminate\Support\Facades\Route;
use Stancl\Tenancy\Middleware\InitializeTenancyByDomain;
use Stancl\Tenancy\Middleware\PreventAccessFromCentralDomains;

/*
|--------------------------------------------------------------------------
| Tenant API Routes
|--------------------------------------------------------------------------
|
| Routes accessibles sur les sous-domaines tenant : {slug}.enmaschool.test
| La tenancy est initialisée par le middleware de domaine.
|
*/

Route::middleware([
    'api',
    InitializeTenancyByDomain::class,
    PreventAccessFromCentralDomains::class,
])->group(function (): void {

    // Routes publiques
    Route::post('/api/auth/login', [AuthController::class, 'login']);

    // Routes protégées
    Route::middleware(['auth:sanctum', 'tenant.active'])->group(function (): void {
        Route::post('/api/auth/logout', [AuthController::class, 'logout']);
        Route::get('/api/auth/me', [AuthController::class, 'me']);
        Route::post('/api/auth/refresh', [AuthController::class, 'refreshToken']);

        // Les futurs modules s'ajouteront ici
    });
});
