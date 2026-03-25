<?php

declare(strict_types=1);

namespace App\Observers;

use App\Jobs\GenerateStudentFeesJob;
use App\Models\Tenant\Enrollment;

class EnrollmentObserver
{
    /**
     * Quand un Enrollment est créé, on génère automatiquement les frais de l'élève.
     */
    public function created(Enrollment $enrollment): void
    {
        GenerateStudentFeesJob::dispatch($enrollment->id);
    }
}
