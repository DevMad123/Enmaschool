<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ReviewJustificationRequest;
use App\Http\Requests\Tenant\SubmitJustificationRequest;
use App\Http\Resources\Tenant\AbsenceJustificationResource;
use App\Models\Tenant\AbsenceJustification;
use App\Models\Tenant\Enrollment;
use App\Services\Tenant\AttendanceService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class JustificationController extends Controller
{
    use ApiResponse;

    public function __construct(private readonly AttendanceService $service) {}

    /**
     * GET /school/justifications
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $request->validate([
            'status'        => ['nullable', 'in:pending,approved,rejected'],
            'enrollment_id' => ['nullable', 'exists:enrollments,id'],
            'class_id'      => ['nullable', 'exists:classes,id'],
            'date_from'     => ['nullable', 'date'],
            'date_to'       => ['nullable', 'date'],
            'per_page'      => ['nullable', 'integer', 'min:5', 'max:100'],
        ]);

        $query = AbsenceJustification::with(['enrollment.student', 'reviewedBy', 'submittedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }
        if ($request->filled('enrollment_id')) {
            $query->forEnrollment($request->integer('enrollment_id'));
        }
        if ($request->filled('class_id')) {
            $query->whereHas('enrollment', fn ($q) =>
                $q->where('classe_id', $request->integer('class_id'))
            );
        }
        if ($request->filled('date_from')) {
            $query->where('date_from', '>=', $request->date_from);
        }
        if ($request->filled('date_to')) {
            $query->where('date_to', '<=', $request->date_to);
        }

        $perPage = $request->integer('per_page', 20);

        return AbsenceJustificationResource::collection(
            $query->latest()->paginate($perPage)
        );
    }

    /**
     * POST /school/justifications
     */
    public function store(SubmitJustificationRequest $request): JsonResponse
    {
        $data    = $request->validated();
        $user    = $request->user();

        if ($request->hasFile('document')) {
            $data['document'] = $request->file('document');
        }

        $justification = $this->service->submitJustification($data, $user);
        $justification->load(['enrollment.student', 'submittedBy']);

        return $this->success(new AbsenceJustificationResource($justification), 201);
    }

    /**
     * GET /school/justifications/{justification}
     */
    public function show(AbsenceJustification $justification): JsonResponse
    {
        $justification->load(['enrollment.student', 'reviewedBy', 'submittedBy', 'attendances']);

        return $this->success(new AbsenceJustificationResource($justification));
    }

    /**
     * POST /school/justifications/{justification}/review
     */
    public function review(ReviewJustificationRequest $request, AbsenceJustification $justification): JsonResponse
    {
        $data   = $request->validated();
        $user   = $request->user();
        $action = $data['action'];
        $note   = $data['review_note'] ?? '';

        if ($action === 'approve') {
            $justification = $this->service->approveJustification($justification, $user, $note);
        } else {
            $justification = $this->service->rejectJustification($justification, $user, $note);
        }

        $justification->load(['enrollment.student', 'reviewedBy', 'submittedBy']);

        return $this->success(new AbsenceJustificationResource($justification));
    }

    /**
     * DELETE /school/justifications/{justification}
     */
    public function destroy(AbsenceJustification $justification): JsonResponse
    {
        if (! $justification->status->value === 'pending') {
            return $this->error('Seules les justifications en attente peuvent être supprimées.', 422);
        }

        $justification->delete();

        return $this->success(null);
    }
}
