<?php

declare(strict_types=1);

namespace App\Enums;

enum HonorMention: string
{
    case Encouragements = 'encouragements';
    case Compliments    = 'compliments';
    case Felicitations  = 'felicitations';

    public function label(): string
    {
        return match ($this) {
            self::Encouragements => 'Encouragements',
            self::Compliments    => 'Compliments',
            self::Felicitations  => 'Félicitations',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Encouragements => 'blue',
            self::Compliments    => 'purple',
            self::Felicitations  => 'gold',
        };
    }
}
