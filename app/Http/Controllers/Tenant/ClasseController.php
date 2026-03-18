<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreBulkClassesRequest;
use App\Http\Requests\Tenant\StoreClasseRequest;
use App\Http\Requests\Tenant\UpdateClasseRequest;
use App\Http\Resources\Tenant\ClasseResource;
use App\Http\Resources\Tenant\SubjectResource;
use App\Models\Tenant\Classe;
use App\Services\Tenant\ClasseService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ClasseController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ClasseService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $classes = $this->service->list($request->all());

        return $this->paginated(
            $classes->through(fn ($c) => new ClasseResource($c)),
        );
    }

    public function store(StoreClasseRequest $request): JsonResponse
    {
        try {
            $classe = $this->service->create($request->validated());

            return $this->success(
                data: new ClasseResource($classe),
                message: "{$classe->display_name} créée avec succès.",
                code: 201,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function bulkStore(StoreBulkClassesRequest $request): JsonResponse
    {
        try {
            $classes = $this->service->bulkCreate($request->validated());

            return $this->success(
                data: ClasseResource::collection($classes),
                message: "{$classes->count()} classe(s) créée(s) avec succès.",
                code: 201,
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function show(Classe $classe): JsonResponse
    {
        $classe->load(['level', 'mainTeacher', 'room', 'subjects'])->loadCount('subjects');

        return $this->success(data: new ClasseResource($classe));
    }

    public function update(UpdateClasseRequest $request, Classe $classe): JsonResponse
    {
        try {
            $classe = $this->service->update($classe, $request->validated());

            return $this->success(
                data: new ClasseResource($classe),
                message: "{$classe->display_name} mise à jour.",
            );
        } catch (\InvalidArgumentException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function destroy(Classe $classe): JsonResponse
    {
        $name = $classe->display_name;
        $this->service->delete($classe);

        return $this->success(message: "{$name} supprimée.");
    }

    public function subjects(Classe $classe): JsonResponse
    {
        $subjects = $classe->subjects()->get();

        return $this->success(data: SubjectResource::collection($subjects));
    }

    public function syncSubjects(Request $request, Classe $classe): JsonResponse
    {
        $request->validate(['subject_ids' => 'required|array', 'subject_ids.*' => 'integer|exists:subjects,id']);

        $this->service->syncSubjects($classe, $request->input('subject_ids'));

        return $this->success(message: 'Matières synchronisées.');
    }

    public function options(): JsonResponse
    {
        return $this->success(data: [
            'sections' => $this->service->generateSectionOptions(),
            'series' => $this->service->generateSerieOptions(),
        ]);
    }
}
