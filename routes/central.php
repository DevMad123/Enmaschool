<?php
// ===== routes/central.php =====

declare(strict_types=1);

use App\Http\Controllers\Central\ActivityLogController;
use App\Http\Controllers\Central\Auth\SuperAdminAuthController;
use App\Http\Controllers\Central\DashboardController;
use App\Http\Controllers\Central\GlobalUserController;
use App\Http\Controllers\Central\ModuleController;
use App\Http\Controllers\Central\PlanController;
use App\Http\Controllers\Central\SubscriptionController;
use App\Http\Controllers\Central\SupportTicketController;
use App\Http\Controllers\Central\SystemSettingController;
use App\Http\Controllers\Central\TenantController;
use App\Models\Central\Tenant;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Central API Routes
|--------------------------------------------------------------------------
|
| Routes accessibles uniquement sur les domaines centraux :
| enmaschool.test, localhost, 127.0.0.1
|
*/

// Routes publiques
Route::post('/central/auth/login', [SuperAdminAuthController::class, 'login']);

// Routes protégées
Route::middleware(['auth:sanctum'])->prefix('central')->group(function (): void {

    // ---- Auth ---------------------------------------------------------------
    Route::post('/auth/logout', [SuperAdminAuthController::class, 'logout']);
    Route::get('/auth/me', [SuperAdminAuthController::class, 'me']);

    // ---- Dashboard ----------------------------------------------------------
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // ---- Tenants ------------------------------------------------------------
    Route::get('/tenants',           [TenantController::class, 'index']);
    Route::post('/tenants',          [TenantController::class, 'store']);
    Route::get('/tenants/{tenant}',  [TenantController::class, 'show']);
    Route::put('/tenants/{tenant}',  [TenantController::class, 'update']);
    Route::delete('/tenants/{tenant}', [TenantController::class, 'destroy']);

    Route::post('/tenants/{tenant}/activate', [TenantController::class, 'activate']);
    Route::post('/tenants/{tenant}/suspend',  [TenantController::class, 'suspend']);
    Route::get('/tenants/{tenant}/stats',     [TenantController::class, 'stats']);

    // Modules par tenant
    Route::get('/tenants/{tenant}/modules',         [ModuleController::class, 'getTenantModules']);
    Route::post('/tenants/{tenant}/modules/enable',  [ModuleController::class, 'enableModule']);
    Route::post('/tenants/{tenant}/modules/disable', [ModuleController::class, 'disableModule']);

    // Activité par tenant
    Route::get('/tenants/{tenant}/activity', [ActivityLogController::class, 'tenantActivity']);

    // Historique abonnements par tenant
    Route::get('/tenants/{tenant}/subscriptions',  [SubscriptionController::class, 'history']);
    Route::post('/tenants/{tenant}/subscriptions', [SubscriptionController::class, 'assignPlan']);

    // ---- Plans --------------------------------------------------------------
    Route::get('/plans',          [PlanController::class, 'index']);
    Route::post('/plans',         [PlanController::class, 'store']);
    Route::get('/plans/{plan}',   [PlanController::class, 'show']);
    Route::put('/plans/{plan}',   [PlanController::class, 'update']);
    Route::delete('/plans/{plan}', [PlanController::class, 'destroy']);

    // ---- Modules système ----------------------------------------------------
    Route::get('/modules', [ModuleController::class, 'index']);
    Route::put('/modules/{moduleKey}', [ModuleController::class, 'update']);

    // ---- Abonnements --------------------------------------------------------
    Route::get('/subscriptions',                        [SubscriptionController::class, 'index']);
    Route::delete('/subscriptions/{subscription}',      [SubscriptionController::class, 'cancel']);

    // ---- Journaux d'activité ------------------------------------------------
    Route::get('/activity-logs',         [ActivityLogController::class, 'index']);
    Route::get('/activity-logs/export',  [ActivityLogController::class, 'export']);

    // ---- Support ------------------------------------------------------------
    Route::get('/tickets',                [SupportTicketController::class, 'index']);
    Route::post('/tickets',               [SupportTicketController::class, 'store']);
    Route::get('/tickets/{ticket}',       [SupportTicketController::class, 'show']);
    Route::put('/tickets/{ticket}',       [SupportTicketController::class, 'update']);
    Route::post('/tickets/{ticket}/reply', [SupportTicketController::class, 'reply']);
    Route::post('/tickets/{ticket}/close', [SupportTicketController::class, 'close']);

    // ---- Paramètres système -------------------------------------------------
    Route::get('/settings', [SystemSettingController::class, 'index']);
    Route::put('/settings', [SystemSettingController::class, 'update']);
    Route::post('/settings/test-smtp', [SystemSettingController::class, 'testSmtp']);

    // ---- Utilisateurs globaux -----------------------------------------------
    Route::get('/users', [GlobalUserController::class, 'index']);
});
