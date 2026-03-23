<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\ClassSubject;
use App\Models\Tenant\TeacherClass;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class ClassAssignmentsResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        /** @var array $data */
        $data = $this->resource;

        $classe              = $data['classe'];
        $assignments         = $data['assignments'];        // Collection<TeacherClass>
        $unassignedSubjects  = $data['unassigned_subjects']; // Collection<ClassSubject>

        // Construire la liste complète matières + enseignants
        $allSubjectItems = [];

        // Matières avec affectation active
        foreach ($assignments->where('is_active', true) as $assignment) {
            $allSubjectItems[] = [
                'subject'     => $assignment->relationLoaded('subject')
                    ? new SubjectResource($assignment->subject)
                    : null,
                'teacher'     => $assignment->relationLoaded('teacher') && $assignment->teacher
                    ? [
                        'id'         => $assignment->teacher->id,
                        'full_name'  => $assignment->teacher->full_name,
                        'avatar_url' => $assignment->teacher->avatar_url,
                    ]
                    : null,
                'assignment'  => new TeacherClassResource($assignment),
                'is_assigned' => true,
            ];
        }

        // Matières sans affectation
        foreach ($unassignedSubjects as $classSubject) {
            $allSubjectItems[] = [
                'subject'    => $classSubject->relationLoaded('subject')
                    ? new SubjectResource($classSubject->subject)
                    : null,
                'teacher'    => null,
                'assignment' => null,
                'is_assigned' => false,
            ];
        }

        $totalSubjects    = count($allSubjectItems);
        $assignedSubjects = count(array_filter($allSubjectItems, fn ($i) => $i['is_assigned']));

        return [
            'classe'              => new ClasseResource($classe),
            'total_subjects'      => $totalSubjects,
            'assigned_subjects'   => $assignedSubjects,
            'unassigned_subjects' => $totalSubjects - $assignedSubjects,
            'completion_rate'     => $totalSubjects > 0
                ? round($assignedSubjects / $totalSubjects * 100, 1)
                : 0.0,
            'assignments'         => $allSubjectItems,
        ];
    }
}
