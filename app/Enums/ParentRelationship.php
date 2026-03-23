<?php

declare(strict_types=1);

namespace App\Enums;

enum ParentRelationship: string
{
    case Father   = 'father';
    case Mother   = 'mother';
    case Guardian = 'guardian';
    case Other    = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Father   => 'Père',
            self::Mother   => 'Mère',
            self::Guardian => 'Tuteur/Tutrice',
            self::Other    => 'Autre',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Father   => 'User',
            self::Mother   => 'User',
            self::Guardian => 'Shield',
            self::Other    => 'Users',
        };
    }
}
