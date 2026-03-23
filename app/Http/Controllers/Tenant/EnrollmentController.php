<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\BulkEnrollRequest;
use App\Http\Requests\Tenant\EnrollStudentRequest;
use App\Http\Requests\Tenant\TransferStudentRequest;
use App\Http\Resources\Tenant\EnrollmentResource;
use App\Http\Resources\Tenant\StudentListResource;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Services\Tenant\EnrollmentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EnrollmentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly EnrollmentService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Enrollment::with(['student', 'classe.level', 'academicYear']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->filled('classe_id')) {
            $query->where('classe_id', $request->input('classe_id'));
        }
        if ($request->filled('academic_year_id')) {
            $query->where('academic_year_id', $request->input('academic_year_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $enrollments = $query->latest()->paginate(25);

        return $this->paginated(
            $enrollments->through(fn ($e) => new EnrollmentResource($e)),
        );
    }

    public function store(EnrollStudentRequest $request): JsonResponse
    {
        try {
            $data = $request->validated();
            $data['created_by'] = $request->user()?->id;

            $enrollment = $this->service->enroll($data);

            return $this->created(new EnrollmentResource($enrollment));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function bulkStore(BulkEnrollRequest $request): JsonResponse
    {
        $result = $this->service->bulkEnroll(
            (int) $request->input('classe_id'),
            $request->input('student_ids'),
            (int) $request->input('academic_year_id'),
            $request->input('enrollment_date'),
        );

        return $this->success($result);
    }

    public function show(Enrollment $enrollment): JsonResponse
    {
        $enrollment->load(['student', 'classe.level', 'academicYear', 'transferredFromClasse']);

        return $this->success(new EnrollmentResource($enrollment));
    }

    public function transfer(TransferStudentRequest $request, Enrollment $enrollment): JsonResponse
    {
        try {
            $newEnrollment = $this->service->transfer(
                $enrollment,
                (int) $request->input('new_classe_id'),
                $request->input('note', ''),
            );

            return $this->created(new EnrollmentResource($newEnrollment));
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function withdraw(Request $request, Enrollment $enrollment): JsonResponse
    {
        $request->validate(['reason' => ['required', 'string', 'max:500']]);

        $updated = $this->service->withdraw($enrollment, $request->input('reason'));

        return $this->success(new EnrollmentResource($updated));
    }

    public function byClasse(Request $request, Classe $classe): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            // Essaie de récupérer l'année active
            $yearId = \App\Models\Tenant\AcademicYear::where('status', 'active')->value('id') ?? 0;
        }

        if (! $yearId) {
            return $this->error("Le paramètre year_id est requis.", 422);
        }

        $enrollments = $this->service->getByClasse($classe->id, $yearId);

        return $this->success(
            StudentListResource::collection($enrollments->map->student)->values()
        );
    }
}
