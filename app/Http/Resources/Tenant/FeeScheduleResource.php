<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\FeeSchedule;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin FeeSchedule */
class FeeScheduleResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'amount'               => (float) $this->amount,
            'amount_formatted'     => number_format((float) $this->amount, 0, ',', ' ') . ' FCFA',
            'installments_allowed' => $this->installments_allowed,
            'max_installments'     => $this->max_installments,
            'due_date'             => $this->due_date?->format('d/m/Y'),
            'notes'                => $this->notes,
            'fee_type'             => FeeTypeResource::make($this->whenLoaded('feeType')),
            'school_level'         => $this->when($this->relationLoaded('schoolLevel'), function () {
                if (! $this->schoolLevel) {
                    return null;
                }
                return [
                    'id'          => $this->schoolLevel->id,
                    'label'       => $this->schoolLevel->label,
                    'short_label' => $this->schoolLevel->short_label,
                    'category'    => $this->schoolLevel->category,
                ];
            }),
            'academic_year' => $this->when($this->relationLoaded('academicYear'), function () {
                return [
                    'id'   => $this->academicYear->id,
                    'name' => $this->academicYear->name,
                ];
            }),
        ];
    }
}
