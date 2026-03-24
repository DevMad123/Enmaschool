<?php
use App\Models\Central\Tenant;
use App\Models\Tenant\ReportCard;
use App\Models\Tenant\PeriodAverage;
use App\Models\Tenant\Grade;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Student;
use App\Models\Tenant\Evaluation;

Tenant::first()->run(function() {
    echo "=== TOUS LES ÉLÈVES ===\n";
    Student::all()->each(function($s) {
        echo "id={$s->id} | {$s->first_name} {$s->last_name} | {$s->matricule}\n";
    });

    echo "\n=== TOUS LES ENROLLMENTS ===\n";
    Enrollment::with(['student','classe'])->get()->each(function($e) {
        echo "enrollment id={$e->id} | student_id={$e->student_id} ({$e->student?->first_name} {$e->student?->last_name}) | classe={$e->classe?->display_name} | active=" . ($e->is_active ? 'Y' : 'N') . "\n";
    });

    echo "\n=== TOUS LES BULLETINS ===\n";
    ReportCard::with(['student','classe','period'])->get()->each(function($rc) {
        echo "rc id={$rc->id} | enrollment_id={$rc->enrollment_id} | student={$rc->student?->first_name} {$rc->student?->last_name} | classe={$rc->classe?->display_name} | period={$rc->period?->name} | status={$rc->status->value}\n";
    });

    echo "\n=== TOUTES LES NOTES ===\n";
    Grade::with(['student','evaluation.subject','evaluation.period','enrollment.classe'])->get()->each(function($g) {
        echo "grade id={$g->id} | student={$g->student?->first_name} {$g->student?->last_name} | enrollment_id={$g->enrollment_id} (classe={$g->enrollment?->classe?->display_name}) | subject={$g->evaluation?->subject?->name} | period={$g->evaluation?->period?->name} | note={$g->score}\n";
    });

    echo "\n=== PERIOD AVERAGES ===\n";
    PeriodAverage::with(['subject','period'])->get()->each(function($pa) {
        echo "pa id={$pa->id} | student_id={$pa->student_id} | enrollment_id={$pa->enrollment_id} | subject={$pa->subject?->name} | period={$pa->period?->name} | avg={$pa->average}\n";
    });

    echo "\n=== EVALUATIONS ===\n";
    Evaluation::with(['subject','period','classe'])->get()->each(function($e) {
        echo "eval id={$e->id} | subject={$e->subject?->name} | classe={$e->classe?->display_name} | period={$e->period?->name}\n";
    });
});
