<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\BulkReportCardAppreciationsRequest;
use App\Http\Requests\Tenant\InitiateClassReportCardsRequest;
use App\Http\Requests\Tenant\InitiateReportCardRequest;
use App\Http\Requests\Tenant\UpdateCouncilDataRequest;
use App\Http\Resources\Tenant\ReportCardResource;
use App\Models\Tenant\Classe;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\ReportCard;
use App\Services\Tenant\ReportCardService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class ReportCardController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ReportCardService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ReportCard::with(['student', 'classe', 'period', 'academicYear']);

        if ($request->filled('student_id')) {
            $query->where('student_id', $request->input('student_id'));
        }
        if ($request->filled('class_id')) {
            $query->where('class_id', $request->input('class_id'));
        }
        if ($request->filled('period_id')) {
            $query->where('period_id', $request->input('period_id'));
        }
        if ($request->filled('year_id')) {
            $query->where('academic_year_id', $request->input('year_id'));
        }
        if ($request->filled('type')) {
            $query->where('type', $request->input('type'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $perPage     = min((int) $request->input('per_page', 25), 100);
        $reportCards = $query->latest()->paginate($perPage);

        return $this->paginated(
            $reportCards->through(fn ($rc) => new ReportCardResource($rc)),
        );
    }

    public function store(InitiateReportCardRequest $request): JsonResponse
    {
        $rc = $this->service->initiate(
            enrollmentId: $request->integer('enrollment_id'),
            periodId:     $request->integer('period_id') ?: null,
            type:         $request->input('type'),
        );

        return $this->created(new ReportCardResource($rc->load(['student', 'classe', 'period', 'academicYear'])));
    }

    public function initiateForClass(InitiateClassReportCardsRequest $request): JsonResponse
    {
        $existing = ReportCard::where('class_id', $request->integer('class_id'))
            ->where('period_id', $request->integer('period_id') ?: null)
            ->where('type', $request->input('type'))
            ->count();

        $created = $this->service->initiateForClass(
            classeId: $request->integer('class_id'),
            periodId: $request->integer('period_id') ?: null,
            type:     $request->input('type'),
        );

        return $this->success([
            'created'       => $created->count(),
            'already_exists' => $existing,
        ]);
    }

    public function show(ReportCard $reportCard): JsonResponse
    {
        $reportCard->load([
            'student',
            'classe.schoolLevel',
            'period',
            'academicYear',
            'appreciations.subject',
            'generatedBy',
            'publishedBy',
        ]);

        return $this->success(new ReportCardResource($reportCard));
    }

    public function preview(ReportCard $reportCard): JsonResponse
    {
        $bulletinData = $this->service->collectBulletinData($reportCard);

        $reportCard->load(['student', 'classe', 'period', 'academicYear', 'appreciations.subject']);

        return $this->success([
            'report_card'  => new ReportCardResource($reportCard),
            'bulletin_data' => $bulletinData,
        ]);
    }

    public function updateCouncil(UpdateCouncilDataRequest $request, ReportCard $reportCard): JsonResponse
    {
        $rc = $this->service->updateCouncilData($reportCard, $request->validated());

        return $this->success(new ReportCardResource($rc->load(['student', 'classe', 'period', 'academicYear'])));
    }

    public function saveAppreciations(BulkReportCardAppreciationsRequest $request, ReportCard $reportCard): JsonResponse
    {
        /** @var \App\Models\Tenant\User $user */
        $user = auth()->user();
        $this->service->bulkSaveAppreciations($reportCard, $request->input('appreciations'), $user);

        return $this->success(null, 'Appréciations sauvegardées.');
    }

    public function generate(ReportCard $reportCard): JsonResponse
    {
        $rc = $this->service->generatePdf($reportCard);

        return $this->success(
            new ReportCardResource($rc->load(['student', 'classe', 'period', 'academicYear'])),
            'PDF généré avec succès.'
        );
    }

    public function generateForClass(Request $request): JsonResponse
    {
        $request->validate([
            'class_id'  => ['required', 'integer', 'exists:classes,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
            'type'      => ['required', 'in:period,annual'],
        ]);

        $classeId = $request->integer('class_id');
        Classe::findOrFail($classeId); // Validate class exists
        $count    = Enrollment::where('classe_id', $classeId)->where('is_active', true)->count();

        $this->service->generateForClass(
            classeId: $classeId,
            periodId: $request->integer('period_id') ?: null,
            type:     $request->input('type', 'period'),
        );

        return $this->success(
            ['message' => "Génération lancée pour {$count} élève(s)."],
            "Génération lancée pour {$count} élève(s)."
        );
    }

    public function download(ReportCard $reportCard): BinaryFileResponse
    {
        if (! $reportCard->hasPdf()) {
            abort(404, 'Aucun PDF disponible pour ce bulletin.');
        }

        /** @var string $pdfPath */
        $pdfPath     = $reportCard->pdf_path;
        $absolutePath = Storage::disk('local')->path($pdfPath);

        if (! file_exists($absolutePath)) {
            abort(404, 'Le fichier PDF est introuvable.');
        }

        $reportCard->loadMissing('student');
        /** @var string $matricule */
        $matricule  = $reportCard->student?->matricule ?? (string) $reportCard->id;
        /** @var int|null $periodId */
        $periodId   = $reportCard->period_id;
        $periodSlug = $periodId ? 'periode' : 'annuel';
        $filename   = "bulletin_{$matricule}_{$periodSlug}.pdf";

        return response()->download($absolutePath, $filename, [
            'Content-Type' => 'application/pdf',
        ]);
    }

    public function publish(ReportCard $reportCard): JsonResponse
    {
        /** @var \App\Models\Tenant\User $user */
        $user = auth()->user();
        $rc   = $this->service->publish($reportCard, $user);

        return $this->success(
            new ReportCardResource($rc->load(['student', 'classe', 'period', 'academicYear'])),
            'Bulletin publié.'
        );
    }

    public function publishForClass(Request $request): JsonResponse
    {
        $request->validate([
            'class_id'  => ['required', 'integer', 'exists:classes,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
        ]);

        $count = $this->service->publishForClass(
            classeId: $request->integer('class_id'),
            periodId: $request->integer('period_id'),
        );

        return $this->success(['published' => $count], "{$count} bulletin(s) publié(s).");
    }

    public function classStats(Request $request): JsonResponse
    {
        $request->validate([
            'class_id'  => ['required', 'integer', 'exists:classes,id'],
            'period_id' => ['nullable', 'integer', 'exists:periods,id'],
        ]);

        $stats = $this->service->getStatsByClass(
            classeId: $request->integer('class_id'),
            periodId: $request->integer('period_id'),
        );

        $classe = Classe::find($request->integer('class_id'));

        return $this->success([
            'classe'           => ['id' => $classe?->id, 'display_name' => $classe?->display_name],
            'period'           => null, // can be enriched if needed
            'total_students'   => $stats['total'],
            'draft'            => $stats['draft'],
            'generated'        => $stats['generated'],
            'published'        => $stats['published'],
            'archived'         => $stats['archived'],
            'missing'          => $stats['missing'],
            'completion_rate'  => $stats['completion_rate'],
        ]);
    }

    public function destroy(ReportCard $reportCard): JsonResponse
    {
        $this->service->delete($reportCard);

        return $this->success(null, 'Bulletin supprimé.');
    }
}
