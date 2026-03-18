<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreAcademicYearRequest;
use App\Http\Requests\Tenant\UpdateAcademicYearRequest;
use App\Http\Resources\Tenant\AcademicYearResource;
use App\Http\Resources\Tenant\PeriodResource;
use App\Models\Tenant\AcademicYear;
use App\Services\Tenant\AcademicYearService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AcademicYearController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AcademicYearService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $years = $this->service->list($request->all());

        return $this->paginated(
            $years->through(fn ($y) => new AcademicYearResource($y)),
        );
    }

    public function store(StoreAcademicYearRequest $request): JsonResponse
    {
        $year = $this->service->create($request->validated());

        return $this->success(
            data: new AcademicYearResource($year),
            message: 'Année scolaire créée.',
            code: 201,
        );
    }

    public function show(AcademicYear $academicYear): JsonResponse
    {
        $academicYear->load('periods');

        return $this->success(data: new AcademicYearResource($academicYear));
    }

    public function update(UpdateAcademicYearRequest $request, AcademicYear $academicYear): JsonResponse
    {
        $year = $this->service->update($academicYear, $request->validated());

        return $this->success(
            data: new AcademicYearResource($year),
            message: 'Année scolaire mise à jour.',
        );
    }

    public function destroy(AcademicYear $academicYear): JsonResponse
    {
        try {
            $this->service->delete($academicYear);

            return $this->success(message: 'Année scolaire supprimée.');
        } catch (\LogicException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function activate(AcademicYear $academicYear): JsonResponse
    {
        try {
            $year = $this->service->activate($academicYear);

            return $this->success(
                data: new AcademicYearResource($year),
                message: 'Année scolaire activée.',
            );
        } catch (\LogicException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function close(AcademicYear $academicYear): JsonResponse
    {
        $year = $this->service->close($academicYear);

        return $this->success(
            data: new AcademicYearResource($year),
            message: 'Année scolaire clôturée.',
        );
    }

    public function periods(AcademicYear $academicYear): JsonResponse
    {
        return $this->success(
            data: PeriodResource::collection($academicYear->periods),
        );
    }
}
