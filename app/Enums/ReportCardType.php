<?php

declare(strict_types=1);

namespace App\Enums;

enum ReportCardType: string
{
    case Period = 'period';
    case Annual = 'annual';

    public function label(): string
    {
        return match ($this) {
            self::Period => 'Bulletin de période',
            self::Annual => 'Bulletin annuel',
        };
    }
}
