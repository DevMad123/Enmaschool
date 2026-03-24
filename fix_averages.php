<?php
use App\Models\Central\Tenant;
use App\Models\Tenant\Grade;
use App\Models\Tenant\PeriodAverage;
use App\Services\Tenant\AverageCalculatorService;

Tenant::first()->run(function() {
    $service = app(AverageCalculatorService::class);

    // Trouver toutes les combinaisons (student_id, subject_id, period_id) qui ont des notes
    $combos = Grade::join('evaluations', 'grades.evaluation_id', '=', 'evaluations.id')
        ->whereNotNull('grades.score')
        ->whereNotNull('evaluations.period_id')
        ->select('grades.student_id', 'evaluations.subject_id', 'evaluations.period_id')
        ->distinct()
        ->get();

    echo count($combos) . " combinaisons (élève × matière × période) à recalculer\n\n";

    foreach ($combos as $c) {
        $pa = $service->calculatePeriodAverage($c->student_id, $c->subject_id, $c->period_id);
        $subj = \App\Models\Tenant\Subject::find($c->subject_id)?->name ?? 'subj#'.$c->subject_id;
        echo "  student_id={$c->student_id} | {$subj} | moy={$pa->average}\n";
    }

    // Supprimer les period_averages sans grade correspondant (données orphelines)
    $deleted = PeriodAverage::whereNull('subject_id')->orWhereNull('enrollment_id')->delete();
    echo "\n{$deleted} PA orphelines supprimées\n";

    echo "\n=== MOYENNES FINALES ===\n";
    PeriodAverage::with(['subject','period','enrollment.classe','enrollment.student'])->get()
        ->sortBy('enrollment.classe.display_name')
        ->each(function($pa) {
            $classe   = $pa->enrollment?->classe?->display_name ?? '?';
            $student  = trim(($pa->enrollment?->student?->first_name ?? '') . ' ' . ($pa->enrollment?->student?->last_name ?? ''));
            $subj     = $pa->subject?->name ?? 'NULL';
            $avg      = $pa->average ?? '—';
            echo "{$classe} | {$student} | {$subj} | {$pa->period?->name} | moy={$avg}\n";
        });
});
