<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant\Enrollment;
use App\Services\Tenant\FeeService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class GenerateStudentFeesJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $timeout = 60;
    public int $tries   = 3;

    public function __construct(
        public readonly int $enrollmentId,
    ) {
        $this->onQueue('fees');
    }

    public function handle(FeeService $feeService): void
    {
        $enrollment = Enrollment::with('classe.schoolLevel')->find($this->enrollmentId);

        if (! $enrollment) {
            Log::warning("GenerateStudentFeesJob: enrollment #{$this->enrollmentId} introuvable.");
            return;
        }

        try {
            $feeService->generateForEnrollment($enrollment);
        } catch (\Throwable $e) {
            Log::error("GenerateStudentFeesJob: échec pour enrollment #{$this->enrollmentId} : {$e->getMessage()}");
            throw $e;
        }
    }
}
