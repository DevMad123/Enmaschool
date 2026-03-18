<?php

declare(strict_types=1);

namespace App\Enums;

enum LevelCode: string
{
    case PS = 'PS';
    case MS = 'MS';
    case GS = 'GS';
    case CP1 = 'CP1';
    case CP2 = 'CP2';
    case CE1 = 'CE1';
    case CE2 = 'CE2';
    case CM1 = 'CM1';
    case CM2 = 'CM2';
    case SIXIEME = '6EME';
    case CINQUIEME = '5EME';
    case QUATRIEME = '4EME';
    case TROISIEME = '3EME';
    case SECONDE = '2NDE';
    case PREMIERE = '1ERE';
    case TERMINALE = 'TLE';

    public function requiresSerie(): bool
    {
        return match ($this) {
            self::SECONDE, self::PREMIERE, self::TERMINALE => true,
            default => false,
        };
    }

    public function category(): LevelCategory
    {
        return match ($this) {
            self::PS, self::MS, self::GS => LevelCategory::Maternelle,
            self::CP1, self::CP2, self::CE1, self::CE2, self::CM1, self::CM2 => LevelCategory::Primaire,
            self::SIXIEME, self::CINQUIEME, self::QUATRIEME, self::TROISIEME => LevelCategory::College,
            self::SECONDE, self::PREMIERE, self::TERMINALE => LevelCategory::Lycee,
        };
    }
}
