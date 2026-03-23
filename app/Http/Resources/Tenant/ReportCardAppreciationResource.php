<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\ReportCardAppreciation;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ReportCardAppreciation */
class ReportCardAppreciationResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'           => $this->id,
            'appreciation' => $this->appreciation,
            'subject'      => $this->whenLoaded('subject', fn () => new SubjectResource($this->subject)),
            'teacher'      => $this->whenLoaded('teacher', fn () => $this->teacher ? [
                'id'        => $this->teacher->id,
                'full_name' => $this->teacher->user?->full_name,
            ] : null),
            'entered_by'   => $this->whenLoaded('enteredBy', fn () => $this->enteredBy ? [
                'id'        => $this->enteredBy->id,
                'full_name' => $this->enteredBy->full_name,
            ] : null),
            'created_at'   => $this->created_at?->format('d/m/Y H:i'),
        ];
    }
}
