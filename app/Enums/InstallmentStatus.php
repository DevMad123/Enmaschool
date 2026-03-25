<?php

declare(strict_types=1);

namespace App\Enums;

enum InstallmentStatus: string
{
    case Pending = 'pending';
    case Paid    = 'paid';
    case Overdue = 'overdue';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Paid    => 'Payé',
            self::Overdue => 'En retard',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'gray',
            self::Paid    => 'green',
            self::Overdue => 'red',
        };
    }
}
