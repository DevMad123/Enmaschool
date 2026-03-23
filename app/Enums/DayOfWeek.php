<?php

declare(strict_types=1);

namespace App\Enums;

enum DayOfWeek: int
{
    case Monday    = 1;
    case Tuesday   = 2;
    case Wednesday = 3;
    case Thursday  = 4;
    case Friday    = 5;
    case Saturday  = 6;

    public function label(): string
    {
        return match ($this) {
            self::Monday    => 'Lundi',
            self::Tuesday   => 'Mardi',
            self::Wednesday => 'Mercredi',
            self::Thursday  => 'Jeudi',
            self::Friday    => 'Vendredi',
            self::Saturday  => 'Samedi',
        };
    }

    public function short(): string
    {
        return match ($this) {
            self::Monday    => 'Lun',
            self::Tuesday   => 'Mar',
            self::Wednesday => 'Mer',
            self::Thursday  => 'Jeu',
            self::Friday    => 'Ven',
            self::Saturday  => 'Sam',
        };
    }
}
