<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Enums\StudentFeeStatus;
use App\Models\Tenant\StudentFee;
use App\Services\Tenant\NotificationService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class CheckOverduePaymentsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'scheduled';

    public function handle(NotificationService $notificationService): void
    {
        $fees = StudentFee::with(['enrollment.student', 'feeType'])
            ->whereIn('status', [StudentFeeStatus::Pending->value, StudentFeeStatus::Partial->value])
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->get();

        foreach ($fees as $fee) {
            $fee->status = StudentFeeStatus::Overdue;
            $fee->save();
            $notificationService->onPaymentOverdue($fee);
        }
    }
}
