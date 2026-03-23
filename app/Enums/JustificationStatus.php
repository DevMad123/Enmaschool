<?php

declare(strict_types=1);

namespace App\Enums;

enum JustificationStatus: string
{
    case Pending  = 'pending';
    case Approved = 'approved';
    case Rejected = 'rejected';

    public function label(): string
    {
        return match ($this) {
            self::Pending  => 'En attente',
            self::Approved => 'Approuvée',
            self::Rejected => 'Rejetée',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending  => 'orange',
            self::Approved => 'green',
            self::Rejected => 'red',
        };
    }
}
