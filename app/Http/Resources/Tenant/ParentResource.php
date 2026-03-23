<?php

declare(strict_types=1);

namespace App\Http\Resources\Tenant;

use App\Models\Tenant\ParentModel;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/** @mixin ParentModel */
class ParentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'                   => $this->id,
            'first_name'           => $this->first_name,
            'last_name'            => $this->last_name,
            'full_name'            => $this->full_name,
            'gender'               => [
                'value' => $this->gender?->value,
                'label' => $this->gender?->label(),
            ],
            'relationship'         => [
                'value' => $this->relationship?->value,
                'label' => $this->relationship?->label(),
                'icon'  => $this->relationship?->icon(),
            ],
            'phone'                => $this->phone,
            'phone_secondary'      => $this->phone_secondary,
            'email'                => $this->email,
            'profession'           => $this->profession,
            'address'              => $this->address,
            'national_id'          => $this->national_id,
            'is_emergency_contact' => $this->is_emergency_contact,
            'notes'                => $this->notes,

            // Pivot si chargé depuis Student via belongsToMany
            $this->mergeWhen($this->pivot !== null, fn () => [
                'pivot' => [
                    'is_primary_contact' => (bool) $this->pivot?->is_primary_contact,
                    'can_pickup'         => (bool) $this->pivot?->can_pickup,
                ],
            ]),

            'students_count'       => $this->whenCounted('students'),
        ];
    }
}
