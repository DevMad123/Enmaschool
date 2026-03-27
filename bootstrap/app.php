<?php
// ===== bootstrap/app.php =====

declare(strict_types=1);

use App\Http\Middleware\Authenticate;
use App\Http\Middleware\CheckModule;
use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureTenantIsActive;
use Illuminate\Auth\AuthenticationException;
use Illuminate\Auth\Access\AuthorizationException;
use Illuminate\Validation\ValidationException;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Stancl\Tenancy\Exceptions\TenantCouldNotBeIdentifiedOnDomainException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function (): void {
            // Routes centrales (domaines principaux uniquement)
            \Illuminate\Support\Facades\Route::middleware('api')
                ->group(base_path('routes/central.php'));

            // Routes tenant API (chargées via routes/api.php avec middleware tenancy)
            \Illuminate\Support\Facades\Route::middleware('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'auth'         => Authenticate::class,
            'tenant.active' => EnsureTenantIsActive::class,
            'role'         => CheckRole::class,
            'module'       => CheckModule::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->render(function (TenantCouldNotBeIdentifiedOnDomainException $e, $request) {
            return response()->json(['success' => false, 'message' => 'Tenant introuvable.'], 404);
        });

        $exceptions->render(function (AuthenticationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('central/*')) {
                return response()->json(['success' => false, 'message' => 'Non authentifié.', 'errors' => []], 401);
            }
        });

        $exceptions->render(function (AuthorizationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('central/*')) {
                return response()->json(['success' => false, 'message' => 'Action non autorisée.', 'errors' => []], 403);
            }
        });

        $exceptions->render(function (ValidationException $e, $request) {
            if ($request->expectsJson() || $request->is('api/*') || $request->is('central/*')) {
                return response()->json([
                    'success' => false,
                    'message' => $e->getMessage(),
                    'errors'  => $e->errors(),
                ], 422);
            }
        });
    })->create();
