<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant\Payment;
use App\Services\Tenant\PaymentService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateReceiptJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;
    public int $tries   = 3;

    public function __construct(
        public readonly int $paymentId,
    ) {
        $this->onQueue('fees');
    }

    public function handle(PaymentService $paymentService): void
    {
        $payment = Payment::find($this->paymentId);

        if (! $payment) {
            Log::warning("GenerateReceiptJob: paiement #{$this->paymentId} introuvable.");
            return;
        }

        try {
            $paymentService->generateReceipt($payment);
        } catch (\Throwable $e) {
            Log::error("GenerateReceiptJob: échec pour paiement #{$this->paymentId} : {$e->getMessage()}");
            throw $e;
        }
    }
}
