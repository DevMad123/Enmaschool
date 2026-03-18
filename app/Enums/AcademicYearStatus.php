<?php

declare(strict_types=1);

namespace App\Enums;

enum AcademicYearStatus: string
{
    case Draft = 'draft';
    case Active = 'active';
    case Closed = 'closed';

    public function label(): string
    {
        return match ($this) {
            self::Draft => 'Brouillon',
            self::Active => 'Active',
            self::Closed => 'Clôturée',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft => '#f59e0b',
            self::Active => '#22c55e',
            self::Closed => '#6b7280',
        };
    }
}
