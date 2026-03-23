<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Tenant\AttendanceService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class UpdateReportCardAbsencesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int   $enrollmentId,
        public readonly array $reportCardIds,
    ) {
        $this->onQueue('attendances');
    }

    public function handle(AttendanceService $service): void
    {
        foreach ($this->reportCardIds as $reportCardId) {
            $service->updateReportCardAbsences($this->enrollmentId, $reportCardId);
        }
    }
}
