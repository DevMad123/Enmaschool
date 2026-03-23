<?php

declare(strict_types=1);

namespace App\Enums;

enum EnrollmentStatus: string
{
    case Enrolled       = 'enrolled';
    case TransferredIn  = 'transferred_in';
    case TransferredOut = 'transferred_out';
    case Withdrawn      = 'withdrawn';
    case Completed      = 'completed';

    public function label(): string
    {
        return match ($this) {
            self::Enrolled       => 'Inscrit',
            self::TransferredIn  => 'Transféré (arrivée)',
            self::TransferredOut => 'Transféré (départ)',
            self::Withdrawn      => 'Retiré',
            self::Completed      => 'Terminé',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Enrolled       => 'green',
            self::TransferredIn  => 'blue',
            self::TransferredOut => 'orange',
            self::Withdrawn      => 'red',
            self::Completed      => 'purple',
        };
    }

    public function isActive(): bool
    {
        return in_array($this, [self::Enrolled, self::TransferredIn], true);
    }
}
