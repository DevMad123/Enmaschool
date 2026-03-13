<?php
// ===== app/Providers/AppServiceProvider.php =====

declare(strict_types=1);

namespace App\Providers;

use App\Models\Central\Tenant;
use App\Observers\Central\TenantObserver;
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
    }
}
