<?php
// ===== bootstrap/app.php =====

declare(strict_types=1);

use App\Http\Middleware\CheckRole;
use App\Http\Middleware\EnsureTenantIsActive;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        channels: __DIR__.'/../routes/channels.php',
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
            'tenant.active' => EnsureTenantIsActive::class,
            'role' => CheckRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
