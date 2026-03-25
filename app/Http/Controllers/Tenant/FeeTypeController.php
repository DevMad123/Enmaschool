<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreFeeTypeRequest;
use App\Http\Requests\Tenant\UpdateFeeTypeRequest;
use App\Http\Resources\Tenant\FeeTypeResource;
use App\Models\Tenant\FeeType;
use App\Services\Tenant\FeeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeeTypeController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly FeeService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $activeOnly = $request->boolean('active_only', true);
        $feeTypes   = $this->service->getFeeTypes($activeOnly);

        return $this->successResponse(FeeTypeResource::collection($feeTypes));
    }

    public function store(StoreFeeTypeRequest $request): JsonResponse
    {
        $feeType = $this->service->createFeeType($request->validated());

        return $this->successResponse(FeeTypeResource::make($feeType), 'Type de frais créé.', 201);
    }

    public function show(FeeType $feeType): JsonResponse
    {
        $feeType->loadCount('schedules');

        return $this->successResponse(FeeTypeResource::make($feeType));
    }

    public function update(UpdateFeeTypeRequest $request, FeeType $feeType): JsonResponse
    {
        $feeType = $this->service->updateFeeType($feeType, $request->validated());

        return $this->successResponse(FeeTypeResource::make($feeType), 'Type de frais mis à jour.');
    }

    public function destroy(FeeType $feeType): JsonResponse
    {
        $feeType->delete();

        return $this->successResponse(null, 'Type de frais supprimé.');
    }
}
