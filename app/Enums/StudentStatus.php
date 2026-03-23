<?php

declare(strict_types=1);

namespace App\Enums;

enum StudentStatus: string
{
    case Active     = 'active';
    case Inactive   = 'inactive';
    case Transferred = 'transferred';
    case Graduated  = 'graduated';
    case Expelled   = 'expelled';

    public function label(): string
    {
        return match ($this) {
            self::Active      => 'Actif',
            self::Inactive    => 'Inactif',
            self::Transferred => 'Transféré',
            self::Graduated   => 'Diplômé',
            self::Expelled    => 'Exclu',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active      => 'green',
            self::Inactive    => 'gray',
            self::Transferred => 'blue',
            self::Graduated   => 'purple',
            self::Expelled    => 'red',
        };
    }
}
