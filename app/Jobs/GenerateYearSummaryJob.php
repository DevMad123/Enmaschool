<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Tenant\NotificationService;
use App\Services\Tenant\ReportService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateYearSummaryJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;

    public function __construct(
        private readonly int $yearId,
        private readonly int $requestedByUserId,
    ) {
        $this->onQueue('reports');
    }

    public function handle(ReportService $reportService, NotificationService $notifyService): void
    {
        try {
            $path = $reportService->generateYearSummaryPdf($this->yearId);

            $downloadUrl = route('api.reports.year-summary.download', ['path' => base64_encode($path)]);

            $notifyService->notify(
                userId: $this->requestedByUserId,
                type:   'report_ready',
                data:   ['download_url' => $downloadUrl, 'path' => $path],
            );
        } catch (\Throwable $e) {
            Log::error('GenerateYearSummaryJob failed', [
                'year_id' => $this->yearId,
                'user_id' => $this->requestedByUserId,
                'error'   => $e->getMessage(),
            ]);

            throw $e;
        }
    }
}
