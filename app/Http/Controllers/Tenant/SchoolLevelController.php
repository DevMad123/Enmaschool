<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\SchoolLevelResource;
use App\Http\Resources\Tenant\SubjectResource;
use App\Models\Tenant\Classe;
use App\Models\Tenant\SchoolLevel;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolLevelController extends Controller
{
    use ApiResponse;

    public function index(Request $request): JsonResponse
    {
        $query = SchoolLevel::forTenant()->orderBy('order');

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        $levels = $query->get();

        return $this->success(data: SchoolLevelResource::collection($levels));
    }

    /**
     * GET /school-levels/{level}/subjects
     * Retourne les matières assignées au niveau.
     */
    public function subjects(SchoolLevel $level): JsonResponse
    {
        $subjects = $level->subjects()->get();

        return $this->success(data: SubjectResource::collection($subjects));
    }

    /**
     * POST /school-levels/{level}/subjects/sync
     * Synchronise les matières du niveau ET propage vers toutes les classes du niveau.
     */
    public function syncSubjects(Request $request, SchoolLevel $level): JsonResponse
    {
        $request->validate([
            'subject_ids'   => ['required', 'array'],
            'subject_ids.*' => ['integer', 'exists:subjects,id'],
        ]);

        $subjectIds = $request->input('subject_ids');

        // 1. Sync level_subjects
        $level->subjects()->sync($subjectIds);

        // 2. Propager vers toutes les classes de ce niveau
        $classes = Classe::where('school_level_id', $level->id)->get();
        foreach ($classes as $classe) {
            $classe->subjects()->sync($subjectIds);
        }

        return $this->success(
            message: count($subjectIds) . ' matière(s) synchronisée(s) sur le niveau et ' . $classes->count() . ' classe(s).',
        );
    }

    public function toggle(SchoolLevel $level): JsonResponse
    {
        // Block disabling if classes use this level
        if ($level->is_active) {
            $classCount = Classe::where('school_level_id', $level->id)->count();
            if ($classCount > 0) {
                return $this->error(
                    message: "{$classCount} classe(s) existante(s) avec ce niveau. Supprimez-les avant de désactiver.",
                    code: 422,
                );
            }
        }

        $level->update(['is_active' => ! $level->is_active]);

        return $this->success(
            data: new SchoolLevelResource($level->fresh()),
            message: $level->fresh()->is_active ? 'Niveau activé.' : 'Niveau désactivé.',
        );
    }
}
