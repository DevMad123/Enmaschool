<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ApplyDiscountRequest;
use App\Http\Requests\Tenant\CreateInstallmentPlanRequest;
use App\Http\Resources\Tenant\PaymentInstallmentResource;
use App\Http\Resources\Tenant\StudentBalanceResource;
use App\Http\Resources\Tenant\StudentFeeResource;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\StudentFee;
use App\Services\Tenant\FeeService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentFeeController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly FeeService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = StudentFee::with(['feeType', 'enrollment.student'])
            ->orderByDesc('created_at');

        if ($request->filled('enrollment_id')) {
            $query->where('enrollment_id', $request->input('enrollment_id'));
        }
        if ($request->filled('year_id')) {
            $query->forYear((int) $request->input('year_id'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }
        if ($request->filled('class_id')) {
            $query->whereHas('enrollment', fn ($q) => $q->where('classe_id', $request->input('class_id')));
        }

        $perPage = min((int) $request->input('per_page', 20), 100);
        $fees    = $query->paginate($perPage);

        return $this->successResponse(StudentFeeResource::collection($fees)->response()->getData(true));
    }

    public function show(StudentFee $studentFee): JsonResponse
    {
        $studentFee->load(['feeType', 'payments.recordedBy', 'installments', 'enrollment.student']);

        return $this->successResponse(StudentFeeResource::make($studentFee));
    }

    public function balance(Enrollment $enrollment): JsonResponse
    {
        $balance = $this->service->getStudentBalance($enrollment->id);

        return $this->successResponse(StudentBalanceResource::make($balance));
    }

    public function applyDiscount(ApplyDiscountRequest $request, StudentFee $studentFee): JsonResponse
    {
        /** @var \App\Models\Tenant\User $user */
        $user    = $request->user();
        $validated = $request->validated();

        $fee = $this->service->applyDiscount(
            $studentFee,
            (float) $validated['amount'],
            $validated['reason'],
            $user,
        );

        return $this->successResponse(
            StudentFeeResource::make($fee->load('feeType')),
            'Remise appliquée.'
        );
    }

    public function waive(Request $request, StudentFee $studentFee): JsonResponse
    {
        $request->validate([
            'reason' => ['required', 'string', 'max:300'],
        ]);

        /** @var \App\Models\Tenant\User $user */
        $user = $request->user();
        $fee  = $this->service->waive($studentFee, $request->input('reason'), $user);

        return $this->successResponse(
            StudentFeeResource::make($fee->load('feeType')),
            'Frais exonéré.'
        );
    }

    public function installments(StudentFee $studentFee): JsonResponse
    {
        $installments = $studentFee->installments()->orderBy('installment_number')->get();

        return $this->successResponse(PaymentInstallmentResource::collection($installments));
    }

    public function setInstallments(CreateInstallmentPlanRequest $request, StudentFee $studentFee): JsonResponse
    {
        $installments = $this->service->createInstallmentPlan(
            $studentFee,
            $request->validated()['installments'],
        );

        return $this->successResponse(
            PaymentInstallmentResource::collection($installments),
            'Échéancier configuré.'
        );
    }
}
