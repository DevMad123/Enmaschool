<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Services\Tenant\AverageCalculatorService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class RecalculatePeriodAverageJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public function __construct(
        public readonly int|null $studentId,
        public readonly int $subjectId,
        public readonly int $periodId,
        public readonly int $classeId,
    ) {
        $this->onQueue('averages');
    }

    public function handle(AverageCalculatorService $calculator): void
    {
        if ($this->studentId !== null) {
            // Single student
            try {
                $periodAvg = $calculator->calculatePeriodAverage(
                    $this->studentId,
                    $this->subjectId,
                    $this->periodId,
                );

                $calculator->calculateSubjectAnnualAverage(
                    $this->studentId,
                    $this->subjectId,
                    $periodAvg->academic_year_id,
                );
            } catch (\Throwable $e) {
                Log::error("RecalculatePeriodAverageJob failed for student {$this->studentId}: {$e->getMessage()}");
                throw $e;
            }
        } else {
            // Whole class — dispatch individual jobs per student
            $calculator->calculateAllPeriodAverages($this->classeId, $this->periodId);
        }
    }
}
