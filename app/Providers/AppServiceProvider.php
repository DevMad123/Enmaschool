<?php
// ===== app/Providers/AppServiceProvider.php =====

declare(strict_types=1);

namespace App\Providers;

use App\Models\Central\Tenant;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\User;
use App\Observers\Central\TenantObserver;
use App\Observers\EnrollmentObserver;
use App\Observers\UserObserver;
use Illuminate\Support\Facades\Route;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Tenant::observe(TenantObserver::class);
        User::observe(UserObserver::class);
        Enrollment::observe(EnrollmentObserver::class);

        // Explicit model binding for Tenant (BaseTenant uses UUID primary key)
        Route::bind('tenant', fn (string $value) => Tenant::findOrFail($value));

        // Load channel definitions without calling Broadcast::routes() (which would register
        // /broadcasting/auth with web middleware). The auth route is declared in routes/api.php
        // with InitializeTenancyByDomain + auth:sanctum middleware instead.
        require base_path('routes/channels.php');
    }
}
