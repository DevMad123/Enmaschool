<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant\Enrollment;
use App\Services\Tenant\ReportCardService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateBulletinsJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 300;
    public int $tries   = 3;

    public function __construct(
        public readonly ?int   $classeId,
        public readonly ?int   $periodId,
        public readonly ?int   $yearId,
        public readonly string $type = 'period',
    ) {
        $this->onQueue('bulletins');
    }

    public function handle(ReportCardService $rcService): void
    {
        $query = Enrollment::with('student')->where('is_active', true);

        if ($this->classeId !== null) {
            $query->where('classe_id', $this->classeId);
        } elseif ($this->yearId !== null) {
            $query->where('academic_year_id', $this->yearId);
        }

        $enrollments = $query->get();

        foreach ($enrollments as $enrollment) {
            try {
                $rc = $rcService->initiate($enrollment->id, $this->periodId, $this->type);
                $rcService->generatePdf($rc);
            } catch (\Throwable $e) {
                Log::error("GenerateBulletinsJob: échec pour enrollment #{$enrollment->id} : {$e->getMessage()}");
            }
        }
    }
}
