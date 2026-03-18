<?php

declare(strict_types=1);

namespace App\Enums;

enum PromotionType: string
{
    case Automatic = 'automatic';
    case Manual = 'manual';
    case ByAverage = 'by_average';

    public function label(): string
    {
        return match ($this) {
            self::Automatic => 'Automatique',
            self::Manual => 'Manuel',
            self::ByAverage => 'Par moyenne',
        };
    }
}
