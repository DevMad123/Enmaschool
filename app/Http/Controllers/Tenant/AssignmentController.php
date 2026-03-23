<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\AssignTeacherRequest;
use App\Http\Requests\Tenant\BulkAssignRequest;
use App\Http\Requests\Tenant\SetMainTeacherRequest;
use App\Http\Resources\Tenant\ClassAssignmentsResource;
use App\Http\Resources\Tenant\ClasseResource;
use App\Http\Resources\Tenant\TeacherClassResource;
use App\Models\Tenant\Classe;
use App\Models\Tenant\TeacherClass;
use App\Services\Tenant\AssignmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AssignmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly AssignmentService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = TeacherClass::query()
            ->with(['teacher.user', 'classe', 'subject', 'academicYear']);

        if ($request->filled('year_id')) {
            $query->where('academic_year_id', (int) $request->input('year_id'));
        }

        if ($request->filled('classe_id')) {
            $query->where('class_id', (int) $request->input('classe_id'));
        }

        if ($request->filled('teacher_id')) {
            $query->where('teacher_id', (int) $request->input('teacher_id'));
        }

        if ($request->filled('is_active')) {
            $query->where('is_active', (bool) $request->input('is_active'));
        }

        $assignments = $query->orderBy('is_active', 'desc')->paginate(25);

        return $this->paginated(
            $assignments->through(fn ($a) => new TeacherClassResource($a))
        );
    }

    public function store(AssignTeacherRequest $request): JsonResponse
    {
        try {
            $result = $this->service->assign($request->validated());

            $resource = new TeacherClassResource($result['assignment']);
            $resource->warning = $result['warning'];

            return $this->created($resource);
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function update(Request $request, TeacherClass $assignment): JsonResponse
    {
        $data    = $request->only(['hours_per_week', 'notes', 'assigned_at']);
        $updated = $this->service->update($assignment, $data);

        return $this->success(new TeacherClassResource($updated));
    }

    public function bulkStore(BulkAssignRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $result = $this->service->bulkAssign(
            (int) $validated['teacher_id'],
            $validated['assignments'],
            (int) $validated['academic_year_id']
        );

        return $this->success($result, 201);
    }

    public function destroy(TeacherClass $assignment): JsonResponse
    {
        $this->service->unassign($assignment);

        return $this->success(['message' => 'Affectation désactivée.']);
    }

    public function unassign(TeacherClass $assignment): JsonResponse
    {
        $updated = $this->service->unassign($assignment);

        return $this->success(new TeacherClassResource($updated));
    }

    public function byClasse(Request $request, Classe $classe): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->error('Le paramètre year_id est requis.', 422);
        }

        $data = $this->service->listByClasse($classe->id, $yearId);

        $classe->load('level');

        return $this->success(new ClassAssignmentsResource([
            'classe'              => $classe,
            'assignments'         => $data['assignments'],
            'unassigned_subjects' => $data['unassigned_subjects'],
        ]));
    }

    public function setMainTeacher(SetMainTeacherRequest $request, Classe $classe): JsonResponse
    {
        try {
            $updated = $this->service->setMainTeacher(
                $classe->id,
                (int) $request->validated('teacher_id')
            );

            $updated->load('level', 'mainTeacher');

            return $this->success(new ClasseResource($updated));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
