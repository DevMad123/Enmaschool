<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\StudentStatus;
use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\ImportStudentsRequest;
use App\Http\Requests\Tenant\StoreStudentRequest;
use App\Http\Requests\Tenant\UpdateStudentRequest;
use App\Http\Resources\Tenant\ParentResource;
use App\Http\Resources\Tenant\StudentListResource;
use App\Http\Resources\Tenant\StudentResource;
use App\Models\Tenant\Student;
use App\Services\Tenant\StudentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class StudentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly StudentService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $students = $this->service->list($request->all());

        return $this->paginated(
            $students->through(fn ($s) => new StudentListResource($s)),
        );
    }

    public function store(StoreStudentRequest $request): JsonResponse
    {
        try {
            $student = $this->service->create($request->validated());

            return $this->created(new StudentResource($student));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function show(Student $student): JsonResponse
    {
        $student->load(['enrollments.classe.level', 'parents', 'createdBy']);

        return $this->success(new StudentResource($student));
    }

    public function update(UpdateStudentRequest $request, Student $student): JsonResponse
    {
        try {
            $updated = $this->service->update($student, $request->validated());

            return $this->success(new StudentResource($updated));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function destroy(Student $student): JsonResponse
    {
        try {
            $this->service->delete($student);

            return $this->deleted();
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function parents(Student $student): JsonResponse
    {
        $student->load('parents');

        return $this->success(ParentResource::collection($student->parents));
    }

    public function syncParents(Request $request, Student $student): JsonResponse
    {
        $request->validate([
            'parents'                    => ['required', 'array', 'max:2'],
            'parents.*.parent_id'        => ['required', 'integer', 'exists:parents,id'],
            'parents.*.is_primary_contact' => ['nullable', 'boolean'],
            'parents.*.can_pickup'       => ['nullable', 'boolean'],
        ]);

        try {
            $this->service->syncParents($student, $request->input('parents'));
            $student->load('parents');

            return $this->success(ParentResource::collection($student->parents));
        } catch (\Exception $e) {
            return $this->error($e->getMessage(), 422);
        }
    }

    public function stats(Request $request): JsonResponse
    {
        $yearId = (int) $request->input('year_id', 0);

        if (! $yearId) {
            return $this->error('Le paramètre year_id est requis.', 422);
        }

        return $this->success($this->service->getStats($yearId));
    }

    public function import(ImportStudentsRequest $request): JsonResponse
    {
        $result = $this->service->importFromCsv(
            $request->file('file'),
            (int) $request->input('academic_year_id'),
            (int) $request->input('classe_id'),
        );

        return $this->success($result);
    }

    public function exportTemplate(): BinaryFileResponse
    {
        $headers = ['Nom*', 'Prénom*', 'Date naissance*', 'Genre* (M/F)', 'Lieu naissance',
            'Nationalité', 'Numéro acte naissance', 'Adresse', 'Ville',
            'École précédente', 'Prénom parent1', 'Nom parent1', 'Téléphone parent1*',
            'Relation parent1 (father/mother/guardian)', 'Prénom parent2', 'Nom parent2',
            'Téléphone parent2', 'Relation parent2'];

        $path = storage_path('app/templates/import_students_template.csv');
        $dir  = \dirname($path);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }

        $handle = fopen($path, 'w');
        fputcsv($handle, $headers);
        // Exemple de ligne
        fputcsv($handle, ['KOUASSI', 'Jean-Marc', '15/05/2010', 'M', 'Abidjan',
            'Ivoirienne', '', 'Quartier Plateau', 'Abidjan',
            'École Primaire Plateau', 'Paul', 'KOUASSI', '0701234567',
            'father', '', '', '', '']);
        fclose($handle);

        return response()->download($path, 'template_import_eleves.csv');
    }

    public function export(Request $request): BinaryFileResponse
    {
        $path = $this->service->exportToCsv($request->all());

        return response()->download($path, 'export_eleves_'.now()->format('Ymd').'.csv')
            ->deleteFileAfterSend();
    }
}
