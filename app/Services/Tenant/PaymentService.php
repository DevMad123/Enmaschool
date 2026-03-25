<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\InstallmentStatus;
use App\Jobs\GenerateReceiptJob;
use App\Models\Tenant\Payment;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\StudentFee;
use App\Models\Tenant\User;
use Carbon\Carbon;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\ValidationException;

class PaymentService
{
    public function __construct(
        private readonly PdfGeneratorService $pdfGenerator,
    ) {}

    // ── Enregistrement ─────────────────────────────────────────────────

    /**
     * Enregistre un versement et déclenche la génération du reçu PDF.
     */
    public function record(array $data, User $recordedBy): Payment
    {
        $studentFee = StudentFee::findOrFail($data['student_fee_id']);

        // Vérifications métier
        if ($studentFee->status->isSettled() && (float) $data['amount'] > 0) {
            if ($studentFee->status->value === 'waived') {
                throw ValidationException::withMessages([
                    'student_fee_id' => 'Ce frais a été exonéré — aucun paiement requis.',
                ]);
            }
        }

        $remaining = $studentFee->amount_remaining;
        if ((float) $data['amount'] > $remaining + 0.01) {
            throw ValidationException::withMessages([
                'amount' => "Le montant dépasse le solde restant dû (" . number_format($remaining, 0, ',', ' ') . " FCFA).",
            ]);
        }

        $payment = Payment::create([
            'student_fee_id'  => $studentFee->id,
            'enrollment_id'   => $studentFee->enrollment_id,
            'academic_year_id' => $studentFee->academic_year_id,
            'amount'          => $data['amount'],
            'payment_method'  => $data['payment_method'],
            'payment_date'    => $data['payment_date'],
            'reference'       => $data['reference'] ?? null,
            'notes'           => $data['notes'] ?? null,
            'recorded_by'     => $recordedBy->id,
        ]);

        // Recalcul du solde
        $studentFee->recalculateBalance();

        // Mise à jour des installments si existants
        $this->updateInstallments($studentFee, (float) $data['amount']);

        // Génération du reçu en arrière-plan
        GenerateReceiptJob::dispatch($payment->id);

        return $payment->fresh();
    }

    public function cancel(Payment $payment, string $reason, User $cancelledBy): Payment
    {
        if ($payment->is_cancelled) {
            throw ValidationException::withMessages([
                'payment' => 'Ce paiement est déjà annulé.',
            ]);
        }

        $payment->cancelled_at  = now()->toDateTimeString();
        $payment->cancelled_by  = $cancelledBy->id;
        $payment->cancel_reason = $reason;
        $payment->save();

        // Recalcul du solde du student_fee
        $payment->studentFee->recalculateBalance();

        // Suppression du PDF si existant
        if ($payment->pdf_path && Storage::disk('local')->exists($payment->pdf_path)) {
            Storage::disk('local')->delete($payment->pdf_path);
            $payment->pdf_path = null;
            $payment->save();
        }

        return $payment->fresh();
    }

    /**
     * Génère le reçu PDF pour un paiement et met à jour payment.pdf_path.
     */
    public function generateReceipt(Payment $payment): Payment
    {
        $payment->loadMissing([
            'studentFee.feeType',
            'enrollment.student',
            'enrollment.classe',
            'enrollment.academicYear',
            'recordedBy',
        ]);

        $school = [
            'name'     => SchoolSetting::get('school_name', 'École'),
            'logo_url' => SchoolSetting::get('school_logo_url'),
            'address'  => SchoolSetting::get('school_address', ''),
            'phone'    => SchoolSetting::get('school_phone', ''),
        ];
        $student  = $payment->enrollment->student;
        $classe   = $payment->enrollment->classe;
        $year     = $payment->enrollment->academicYear;
        $fee      = $payment->studentFee;

        // Montant payé avant CE versement
        $amountPreviouslyPaid = max(
            0,
            (float) $fee->amount_paid - (float) $payment->amount
        );

        $data = [
            'school'       => $school,
            'payment'      => [
                'receipt_number'       => $payment->receipt_number,
                'payment_date'         => $payment->payment_date->format('d/m/Y'),
                'payment_method_label' => $payment->payment_method->label(),
                'reference'            => $payment->reference,
                'recorded_by'          => $payment->recordedBy?->full_name ?? '—',
                'amount'               => (float) $payment->amount,
            ],
            'student'      => [
                'full_name' => $student->full_name,
                'matricule' => $student->matricule,
            ],
            'classe'       => [
                'display_name' => $classe->display_name,
            ],
            'academic_year' => [
                'name' => $year->name,
            ],
            'student_fee'  => [
                'fee_type_name'          => $fee->feeType->name,
                'amount_due'             => (float) $fee->amount_due,
                'amount_previously_paid' => $amountPreviouslyPaid,
                'amount_remaining'       => $fee->amount_remaining,
                'is_fully_paid'          => $fee->is_fully_paid,
            ],
            'generated_at' => now()->format('d/m/Y H:i'),
        ];

        $slug     = tenant('id') ?? 'school';
        $yearName = str_replace('/', '-', $year->name);
        $filePath = "tenant_{$slug}/receipts/{$yearName}/{$payment->receipt_number}.pdf";

        $this->pdfGenerator->generate('pdf.payment_receipt', $data, $filePath);

        $payment->pdf_path = $filePath;
        $payment->save();

        return $payment;
    }

    public function getHistory(int $enrollmentId, array $filters = []): LengthAwarePaginator
    {
        $query = Payment::with(['studentFee.feeType', 'recordedBy'])
            ->where('enrollment_id', $enrollmentId)
            ->orderByDesc('payment_date');

        if (! empty($filters['method'])) {
            $query->where('payment_method', $filters['method']);
        }

        return $query->paginate($filters['per_page'] ?? 15);
    }

    public function getDailyReport(Carbon $date): array
    {
        $payments = Payment::with(['studentFee.feeType', 'enrollment.student', 'recordedBy'])
            ->whereDate('payment_date', $date)
            ->whereNull('cancelled_at')
            ->orderBy('payment_date')
            ->get();

        $totalAmount = $payments->sum('amount');

        $byMethod = $payments->groupBy('payment_method')
            ->map(function ($group, $method) {
                return [
                    'method'       => $method,
                    'method_label' => \App\Enums\PaymentMethod::from($method)->label(),
                    'amount'       => $group->sum('amount'),
                    'count'        => $group->count(),
                ];
            })
            ->values()
            ->all();

        return [
            'date'             => $date->format('d/m/Y'),
            'total_amount'     => (float) $totalAmount,
            'payments_count'   => $payments->count(),
            'by_method'        => $byMethod,
            'payments'         => $payments,
        ];
    }

    public function getMonthlyReport(int $year, int $month): array
    {
        $payments = Payment::whereYear('payment_date', $year)
            ->whereMonth('payment_date', $month)
            ->whereNull('cancelled_at')
            ->get();

        $totalAmount = $payments->sum('amount');

        $byMethod = $payments->groupBy('payment_method')
            ->map(function ($group, $method) {
                return [
                    'method'       => $method,
                    'method_label' => \App\Enums\PaymentMethod::from($method)->label(),
                    'amount'       => $group->sum('amount'),
                    'count'        => $group->count(),
                ];
            })
            ->values()
            ->all();

        return [
            'year'           => $year,
            'month'          => $month,
            'total_amount'   => (float) $totalAmount,
            'payments_count' => $payments->count(),
            'by_method'      => $byMethod,
        ];
    }

    // ── Privé ──────────────────────────────────────────────────────────

    /**
     * Met à jour les tranches d'échéancier après un paiement.
     */
    private function updateInstallments(StudentFee $fee, float $amount): void
    {
        $installments = $fee->installments()
            ->where('status', '!=', InstallmentStatus::Paid->value)
            ->orderBy('installment_number')
            ->get();

        if ($installments->isEmpty()) {
            return;
        }

        $remaining = $amount;

        foreach ($installments as $installment) {
            if ($remaining <= 0) {
                break;
            }

            $due   = (float) $installment->amount_due - (float) $installment->amount_paid;
            $apply = min($remaining, $due);

            $installment->amount_paid = (float) $installment->amount_paid + $apply;
            $remaining -= $apply;

            if ($installment->amount_paid >= $installment->amount_due) {
                $installment->status  = InstallmentStatus::Paid;
                $installment->paid_at = now();
            }

            $installment->save();
        }
    }
}
