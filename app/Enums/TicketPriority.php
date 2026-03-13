<?php
// ===== app/Enums/TicketPriority.php =====

declare(strict_types=1);

namespace App\Enums;

enum TicketPriority: string
{
    case Low    = 'low';
    case Medium = 'medium';
    case High   = 'high';
    case Urgent = 'urgent';

    /**
     * Libellé français de la priorité.
     */
    public function label(): string
    {
        return match ($this) {
            self::Low    => 'Faible',
            self::Medium => 'Moyenne',
            self::High   => 'Haute',
            self::Urgent => 'Urgente',
        };
    }

    /**
     * Couleur du badge associée à la priorité.
     */
    public function color(): string
    {
        return match ($this) {
            self::Low    => 'gray',
            self::Medium => 'blue',
            self::High   => 'orange',
            self::Urgent => 'red',
        };
    }
}
