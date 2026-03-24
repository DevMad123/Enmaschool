<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\ReportCard;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReportCard */
class ReportCardResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'   => $this->id,
            'type' => [
                'value' => $this->type->value,
                'label' => $this->type->label(),
            ],
            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],
            'general_average'      => $this->general_average !== null ? (float) $this->general_average : null,
            'general_rank'         => $this->general_rank,
            'class_size'           => $this->class_size,
            'class_average'        => $this->class_average !== null ? (float) $this->class_average : null,
            'absences_justified'   => $this->absences_justified,
            'absences_unjustified' => $this->absences_unjustified,
            'general_appreciation' => $this->general_appreciation,
            'council_decision'     => $this->council_decision ? [
                'value' => $this->council_decision->value,
                'label' => $this->council_decision->label(),
                'color' => $this->council_decision->color(),
            ] : null,
            'honor_mention'    => $this->honor_mention ? [
                'value' => $this->honor_mention->value,
                'label' => $this->honor_mention->label(),
                'color' => $this->honor_mention->color(),
            ] : null,
            'has_pdf'          => $this->hasPdf(),
            'pdf_url'          => $this->hasPdf() ? route('api.report-cards.download', $this->id) : null,
            'pdf_generated_at' => $this->pdf_generated_at?->format('d/m/Y H:i'),
            'published_at'     => $this->published_at?->format('d/m/Y H:i'),
            'is_editable'      => $this->isEditable(),

            // Relations
            'student'      => $this->whenLoaded('student', fn () => new StudentListResource($this->student)),
            'classe'       => $this->whenLoaded('classe', fn () => $this->classe ? [
                'id'           => $this->classe->id,
                'display_name' => $this->classe->display_name,
                'level_label'  => $this->classe->level?->name,
                'subjects'     => $this->classe->relationLoaded('subjects')
                    ? $this->classe->subjects->map(fn ($s) => ['id' => $s->id, 'name' => $s->name, 'coefficient' => $s->coefficient])->values()
                    : [],
            ] : null),
            'period'       => $this->whenLoaded('period', fn () => $this->period ? [
                'id'    => $this->period->id,
                'name'  => $this->period->name,
                'order' => $this->period->order,
            ] : null),
            'academic_year' => $this->whenLoaded('academicYear', fn () => $this->academicYear ? [
                'id'   => $this->academicYear->id,
                'name' => $this->academicYear->name,
            ] : null),
            'appreciations' => $this->whenLoaded(
                'appreciations',
                fn () => ReportCardAppreciationResource::collection($this->appreciations)
            ),
            'generated_by' => $this->whenLoaded('generatedBy', fn () => $this->generatedBy ? [
                'id'        => $this->generatedBy->id,
                'full_name' => $this->generatedBy->full_name,
            ] : null),
            'published_by' => $this->whenLoaded('publishedBy', fn () => $this->publishedBy ? [
                'id'        => $this->publishedBy->id,
                'full_name' => $this->publishedBy->full_name,
            ] : null),

            'created_at' => $this->created_at?->format('d/m/Y H:i'),
            'updated_at' => $this->updated_at?->format('d/m/Y H:i'),
        ];
    }
}
