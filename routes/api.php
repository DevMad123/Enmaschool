<?php
// ===== routes/api.php =====

declare(strict_types=1);

use App\Http\Controllers\Tenant\AcademicYearController;
use App\Http\Controllers\Tenant\Auth\AuthController;
use App\Http\Controllers\Tenant\ClasseController;
use App\Http\Controllers\Tenant\InvitationController;
use App\Http\Controllers\Tenant\PermissionController;
use App\Http\Controllers\Tenant\RoomController;
use App\Http\Controllers\Tenant\SchoolLevelController;
use App\Http\Controllers\Tenant\SchoolSettingController;
use App\Http\Controllers\Tenant\SubjectController;
use App\Http\Controllers\Tenant\UserController;
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
    Route::post('/api/school/invitations/accept', [InvitationController::class, 'accept']);

    // Routes protégées
    Route::middleware(['auth:sanctum', 'tenant.active'])->group(function (): void {
        Route::post('/api/auth/logout', [AuthController::class, 'logout']);
        Route::get('/api/auth/me', [AuthController::class, 'me']);
        Route::post('/api/auth/refresh', [AuthController::class, 'refreshToken']);

        // ── School Configuration (Phase 2) ─────────────────────
        Route::prefix('api/school')->group(function (): void {

            // ── Read-only routes (all authenticated users) ──────
            Route::get('school-levels', [SchoolLevelController::class, 'index']);
            Route::get('academic-years', [AcademicYearController::class, 'index']);
            Route::get('academic-years/{academicYear}', [AcademicYearController::class, 'show']);
            Route::get('academic-years/{academicYear}/periods', [AcademicYearController::class, 'periods']);
            Route::get('classes/options', [ClasseController::class, 'options']);
            Route::get('classes', [ClasseController::class, 'index']);
            Route::get('classes/{classe}', [ClasseController::class, 'show']);
            Route::get('classes/{classe}/subjects', [ClasseController::class, 'subjects']);
            Route::get('subjects', [SubjectController::class, 'index']);
            Route::get('subjects/{subject}', [SubjectController::class, 'show']);
            Route::get('rooms', [RoomController::class, 'index']);
            Route::get('rooms/{room}', [RoomController::class, 'show']);
            Route::get('settings', [SchoolSettingController::class, 'index']);

            // ── Write routes (school_admin & director only) ─────
            Route::middleware('role:school_admin,director')->group(function (): void {
                // Settings
                Route::put('settings', [SchoolSettingController::class, 'bulkUpdate']);
                Route::put('settings/{key}', [SchoolSettingController::class, 'update']);

                // Academic Years
                Route::post('academic-years', [AcademicYearController::class, 'store']);
                Route::put('academic-years/{academicYear}', [AcademicYearController::class, 'update']);
                Route::delete('academic-years/{academicYear}', [AcademicYearController::class, 'destroy']);
                Route::post('academic-years/{academicYear}/activate', [AcademicYearController::class, 'activate']);
                Route::post('academic-years/{academicYear}/close', [AcademicYearController::class, 'close']);

                // School Levels
                Route::post('school-levels/{level}/toggle', [SchoolLevelController::class, 'toggle']);

                // Classes
                Route::post('classes', [ClasseController::class, 'store']);
                Route::post('classes/bulk', [ClasseController::class, 'bulkStore']);
                Route::put('classes/{classe}', [ClasseController::class, 'update']);
                Route::delete('classes/{classe}', [ClasseController::class, 'destroy']);
                Route::put('classes/{classe}/subjects', [ClasseController::class, 'syncSubjects']);

                // Subjects
                Route::post('subjects', [SubjectController::class, 'store']);
                Route::put('subjects/{subject}', [SubjectController::class, 'update']);
                Route::delete('subjects/{subject}', [SubjectController::class, 'destroy']);

                // Rooms
                Route::post('rooms', [RoomController::class, 'store']);
                Route::put('rooms/{room}', [RoomController::class, 'update']);
                Route::delete('rooms/{room}', [RoomController::class, 'destroy']);
            });

            // ── Users (Phase 3) ─────────────────────────────────
            Route::get('users', [UserController::class, 'index'])
                 ->middleware('can:users.view');
            Route::post('users', [UserController::class, 'store'])
                 ->middleware('can:users.create');
            Route::get('users/{user}', [UserController::class, 'show'])
                 ->middleware('can:users.view');
            Route::put('users/{user}', [UserController::class, 'update'])
                 ->middleware('can:users.edit');
            Route::delete('users/{user}', [UserController::class, 'destroy'])
                 ->middleware('can:users.delete');

            Route::post('users/{user}/activate', [UserController::class, 'activate'])
                 ->middleware('can:users.edit');
            Route::post('users/{user}/deactivate', [UserController::class, 'deactivate'])
                 ->middleware('can:users.edit');
            Route::post('users/{user}/suspend', [UserController::class, 'suspend'])
                 ->middleware('role:school_admin,director');
            Route::post('users/{user}/reset-password', [UserController::class, 'resetPassword'])
                 ->middleware('can:users.edit');
            Route::get('users/{user}/permissions', [UserController::class, 'permissions'])
                 ->middleware('can:users.view');

            // ── Invitations (Phase 3) ────────────────────────────
            Route::get('invitations', [InvitationController::class, 'index'])
                 ->middleware('can:users.invite');
            Route::post('invitations', [InvitationController::class, 'store'])
                 ->middleware('can:users.invite');
            Route::get('invitations/{invitation}', [InvitationController::class, 'show'])
                 ->middleware('can:users.invite');
            Route::post('invitations/{invitation}/resend', [InvitationController::class, 'resend'])
                 ->middleware('can:users.invite');
            Route::post('invitations/{invitation}/revoke', [InvitationController::class, 'revoke'])
                 ->middleware('can:users.invite');

            // ── Permissions & Rôles (Phase 3) ────────────────────
            Route::get('permissions/roles', [PermissionController::class, 'index'])
                 ->middleware('can:users.roles.manage');
            Route::put('permissions/roles/{roleName}', [PermissionController::class, 'updateRole'])
                 ->middleware('role:school_admin');
            Route::get('permissions/available', [PermissionController::class, 'availablePermissions'])
                 ->middleware('can:users.roles.manage');
        });
    });
});
