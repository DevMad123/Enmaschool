<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreSubjectRequest;
use App\Http\Requests\Tenant\UpdateSubjectRequest;
use App\Http\Resources\Tenant\SubjectResource;
use App\Models\Tenant\Subject;
use App\Services\Tenant\SubjectService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubjectController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SubjectService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $subjects = $this->service->list($request->all());

        return $this->paginated(
            $subjects->through(fn ($s) => new SubjectResource($s)),
        );
    }

    public function store(StoreSubjectRequest $request): JsonResponse
    {
        $subject = $this->service->create($request->validated());

        return $this->success(
            data: new SubjectResource($subject),
            message: 'Matière créée.',
            code: 201,
        );
    }

    public function show(Subject $subject): JsonResponse
    {
        return $this->success(data: new SubjectResource($subject));
    }

    public function update(UpdateSubjectRequest $request, Subject $subject): JsonResponse
    {
        $subject = $this->service->update($subject, $request->validated());

        return $this->success(
            data: new SubjectResource($subject),
            message: 'Matière mise à jour.',
        );
    }

    public function destroy(Subject $subject): JsonResponse
    {
        $this->service->delete($subject);

        return $this->success(message: 'Matière supprimée.');
    }
}
