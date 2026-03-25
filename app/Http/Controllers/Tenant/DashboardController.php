<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\AcademicDashboardResource;
use App\Http\Resources\Tenant\AttendanceDashboardResource;
use App\Http\Resources\Tenant\DirectionDashboardResource;
use App\Http\Resources\Tenant\FinancialDashboardResource;
use App\Http\Resources\Tenant\TeacherDashboardResource;
use App\Services\Tenant\DashboardService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly DashboardService $service,
    ) {}

    /**
     * GET /school/dashboard/direction
     * Rôles : school_admin, director
     */
    public function direction(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if ($yearId === 0) {
            $year = \App\Models\Tenant\AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id ?? 0;
        }

        if ($yearId === 0) {
            return $this->error('Aucune année scolaire trouvée.', 404);
        }

        $stats = $this->service->getDirectionStats($yearId);

        return $this->success(new DirectionDashboardResource($stats));
    }

    /**
     * GET /school/dashboard/academic
     */
    public function academic(Request $request): JsonResponse
    {
        $yearId   = (int) $request->input('year_id', 0);
        $periodId = $request->filled('period_id') ? (int) $request->input('period_id') : null;

        if ($yearId === 0) {
            $year = \App\Models\Tenant\AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id ?? 0;
        }

        if ($yearId === 0) {
            return $this->error('Aucune année scolaire trouvée.', 404);
        }

        $stats = $this->service->getAcademicStats($yearId, $periodId);

        return $this->success(new AcademicDashboardResource($stats));
    }

    /**
     * GET /school/dashboard/attendance
     */
    public function attendance(Request $request): JsonResponse
    {
        $yearId   = (int) $request->input('year_id', 0);
        $periodId = $request->filled('period_id') ? (int) $request->input('period_id') : null;
        $date     = $request->filled('date') ? Carbon::parse($request->input('date')) : null;

        if ($yearId === 0) {
            $year = \App\Models\Tenant\AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id ?? 0;
        }

        if ($yearId === 0) {
            return $this->error('Aucune année scolaire trouvée.', 404);
        }

        $stats = $this->service->getAttendanceStats($yearId, $periodId, $date);

        return $this->success(new AttendanceDashboardResource($stats));
    }

    /**
     * GET /school/dashboard/financial
     * Rôles : school_admin, director, accountant
     */
    public function financial(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if ($yearId === 0) {
            $year = \App\Models\Tenant\AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id ?? 0;
        }

        if ($yearId === 0) {
            return $this->error('Aucune année scolaire trouvée.', 404);
        }

        $stats = $this->service->getFinancialStats($yearId);

        return $this->success(new FinancialDashboardResource($stats));
    }

    /**
     * GET /school/dashboard/teacher
     * Filtré automatiquement sur le profil enseignant connecté.
     */
    public function teacher(Request $request): JsonResponse
    {
        $yearId  = (int) $request->input('year_id', 0);
        $teacher = $request->user()->teacher;

        if (! $teacher) {
            return $this->error('Profil enseignant introuvable.', 404);
        }

        if ($yearId === 0) {
            $year = \App\Models\Tenant\AcademicYear::where('is_current', true)->first();
            $yearId = $year?->id ?? 0;
        }

        if ($yearId === 0) {
            return $this->error('Aucune année scolaire trouvée.', 404);
        }

        $stats = $this->service->getTeacherDashboard($teacher->id, $yearId);

        return $this->success(new TeacherDashboardResource($stats));
    }

    /**
     * POST /school/dashboard/cache/invalidate
     * Rôle : school_admin
     */
    public function invalidateCache(): JsonResponse
    {
        $this->service->invalidateDashboardCache('all');

        return $this->success(null, 'Cache des dashboards vidé avec succès.');
    }
}
