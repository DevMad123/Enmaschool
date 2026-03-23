<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\StoreTeacherRequest;
use App\Http\Requests\Tenant\UpdateTeacherRequest;
use App\Http\Resources\Tenant\TeacherClassResource;
use App\Http\Resources\Tenant\TeacherListResource;
use App\Http\Resources\Tenant\TeacherResource;
use App\Http\Resources\Tenant\TeacherWorkloadResource;
use App\Http\Resources\Tenant\SubjectResource;
use App\Models\Tenant\Teacher;
use App\Services\Tenant\AssignmentService;
use App\Services\Tenant\TeacherService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TeacherController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly TeacherService    $service,
        private readonly AssignmentService $assignmentService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $teachers = $this->service->list($request->all());

        return $this->paginated(
            $teachers->through(fn ($t) => new TeacherListResource($t))
        );
    }

    public function store(StoreTeacherRequest $request): JsonResponse
    {
        try {
            $teacher = $this->service->create($request->validated());

            return $this->created(new TeacherResource($teacher));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function show(Teacher $teacher): JsonResponse
    {
        $teacher->load([
            'user',
            'subjects',
            'assignments.classe.level',
            'assignments.subject',
            'assignments.academicYear',
        ]);

        return $this->success(new TeacherResource($teacher));
    }

    public function update(UpdateTeacherRequest $request, Teacher $teacher): JsonResponse
    {
        try {
            $updated = $this->service->update($teacher, $request->validated());

            return $this->success(new TeacherResource($updated));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function workload(Request $request, Teacher $teacher): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->error('Le paramètre year_id est requis.', 422);
        }

        $workload = $this->service->getWorkload($teacher, $yearId);
        $workload['teacher_id'] = $teacher->id;

        return $this->success(new TeacherWorkloadResource($workload));
    }

    public function subjects(Teacher $teacher): JsonResponse
    {
        $teacher->load('subjects');

        return $this->success(SubjectResource::collection($teacher->subjects));
    }

    public function syncSubjects(Request $request, Teacher $teacher): JsonResponse
    {
        $validated = $request->validate([
            'subject_ids'        => ['required', 'array'],
            'subject_ids.*'      => ['integer', 'exists:subjects,id'],
            'primary_subject_id' => ['nullable', 'integer', 'exists:subjects,id'],
        ]);

        $this->service->syncSubjects(
            $teacher,
            $validated['subject_ids'],
            $validated['primary_subject_id'] ?? null
        );

        $teacher->load('subjects');

        return $this->success(SubjectResource::collection($teacher->subjects));
    }

    public function assignments(Request $request, Teacher $teacher): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->error('Le paramètre year_id est requis.', 422);
        }

        $data = $this->assignmentService->listByTeacher($teacher->id, $yearId);

        return $this->success([
            'assignments' => TeacherClassResource::collection($data['assignments']),
            'total_hours' => $data['total_hours'],
        ]);
    }

    public function toggle(Teacher $teacher): JsonResponse
    {
        $teacher->update(['is_active' => ! $teacher->is_active]);

        return $this->success(
            data: new TeacherResource($teacher->fresh()->load('user', 'subjects')),
            message: $teacher->fresh()->is_active ? 'Enseignant activé.' : 'Enseignant désactivé.',
        );
    }

    public function stats(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->error('Le paramètre year_id est requis.', 422);
        }

        return $this->success($this->service->getStats($yearId));
    }
}
