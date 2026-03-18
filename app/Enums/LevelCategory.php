<?php

declare(strict_types=1);

namespace App\Enums;

enum LevelCategory: string
{
    case Maternelle = 'maternelle';
    case Primaire = 'primaire';
    case College = 'college';
    case Lycee = 'lycee';

    public function label(): string
    {
        return match ($this) {
            self::Maternelle => 'Maternelle',
            self::Primaire => 'Primaire',
            self::College => 'Collège',
            self::Lycee => 'Lycée',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Maternelle => '#ec4899',
            self::Primaire => '#3b82f6',
            self::College => '#22c55e',
            self::Lycee => '#8b5cf6',
        };
    }
}
