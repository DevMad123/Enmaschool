<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\BulkSetSchedulesRequest;
use App\Http\Requests\Tenant\SetFeeScheduleRequest;
use App\Http\Resources\Tenant\FeeScheduleResource;
use App\Services\Tenant\FeeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeScheduleController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly FeeService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->errorResponse('Le paramètre year_id est requis.', 422);
        }

        $schedules = $this->service->getFeeSchedules($yearId);

        // Aplatir la collection groupée pour la sérialisation
        $flat = $schedules->flatten();

        return $this->successResponse(FeeScheduleResource::collection($flat));
    }

    public function set(SetFeeScheduleRequest $request): JsonResponse
    {
        $schedule = $this->service->setFeeSchedule($request->validated());

        return $this->successResponse(
            FeeScheduleResource::make($schedule->load(['feeType', 'schoolLevel', 'academicYear'])),
            'Tarif enregistré.'
        );
    }

    public function bulkSet(BulkSetSchedulesRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $this->service->bulkSetSchedules($validated['academic_year_id'], $validated['schedules']);

        return $this->successResponse(null, 'Grille tarifaire mise à jour.');
    }

    public function copyFromYear(Request $request): JsonResponse
    {
        $request->validate([
            'from_year_id' => ['required', 'integer', 'exists:academic_years,id'],
            'to_year_id'   => ['required', 'integer', 'exists:academic_years,id', 'different:from_year_id'],
        ]);

        $count = $this->service->copySchedulesFromYear(
            (int) $request->input('from_year_id'),
            (int) $request->input('to_year_id'),
        );

        return $this->successResponse(['copied' => $count], "{$count} tarif(s) copié(s).");
    }
}
