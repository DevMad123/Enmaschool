<?php

declare(strict_types=1);

namespace App\Enums;

enum StudentFeeStatus: string
{
    case Pending = 'pending';
    case Partial = 'partial';
    case Paid    = 'paid';
    case Overdue = 'overdue';
    case Waived  = 'waived';

    public function label(): string
    {
        return match ($this) {
            self::Pending => 'En attente',
            self::Partial => 'Partiel',
            self::Paid    => 'Soldé',
            self::Overdue => 'En retard',
            self::Waived  => 'Exonéré',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending => 'gray',
            self::Partial => 'orange',
            self::Paid    => 'green',
            self::Overdue => 'red',
            self::Waived  => 'blue',
        };
    }

    /** Retourne true si le frais est considéré comme réglé (plus d'action requise). */
    public function isSettled(): bool
    {
        return in_array($this, [self::Paid, self::Waived], true);
    }

    /** Retourne true si le frais nécessite une action (relance, paiement...). */
    public function requiresAction(): bool
    {
        return in_array($this, [self::Pending, self::Partial, self::Overdue], true);
    }
}
