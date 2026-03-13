<?php
// ===== app/Enums/TicketStatus.php =====

declare(strict_types=1);

namespace App\Enums;

enum TicketStatus: string
{
    case Open       = 'open';
    case InProgress = 'in_progress';
    case Resolved   = 'resolved';
    case Closed     = 'closed';

    /**
     * Libellé français du statut.
     */
    public function label(): string
    {
        return match ($this) {
            self::Open       => 'Ouvert',
            self::InProgress => 'En cours',
            self::Resolved   => 'Résolu',
            self::Closed     => 'Fermé',
        };
    }

    /**
     * Couleur du badge associée au statut.
     */
    public function color(): string
    {
        return match ($this) {
            self::Open       => 'blue',
            self::InProgress => 'yellow',
            self::Resolved   => 'green',
            self::Closed     => 'gray',
        };
    }
}
