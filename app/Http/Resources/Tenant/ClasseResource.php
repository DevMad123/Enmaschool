<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\Classe;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin Classe */
class ClasseResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'academic_year_id' => $this->academic_year_id,
            'display_name' => $this->display_name,
            'serie' => $this->serie,
            'section' => $this->section,
            'capacity' => $this->capacity,
            'is_active' => $this->is_active,
            'level' => new SchoolLevelResource($this->whenLoaded('level')),
            'main_teacher' => $this->whenLoaded('mainTeacher', fn () => $this->mainTeacher ? [
                'id' => $this->mainTeacher->id,
                'full_name' => $this->mainTeacher->full_name,
            ] : null),
            'room' => $this->whenLoaded('room', fn () => $this->room ? [
                'id' => $this->room->id,
                'name' => $this->room->name,
                'code' => $this->room->code,
            ] : null),
            'subjects_count' => $this->whenCounted('subjects'),
            'students_count' => 0,
        ];
    }
}
