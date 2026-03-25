<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\CancelPaymentRequest;
use App\Http\Requests\Tenant\RecordPaymentRequest;
use App\Http\Resources\Tenant\ClassPaymentSummaryResource;
use App\Http\Resources\Tenant\PaymentDailyReportResource;
use App\Http\Resources\Tenant\PaymentResource;
use App\Models\Tenant\AcademicYear;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Payment;
use App\Services\Tenant\FeeService;
use App\Services\Tenant\PaymentService;
use App\Traits\ApiResponse;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Storage;

class PaymentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly PaymentService $service,
        private readonly FeeService     $feeService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = Payment::with(['studentFee.feeType', 'enrollment.student', 'recordedBy'])
            ->orderByDesc('payment_date');

        if ($request->filled('enrollment_id')) {
            $query->where('enrollment_id', $request->input('enrollment_id'));
        }
        if ($request->filled('year_id')) {
            $query->forYear((int) $request->input('year_id'));
        }
        if ($request->filled('method')) {
            $query->where('payment_method', $request->input('method'));
        }
        if ($request->filled('class_id')) {
            $query->whereHas('enrollment', fn ($q) => $q->where('classe_id', $request->input('class_id')));
        }
        if ($request->filled('date_from') && $request->filled('date_to')) {
            $query->betweenDates($request->input('date_from'), $request->input('date_to'));
        }

        $perPage  = min((int) $request->input('per_page', 20), 100);
        $payments = $query->paginate($perPage);

        return $this->paginated(
            $payments->through(fn ($p) => new PaymentResource($p)),
        );
    }

    public function store(RecordPaymentRequest $request): JsonResponse
    {
        /** @var \App\Models\Tenant\User $user */
        $user    = $request->user();
        $payment = $this->service->record($request->validated(), $user);

        return $this->successResponse(
            PaymentResource::make($payment->load(['studentFee.feeType', 'recordedBy'])),
            'Paiement enregistré. Le reçu est en cours de génération.',
            201
        );
    }

    public function show(Payment $payment): JsonResponse
    {
        $payment->load(['studentFee.feeType', 'enrollment.student', 'recordedBy']);

        return $this->successResponse(PaymentResource::make($payment));
    }

    public function cancel(CancelPaymentRequest $request, Payment $payment): JsonResponse
    {
        /** @var \App\Models\Tenant\User $user */
        $user    = $request->user();
        $payment = $this->service->cancel($payment, $request->input('reason'), $user);

        return $this->successResponse(PaymentResource::make($payment), 'Paiement annulé.');
    }

    public function download(Payment $payment): Response
    {
        if (! $payment->pdf_path || ! Storage::disk('local')->exists($payment->pdf_path)) {
            abort(404, 'Le reçu PDF n\'est pas encore disponible.');
        }

        $content  = Storage::disk('local')->get($payment->pdf_path);
        $filename = "recu-{$payment->receipt_number}.pdf";

        return response($content, 200, [
            'Content-Type'        => 'application/pdf',
            'Content-Disposition' => "inline; filename=\"{$filename}\"",
        ]);
    }

    public function dailyReport(Request $request): JsonResponse
    {
        $date   = $request->filled('date') ? Carbon::parse($request->input('date')) : now();
        $report = $this->service->getDailyReport($date);

        return $this->successResponse(PaymentDailyReportResource::make($report));
    }

    public function monthlyReport(Request $request): JsonResponse
    {
        $year  = (int) $request->input('year', now()->year);
        $month = (int) $request->input('month', now()->month);

        return $this->successResponse($this->service->getMonthlyReport($year, $month));
    }

    public function classSummary(Request $request, Classe $classe): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            // Utiliser l'année courante par défaut
            $year   = AcademicYear::where('is_current', true)->firstOrFail();
            $yearId = $year->id;
        } else {
            $year = AcademicYear::findOrFail($yearId);
        }

        $summary = $this->feeService->getClassPaymentSummary($classe->id, $yearId);

        return $this->successResponse(ClassPaymentSummaryResource::make([
            'summary' => $summary,
            'classe'  => $classe,
            'year'    => $year,
        ]));
    }

    public function yearStats(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            $year   = AcademicYear::where('is_current', true)->firstOrFail();
            $yearId = $year->id;
        }

        $stats = $this->feeService->getYearStats($yearId);

        return $this->successResponse($stats);
    }
}
