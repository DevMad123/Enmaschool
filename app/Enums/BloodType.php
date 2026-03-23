<?php

declare(strict_types=1);

namespace App\Enums;

enum BloodType: string
{
    case APos  = 'A+';
    case ANeg  = 'A-';
    case BPos  = 'B+';
    case BNeg  = 'B-';
    case ABPos = 'AB+';
    case ABNeg = 'AB-';
    case OPos  = 'O+';
    case ONeg  = 'O-';

    public function label(): string
    {
        return $this->value;
    }
}
