<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Jobs\GenerateYearSummaryJob;
use App\Services\Tenant\ReportService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Symfony\Component\HttpFoundation\StreamedResponse;

class ReportController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ReportService $service,
    ) {}

    // ── Exports Excel ────────────────────────────────────────────────────

    /**
     * GET /school/reports/students/export
     */
    public function exportStudents(Request $request): BinaryFileResponse
    {
        $yearId  = (int) $request->input('year_id');
        $filters = $request->only(['level_category', 'classe_id', 'status', 'gender']);

        return $this->service->exportStudents($yearId, $filters);
    }

    /**
     * GET /school/reports/results/export
     */
    public function exportResults(Request $request): BinaryFileResponse
    {
        $yearId   = (int) $request->input('year_id');
        $periodId = (int) $request->input('period_id');

        return $this->service->exportResults($yearId, $periodId);
    }

    /**
     * GET /school/reports/attendance/export
     */
    public function exportAttendance(Request $request): BinaryFileResponse
    {
        $yearId   = (int) $request->input('year_id');
        $periodId = $request->filled('period_id') ? (int) $request->input('period_id') : null;
        $classeId = $request->filled('classe_id') ? (int) $request->input('classe_id') : null;

        return $this->service->exportAttendance($yearId, $periodId, $classeId);
    }

    /**
     * GET /school/reports/payments/export
     */
    public function exportPayments(Request $request): BinaryFileResponse
    {
        $yearId  = (int) $request->input('year_id');
        $filters = $request->only(['date_from', 'date_to', 'method', 'status', 'class_id']);

        return $this->service->exportPayments($yearId, $filters);
    }

    // ── PDF ──────────────────────────────────────────────────────────────

    /**
     * POST /school/reports/class-results
     */
    public function generateClassResults(Request $request): StreamedResponse
    {
        $request->validate([
            'class_id'  => 'required|integer|exists:classes,id',
            'period_id' => 'required|integer|exists:periods,id',
        ]);

        $path = $this->service->generateClassResultsPdf(
            (int) $request->input('class_id'),
            (int) $request->input('period_id'),
        );

        return Storage::download($path, basename($path), [
            'Content-Type' => 'application/pdf',
        ]);
    }

    /**
     * POST /school/reports/year-summary
     */
    public function generateYearSummary(Request $request): JsonResponse
    {
        $request->validate([
            'year_id' => 'required|integer|exists:academic_years,id',
        ]);

        GenerateYearSummaryJob::dispatch(
            (int) $request->input('year_id'),
            $request->user()->id,
        );

        return $this->success(
            ['message' => 'Rapport en cours de génération. Vous serez notifié lorsqu\'il sera prêt.'],
            'Rapport en cours de génération.',
            202,
        );
    }
}
