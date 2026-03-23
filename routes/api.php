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
use App\Http\Controllers\Tenant\AssignmentController;
use App\Http\Controllers\Tenant\EnrollmentController;
use App\Http\Controllers\Tenant\ParentController;
use App\Http\Controllers\Tenant\StudentController;
use App\Http\Controllers\Tenant\TeacherController;
use App\Http\Controllers\Tenant\UserController;
use App\Http\Controllers\Tenant\EvaluationController;
use App\Http\Controllers\Tenant\GradeController;
use App\Http\Controllers\Tenant\ReportCardController;
use App\Http\Controllers\Tenant\AttendanceController;
use App\Http\Controllers\Tenant\JustificationController;
use App\Http\Controllers\Tenant\TimeSlotController;
use App\Http\Controllers\Tenant\TimetableController;
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

            // ── Élèves (Phase 4) ─────────────────────────────────
            Route::get('students/stats', [StudentController::class, 'stats'])
                 ->middleware('can:students.view');
            Route::get('students/import/template', [StudentController::class, 'exportTemplate'])
                 ->middleware('can:students.view');
            Route::post('students/import', [StudentController::class, 'import'])
                 ->middleware('can:students.import');
            Route::get('students/export', [StudentController::class, 'export'])
                 ->middleware('can:students.view');

            Route::get('students', [StudentController::class, 'index'])
                 ->middleware('can:students.view');
            Route::post('students', [StudentController::class, 'store'])
                 ->middleware('can:students.create');
            Route::get('students/{student}', [StudentController::class, 'show'])
                 ->middleware('can:students.view');
            Route::put('students/{student}', [StudentController::class, 'update'])
                 ->middleware('can:students.edit');
            Route::delete('students/{student}', [StudentController::class, 'destroy'])
                 ->middleware('can:students.delete');
            Route::get('students/{student}/parents', [StudentController::class, 'parents'])
                 ->middleware('can:students.view');
            Route::put('students/{student}/parents', [StudentController::class, 'syncParents'])
                 ->middleware('can:students.edit');

            // ── Inscriptions (Phase 4) ────────────────────────────
            Route::post('enrollments/bulk', [EnrollmentController::class, 'bulkStore'])
                 ->middleware('can:students.create');
            Route::get('enrollments', [EnrollmentController::class, 'index'])
                 ->middleware('can:students.view');
            Route::post('enrollments', [EnrollmentController::class, 'store'])
                 ->middleware('can:students.create');
            Route::get('enrollments/{enrollment}', [EnrollmentController::class, 'show'])
                 ->middleware('can:students.view');
            Route::post('enrollments/{enrollment}/transfer', [EnrollmentController::class, 'transfer'])
                 ->middleware('can:students.edit');
            Route::post('enrollments/{enrollment}/withdraw', [EnrollmentController::class, 'withdraw'])
                 ->middleware('can:students.edit');

            // ── Élèves par classe (Phase 4) ────────────────────────
            Route::get('classes/{classe}/students', [EnrollmentController::class, 'byClasse'])
                 ->middleware('can:students.view');

            // ── Parents (Phase 4) ──────────────────────────────────
            Route::get('parents', [ParentController::class, 'index'])
                 ->middleware('can:students.view');
            Route::post('parents', [ParentController::class, 'store'])
                 ->middleware('can:students.create');
            Route::get('parents/{parent}', [ParentController::class, 'show'])
                 ->middleware('can:students.view');
            Route::put('parents/{parent}', [ParentController::class, 'update'])
                 ->middleware('can:students.edit');
            Route::delete('parents/{parent}', [ParentController::class, 'destroy'])
                 ->middleware('can:students.delete');

            // ── Enseignants (Phase 5) ───────────────────────────────
            Route::get('teachers/stats', [TeacherController::class, 'stats'])
                 ->middleware('can:users.view');
            Route::get('teachers', [TeacherController::class, 'index'])
                 ->middleware('can:users.view');
            Route::post('teachers', [TeacherController::class, 'store'])
                 ->middleware('can:users.create');
            Route::get('teachers/{teacher}', [TeacherController::class, 'show'])
                 ->middleware('can:users.view');
            Route::put('teachers/{teacher}', [TeacherController::class, 'update'])
                 ->middleware('can:users.edit');
            Route::post('teachers/{teacher}/toggle', [TeacherController::class, 'toggle'])
                 ->middleware('can:users.edit');
            Route::get('teachers/{teacher}/workload', [TeacherController::class, 'workload'])
                 ->middleware('can:users.view');
            Route::get('teachers/{teacher}/subjects', [TeacherController::class, 'subjects'])
                 ->middleware('can:users.view');
            Route::put('teachers/{teacher}/subjects', [TeacherController::class, 'syncSubjects'])
                 ->middleware('can:users.edit');
            Route::get('teachers/{teacher}/assignments', [TeacherController::class, 'assignments'])
                 ->middleware('can:users.view');

            // ── Affectations (Phase 5) ──────────────────────────────
            Route::post('assignments/bulk', [AssignmentController::class, 'bulkStore'])
                 ->middleware('can:classes.manage');
            Route::get('assignments', [AssignmentController::class, 'index'])
                 ->middleware('can:classes.view');
            Route::post('assignments', [AssignmentController::class, 'store'])
                 ->middleware('can:classes.manage');
            Route::put('assignments/{assignment}', [AssignmentController::class, 'update'])
                 ->middleware('can:classes.manage');
            Route::delete('assignments/{assignment}', [AssignmentController::class, 'destroy'])
                 ->middleware('can:classes.manage');
            Route::post('assignments/{assignment}/unassign', [AssignmentController::class, 'unassign'])
                 ->middleware('can:classes.manage');

            // ── Affectations par classe (Phase 5) ──────────────────
            Route::get('classes/{classe}/assignments', [AssignmentController::class, 'byClasse'])
                 ->middleware('can:classes.view');
            Route::put('classes/{classe}/main-teacher', [AssignmentController::class, 'setMainTeacher'])
                 ->middleware('can:classes.manage');

            // ── Évaluations (Phase 6) ───────────────────────────────
            Route::apiResource('evaluations', EvaluationController::class);
            Route::post('evaluations/{evaluation}/lock', [EvaluationController::class, 'lock'])
                 ->middleware('can:grades.validate');
            Route::post('evaluations/{evaluation}/publish', [EvaluationController::class, 'publish'])
                 ->middleware('can:grades.validate');

            // ── Notes (Phase 6) ─────────────────────────────────────
            Route::get('grades/sheet', [GradeController::class, 'sheet'])
                 ->middleware('can:grades.view');
            Route::post('grades/bulk', [GradeController::class, 'bulkSave'])
                 ->middleware('can:grades.input');
            Route::post('grades/recalculate', [GradeController::class, 'recalculate'])
                 ->middleware('can:grades.validate');
            Route::get('grades/student/{student}', [GradeController::class, 'studentSummary'])
                 ->middleware('can:grades.view');
            Route::get('grades/class/{classe}', [GradeController::class, 'classSummary'])
                 ->middleware('can:grades.view');
            Route::put('grades/{grade}', [GradeController::class, 'saveOne'])
                 ->middleware('can:grades.input');

            // ── Moyennes (Phase 6) ──────────────────────────────────
            Route::get('period-averages', [GradeController::class, 'periodAverages'])
                 ->middleware('can:grades.view');

            // ── Bulletins Scolaires (Phase 7) ────────────────────────
            // Routes spécifiques avant le apiResource pour éviter les conflits
            Route::get('report-cards/class-stats', [ReportCardController::class, 'classStats'])
                 ->middleware('can:report_cards.view');
            Route::post('report-cards/class', [ReportCardController::class, 'initiateForClass'])
                 ->middleware('can:report_cards.generate');
            Route::post('report-cards/generate-class', [ReportCardController::class, 'generateForClass'])
                 ->middleware('can:report_cards.generate');
            Route::post('report-cards/publish-class', [ReportCardController::class, 'publishForClass'])
                 ->middleware('can:report_cards.publish');

            Route::apiResource('report-cards', ReportCardController::class)
                 ->only(['index', 'store', 'show', 'destroy']);
            Route::get('report-cards/{reportCard}/preview', [ReportCardController::class, 'preview'])
                 ->middleware('can:report_cards.view')
                 ->name('api.report-cards.preview');
            Route::put('report-cards/{reportCard}/council', [ReportCardController::class, 'updateCouncil'])
                 ->middleware('can:report_cards.generate');
            Route::put('report-cards/{reportCard}/appreciations', [ReportCardController::class, 'saveAppreciations'])
                 ->middleware('can:report_cards.generate');
            Route::post('report-cards/{reportCard}/generate', [ReportCardController::class, 'generate'])
                 ->middleware('can:report_cards.generate');
            Route::get('report-cards/{reportCard}/download', [ReportCardController::class, 'download'])
                 ->middleware('can:report_cards.view')
                 ->name('api.report-cards.download');
            Route::post('report-cards/{reportCard}/publish', [ReportCardController::class, 'publish'])
                 ->middleware('can:report_cards.publish');

            // ── Créneaux (Phase 8) ────────────────────────────────
            Route::get('time-slots', [TimeSlotController::class, 'index']);
            Route::middleware('role:school_admin,director')->group(function (): void {
                Route::post('time-slots', [TimeSlotController::class, 'store']);
                Route::put('time-slots/{timeSlot}', [TimeSlotController::class, 'update']);
                Route::delete('time-slots/{timeSlot}', [TimeSlotController::class, 'destroy']);
                Route::post('time-slots/{timeSlot}/toggle', [TimeSlotController::class, 'toggle']);
            });

            // ── Emploi du Temps (Phase 8) ─────────────────────────
            Route::get('timetable', [TimetableController::class, 'weekView'])
                 ->middleware('can:timetable.view');
            Route::get('timetable/pdf', [TimetableController::class, 'downloadPdf'])
                 ->middleware('can:timetable.view');
            Route::post('timetable/conflicts', [TimetableController::class, 'checkConflicts'])
                 ->middleware('can:timetable.view');
            Route::post('timetable/bulk', [TimetableController::class, 'bulkStore'])
                 ->middleware('can:timetable.manage');
            Route::post('timetable', [TimetableController::class, 'store'])
                 ->middleware('can:timetable.manage');
            Route::get('timetable/{timetableEntry}', [TimetableController::class, 'show'])
                 ->middleware('can:timetable.view');
            Route::put('timetable/{timetableEntry}', [TimetableController::class, 'update'])
                 ->middleware('can:timetable.manage');
            Route::delete('timetable/{timetableEntry}', [TimetableController::class, 'destroy'])
                 ->middleware('can:timetable.manage');

            // Overrides
            Route::get('timetable/{timetableEntry}/overrides', [TimetableController::class, 'overrides'])
                 ->middleware('can:timetable.view');
            Route::post('timetable/{timetableEntry}/overrides', [TimetableController::class, 'storeOverride'])
                 ->middleware('can:timetable.manage');
            Route::delete('timetable/overrides/{override}', [TimetableController::class, 'destroyOverride'])
                 ->middleware('can:timetable.manage');

            // ── Présences & Absences (Phase 9) ────────────────────
            Route::get('attendance/sheet', [AttendanceController::class, 'sheet'])
                 ->middleware('can:attendance.view');
            Route::post('attendance/record', [AttendanceController::class, 'record'])
                 ->middleware('can:attendance.input');

            Route::get('attendance/student/{enrollment}', [AttendanceController::class, 'studentStats'])
                 ->middleware('can:attendance.view');
            Route::get('attendance/student/{enrollment}/history', [AttendanceController::class, 'studentHistory'])
                 ->middleware('can:attendance.view');
            Route::get('attendance/class/{classe}', [AttendanceController::class, 'classStats'])
                 ->middleware('can:attendance.view');
            Route::get('attendance/class/{classe}/calendar', [AttendanceController::class, 'classCalendar'])
                 ->middleware('can:attendance.view');

            // Justifications
            Route::apiResource('justifications', JustificationController::class)
                 ->only(['index', 'store', 'show', 'destroy']);
            Route::post('justifications/{justification}/review', [JustificationController::class, 'review'])
                 ->middleware('can:attendance.reports');
        });
    });
});
