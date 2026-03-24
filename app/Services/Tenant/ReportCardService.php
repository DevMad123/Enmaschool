<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\ReportCardStatus;
use App\Enums\ReportCardType;
use App\Jobs\GenerateBulletinsJob;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\ReportCard;
use App\Models\Tenant\ReportCardAppreciation;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\User;
use Illuminate\Support\Collection;
use Illuminate\Validation\ValidationException;

class ReportCardService
{
    public function __construct(
        private readonly PdfGeneratorService $pdfGenerator,
    ) {}

    // ── Gestion des bulletins ──────────────────────────────────────────────

    public function initiate(int $enrollmentId, ?int $periodId = null, string $type = 'period'): ReportCard
    {
        $enrollment = Enrollment::with(['student', 'classe.mainTeacher.user', 'academicYear'])->findOrFail($enrollmentId);

        return ReportCard::updateOrCreate(
            [
                'enrollment_id' => $enrollment->id,
                'period_id'     => $periodId,
                'type'          => $type,
            ],
            [
                'student_id'      => $enrollment->student_id,
                'class_id'        => $enrollment->classe_id,
                'academic_year_id' => $enrollment->academic_year_id,
                'status'          => ReportCardStatus::Draft->value,
            ],
        );
    }

    public function initiateForClass(int $classeId, ?int $periodId = null, string $type = 'period'): Collection
    {
        $enrollments = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->get();

        $created = collect();
        foreach ($enrollments as $enrollment) {
            $rc = $this->initiate($enrollment->id, $periodId, $type);
            $created->push($rc);
        }

        return $created;
    }

    public function updateCouncilData(ReportCard $rc, array $data): ReportCard
    {
        if (! $rc->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Ce bulletin ne peut plus être modifié.',
            ]);
        }

        $rc->update([
            'general_appreciation' => $data['general_appreciation'] ?? $rc->general_appreciation,
            'council_decision'     => $data['council_decision'] ?? $rc->council_decision?->value,
            'honor_mention'        => $data['honor_mention'] ?? $rc->honor_mention?->value,
            'absences_justified'   => $data['absences_justified'] ?? $rc->absences_justified,
            'absences_unjustified' => $data['absences_unjustified'] ?? $rc->absences_unjustified,
        ]);

        return $rc->fresh();
    }

    public function saveAppreciation(ReportCard $rc, int $subjectId, string $text, User $by): ReportCardAppreciation
    {
        if (! $rc->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Ce bulletin ne peut plus être modifié.',
            ]);
        }

        return ReportCardAppreciation::updateOrCreate(
            [
                'report_card_id' => $rc->id,
                'subject_id'     => $subjectId,
            ],
            [
                'appreciation' => $text,
                'entered_by'   => $by->id,
            ],
        );
    }

    public function bulkSaveAppreciations(ReportCard $rc, array $appreciations, User $by): void
    {
        if (! $rc->isEditable()) {
            throw ValidationException::withMessages([
                'status' => 'Ce bulletin ne peut plus être modifié.',
            ]);
        }

        foreach ($appreciations as $entry) {
            ReportCardAppreciation::updateOrCreate(
                [
                    'report_card_id' => $rc->id,
                    'subject_id'     => $entry['subject_id'],
                ],
                [
                    'appreciation' => $entry['appreciation'],
                    'entered_by'   => $by->id,
                ],
            );
        }
    }

    // ── Génération PDF ─────────────────────────────────────────────────────

    public function generatePdf(ReportCard $rc): ReportCard
    {
        $data = $this->collectBulletinData($rc);

        $periodSlug = $rc->period ? 'trim-' . $rc->period->order : 'annuel';
        $yearName   = $rc->academicYear->name ?? 'annee';
        $matricule  = $rc->student->matricule ?? 'inconnu';

        $tenantSlug = tenant('id') ?? 'school';
        $path = "tenant_{$tenantSlug}/bulletins/{$yearName}/{$periodSlug}/{$matricule}.pdf";

        $savedPath = $this->pdfGenerator->generate('pdf.report_card', $data, $path);

        $rc->update([
            'pdf_path'         => $savedPath,
            'pdf_generated_at' => now(),
            'pdf_hash'         => hash_file('sha256', storage_path("app/{$savedPath}")),
            'status'           => ReportCardStatus::Generated->value,
            // Snapshot des stats
            'general_average'  => $data['stats']['general_average'],
            'general_rank'     => $data['stats']['general_rank'],
            'class_size'       => $data['stats']['class_size'],
            'class_average'    => $data['stats']['class_average'],
        ]);

        return $rc->fresh();
    }

    public function generateForClass(int $classeId, ?int $periodId = null, string $type = 'period'): void
    {
        GenerateBulletinsJob::dispatch($classeId, $periodId, null, $type);
    }

    public function generateForYear(int $yearId, ?int $periodId = null): void
    {
        GenerateBulletinsJob::dispatch(null, $periodId, $yearId, 'period');
    }

    public function publish(ReportCard $rc, User $publishedBy): ReportCard
    {
        if (! $rc->hasPdf()) {
            throw ValidationException::withMessages([
                'pdf' => 'Le PDF doit être généré avant la publication.',
            ]);
        }

        $rc->update([
            'status'       => ReportCardStatus::Published->value,
            'published_by' => $publishedBy->id,
            'published_at' => now(),
        ]);

        return $rc->fresh();
    }

    public function publishForClass(int $classeId, int $periodId): int
    {
        $count = 0;
        $user = auth()->user();

        ReportCard::where('class_id', $classeId)
            ->where('period_id', $periodId)
            ->where('status', ReportCardStatus::Generated->value)
            ->each(function (ReportCard $rc) use ($user, &$count) {
                $this->publish($rc, $user);
                $count++;
            });

        return $count;
    }

    public function archive(ReportCard $rc): ReportCard
    {
        $rc->update(['status' => ReportCardStatus::Archived->value]);

        return $rc->fresh();
    }

    public function delete(ReportCard $rc): void
    {
        if ($rc->isPublished()) {
            throw ValidationException::withMessages([
                'status' => 'Un bulletin publié ne peut pas être supprimé.',
            ]);
        }

        if ($rc->hasPdf()) {
            \Storage::disk('local')->delete($rc->pdf_path);
        }

        $rc->delete();
    }

    // ── Collecte des données ───────────────────────────────────────────────

    public function collectBulletinData(ReportCard $rc): array
    {
        $rc->load([
            'student',
            'classe.level',
            'classe.mainTeacher.user',
            'academicYear',
            'period',
            'appreciations.subject',
        ]);

        // Paramètres école
        $school = [
            'name'          => SchoolSetting::get('school_name', 'École'),
            'logo_url'      => SchoolSetting::get('school_logo_url'),
            'address'       => SchoolSetting::get('school_address', ''),
            'phone'         => SchoolSetting::get('school_phone', ''),
            'email'         => SchoolSetting::get('school_email', ''),
            'director_name' => SchoolSetting::get('director_name', ''),
            'motto'         => SchoolSetting::get('school_motto', ''),
        ];

        // Infos élève
        $student = $rc->student;
        $studentData = [
            'full_name'   => $student->first_name . ' ' . strtoupper($student->last_name),
            'matricule'   => $student->matricule,
            'birth_date'  => $student->birth_date?->format('d/m/Y'),
            'birth_place' => $student->birth_place,
            'gender'      => $student->gender?->value,
            'nationality' => $student->nationality,
            'photo_url'   => $student->photo_path ? \Storage::url($student->photo_path) : null,
        ];

        // Infos classe
        $classe    = $rc->classe;
        $mainTeacher = $classe?->mainTeacher?->user;
        $classeData = [
            'display_name'      => $classe?->display_name,
            'level_label'       => $classe?->level?->name,
            'category'          => $classe?->serie,
            'main_teacher_name' => $mainTeacher ? $mainTeacher->first_name . ' ' . strtoupper($mainTeacher->last_name) : null,
        ];

        // Appréciations indexées par subject_id
        $appreciationMap = $rc->appreciations->keyBy('subject_id');

        // Données selon le type
        if ($rc->isPeriodType()) {
            $subjects = $this->collectPeriodSubjects($rc, $appreciationMap);
            $periodGenerals = [];
        } else {
            $subjects = $this->collectAnnualSubjects($rc, $appreciationMap);
            $periodGenerals = $this->collectPeriodGenerals($rc);
        }

        // Stats générales (depuis les period_averages ou stockées sur le bulletin)
        $generalStats = $this->computeGeneralStats($rc, $subjects);

        $passingAverage = (float) SchoolSetting::get('passing_average', 10.0);

        // Priorité au calcul frais depuis period_averages ; fallback sur la valeur snapshot stockée
        $freshAverage = $generalStats['average'] ?? $rc->general_average;

        $stats = [
            'general_average'       => $freshAverage,
            'general_rank'          => $generalStats['rank']         ?? $rc->general_rank,
            'class_size'            => $generalStats['class_size']   ?? $rc->class_size,
            'class_average'         => $generalStats['class_average'] ?? $rc->class_average,
            'absences_justified'    => $rc->absences_justified,
            'absences_unjustified'  => $rc->absences_unjustified,
            'is_passing'            => $freshAverage !== null ? (float) $freshAverage >= $passingAverage : null,
            'council_decision'       => $rc->council_decision?->value,
            'council_decision_label' => $rc->council_decision?->label(),
            'honor_mention'          => $rc->honor_mention?->value,
            'honor_mention_label'    => $rc->honor_mention?->label(),
            'general_appreciation'   => $rc->general_appreciation,
        ];

        return [
            'school'          => $school,
            'academic_year'   => [
                'name'        => $rc->academicYear?->name,
                'period_type' => $rc->academicYear?->period_type?->value,
            ],
            'period'          => $rc->period ? [
                'name'  => $rc->period->name,
                'order' => $rc->period->order,
            ] : null,
            'student'         => $studentData,
            'classe'          => $classeData,
            'stats'           => $stats,
            'subjects'        => $subjects,
            'period_generals' => $periodGenerals,
            'generated_at'    => now()->format('d/m/Y à H:i'),
            'pdf_hash'        => $rc->pdf_hash,
        ];
    }

    private function collectPeriodSubjects(ReportCard $rc, \Illuminate\Support\Collection $appreciationMap): array
    {
        $periodAverages = \App\Models\Tenant\PeriodAverage::with('subject')
            ->where('enrollment_id', $rc->enrollment_id)
            ->where('period_id', $rc->period_id)
            ->get();

        $passingAverage = (float) SchoolSetting::get('passing_average', 10.0);

        return $periodAverages->map(function ($pa) use ($appreciationMap, $passingAverage) {
            $appreciation = $appreciationMap->get($pa->subject_id);

            return [
                'name'           => $pa->subject?->name,
                'code'           => $pa->subject?->code,
                'coefficient'    => $pa->coefficient,
                'period_average' => $pa->average,
                'rank'           => $pa->rank,
                'class_average'  => $pa->class_average,
                'min_score'      => $pa->min_score,
                'max_score'      => $pa->max_score,
                'appreciation'   => $appreciation?->appreciation,
                'is_passing'     => $pa->average !== null ? (float) $pa->average >= $passingAverage : null,
            ];
        })->toArray();
    }

    private function collectAnnualSubjects(ReportCard $rc, \Illuminate\Support\Collection $appreciationMap): array
    {
        $subjectAverages = \App\Models\Tenant\SubjectAverage::with('subject')
            ->where('enrollment_id', $rc->enrollment_id)
            ->get();

        return $subjectAverages->map(function ($sa) use ($appreciationMap) {
            $appreciation  = $appreciationMap->get($sa->subject_id);
            $periodAvgs    = $sa->period_averages ?? [];

            return [
                'name'          => $sa->subject?->name,
                'code'          => $sa->subject?->code,
                'coefficient'   => $sa->coefficient,
                'annual_avg'    => $sa->annual_average,
                'period_1_avg'  => $periodAvgs[0]['average'] ?? null,
                'period_2_avg'  => $periodAvgs[1]['average'] ?? null,
                'period_3_avg'  => $periodAvgs[2]['average'] ?? null,
                'rank'          => $sa->rank,
                'class_average' => $sa->class_average,
                'appreciation'  => $appreciation?->appreciation,
                'is_passing'    => $sa->is_passing,
            ];
        })->toArray();
    }

    private function collectPeriodGenerals(ReportCard $rc): array
    {
        // Récupère les moyennes générales par période (pondérées)
        $periods = \App\Models\Tenant\Period::where('academic_year_id', $rc->academic_year_id)
            ->orderBy('order')
            ->get();

        $result = [];
        foreach ($periods as $period) {
            $periodAvgs = \App\Models\Tenant\PeriodAverage::where('enrollment_id', $rc->enrollment_id)
                ->where('period_id', $period->id)
                ->get();

            if ($periodAvgs->isEmpty()) {
                continue;
            }

            $totalWeighted = $periodAvgs->sum('weighted_average');
            $totalCoeff    = $periodAvgs->sum('coefficient');
            $avg = $totalCoeff > 0 ? round($totalWeighted / $totalCoeff, 2) : null;

            $result[] = [
                'period_name' => $period->name,
                'average'     => $avg,
                'rank'        => null, // disponible via period_averages si rank global stocké
            ];
        }

        return $result;
    }

    private function computeGeneralStats(ReportCard $rc, array $subjects): array
    {
        if ($rc->isPeriodType()) {
            $periodAverages = \App\Models\Tenant\PeriodAverage::where('enrollment_id', $rc->enrollment_id)
                ->where('period_id', $rc->period_id)
                ->get();

            $totalWeighted = $periodAverages->sum('weighted_average');
            $totalCoeff    = $periodAverages->sum('coefficient');
            $average       = $totalCoeff > 0 ? round((float) $totalWeighted / (float) $totalCoeff, 2) : null;

            // Effectif de la classe (toutes inscriptions actives)
            $classSize = $rc->class_id
                ? Enrollment::where('classe_id', $rc->class_id)->where('is_active', true)->count()
                : null;

            $classAvg  = null;
            $rank      = null;

            if ($rc->class_id && $rc->period_id) {
                // Moyennes pondérées de tous les élèves de la classe pour cette période
                $classEnrollmentIds = Enrollment::where('classe_id', $rc->class_id)
                    ->where('is_active', true)
                    ->pluck('id');

                $classAverages = \App\Models\Tenant\PeriodAverage::whereIn('enrollment_id', $classEnrollmentIds)
                    ->where('period_id', $rc->period_id)
                    ->selectRaw('enrollment_id, SUM(weighted_average) as total_weighted, SUM(coefficient) as total_coeff')
                    ->groupBy('enrollment_id')
                    ->get()
                    ->filter(fn ($row) => (float) $row->total_coeff > 0)
                    ->map(fn ($row) => round((float) $row->total_weighted / (float) $row->total_coeff, 2));

                if ($classAverages->count() > 0) {
                    $classAvg = round((float) $classAverages->avg(), 2);
                }

                if ($average !== null) {
                    $rank = $classAverages->filter(fn ($avg) => $avg > $average)->count() + 1;
                }
            }

        } else {
            $subjectAverages = \App\Models\Tenant\SubjectAverage::where('enrollment_id', $rc->enrollment_id)->get();
            $totalWeighted   = $subjectAverages->sum('weighted_average');
            $totalCoeff      = $subjectAverages->sum('coefficient');
            $average         = $totalCoeff > 0 ? round((float) $totalWeighted / (float) $totalCoeff, 2) : null;
            $rank            = null;
            $classSize       = null;
            $classAvg        = null;
        }

        return [
            'average'     => $average,
            'rank'        => $rank,
            'class_size'  => $classSize,
            'class_average' => $classAvg,
        ];
    }

    // ── Statistiques ───────────────────────────────────────────────────────

    public function getStatsByClass(int $classeId, int $periodId): array
    {
        $totalEnrolled = Enrollment::where('classe_id', $classeId)
            ->where('is_active', true)
            ->count();

        $stats = ReportCard::where('class_id', $classeId)
            ->where('period_id', $periodId)
            ->selectRaw("
                COUNT(*) as total,
                SUM(CASE WHEN status = 'draft'     THEN 1 ELSE 0 END) as draft,
                SUM(CASE WHEN status = 'generated' THEN 1 ELSE 0 END) as generated,
                SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
                SUM(CASE WHEN status = 'archived'  THEN 1 ELSE 0 END) as archived
            ")
            ->first();

        $total = (int) ($stats->total ?? 0);

        return [
            'total'           => $totalEnrolled,
            'draft'           => (int) ($stats->draft ?? 0),
            'generated'       => (int) ($stats->generated ?? 0),
            'published'       => (int) ($stats->published ?? 0),
            'archived'        => (int) ($stats->archived ?? 0),
            'missing'         => max(0, $totalEnrolled - $total),
            'completion_rate' => $totalEnrolled > 0
                ? round(($total / $totalEnrolled) * 100, 1)
                : 0.0,
        ];
    }
}
