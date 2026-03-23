<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\AbsenceJustification;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Storage;

/** @mixin AbsenceJustification */
class AbsenceJustificationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $daysCount = $this->date_from && $this->date_to
            ? (int) $this->date_from->diffInDays($this->date_to) + 1
            : 0;

        $documentUrl = $this->document_path
            ? Storage::disk('tenant')->url($this->document_path)
            : null;

        return [
            'id'         => $this->id,
            'date_from'  => $this->date_from?->format('d/m/Y'),
            'date_to'    => $this->date_to?->format('d/m/Y'),
            'days_count' => $daysCount,
            'reason'     => $this->reason,
            'document_url' => $documentUrl,

            'status' => [
                'value' => $this->status->value,
                'label' => $this->status->label(),
                'color' => $this->status->color(),
            ],

            'review_note' => $this->review_note,
            'reviewed_at' => $this->reviewed_at?->format('d/m/Y H:i'),

            'reviewed_by' => $this->when(
                $this->relationLoaded('reviewedBy') && $this->reviewedBy,
                fn () => [
                    'id'        => $this->reviewedBy->id,
                    'full_name' => $this->reviewedBy->full_name,
                ]
            ),

            'submitted_by' => $this->when(
                $this->relationLoaded('submittedBy') && $this->submittedBy,
                fn () => [
                    'id'        => $this->submittedBy->id,
                    'full_name' => $this->submittedBy->full_name,
                ]
            ),

            'enrollment' => $this->when(
                $this->relationLoaded('enrollment') && $this->enrollment,
                fn () => [
                    'id'      => $this->enrollment->id,
                    'student' => $this->enrollment->relationLoaded('student')
                        ? new StudentListResource($this->enrollment->student)
                        : null,
                ]
            ),

            'affected_attendances_count' => $this->when(
                $this->relationLoaded('attendances'),
                fn () => $this->attendances->count()
            ),

            'created_at' => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
