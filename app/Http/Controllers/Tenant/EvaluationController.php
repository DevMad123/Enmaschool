<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreEvaluationRequest;
use App\Http\Requests\Tenant\UpdateEvaluationRequest;
use App\Http\Resources\Tenant\EvaluationResource;
use App\Models\Tenant\Evaluation;
use App\Services\Tenant\EvaluationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly EvaluationService $service) {}

    public function index(Request $request): JsonResponse
    {
        $filters   = $request->only(['class_id', 'subject_id', 'period_id', 'academic_year_id', 'teacher_id', 'type', 'date_from', 'date_to', 'per_page']);
        $paginated = $this->service->list($filters);

        return $this->paginated($paginated->through(fn ($e) => new EvaluationResource($e)));
    }

    public function store(StoreEvaluationRequest $request): JsonResponse
    {
        try {
            $evaluation = $this->service->create($request->validated(), $request->user());

            return $this->success(new EvaluationResource($evaluation), '', 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }
    }

    public function show(Evaluation $evaluation): JsonResponse
    {
        $evaluation->load(['classe', 'subject', 'period', 'teacher', 'grades.student']);

        return $this->success(new EvaluationResource($evaluation));
    }

    public function update(UpdateEvaluationRequest $request, Evaluation $evaluation): JsonResponse
    {
        try {
            $updated = $this->service->update($evaluation, $request->validated());

            return $this->success(new EvaluationResource($updated));
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }
    }

    public function lock(Evaluation $evaluation): JsonResponse
    {
        $evaluation = $this->service->lock($evaluation);

        return $this->success(new EvaluationResource($evaluation));
    }

    public function publish(Evaluation $evaluation): JsonResponse
    {
        $evaluation = $this->service->publish($evaluation);

        return $this->success(new EvaluationResource($evaluation));
    }

    public function destroy(Evaluation $evaluation): JsonResponse
    {
        try {
            $this->service->delete($evaluation);

            return $this->success(null, '', 204);
        } catch (\Illuminate\Validation\ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }
    }
}
