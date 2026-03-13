<?php
// ===== app/Enums/TenantStatus.php =====

declare(strict_types=1);

namespace App\Enums;

enum TenantStatus: string
{
    case Trial = 'trial';
    case Active = 'active';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';

    /**
     * Libellé français du statut.
     */
    public function label(): string
    {
        return match ($this) {
            self::Trial => 'Essai',
            self::Active => 'Actif',
            self::Suspended => 'Suspendu',
            self::Cancelled => 'Annulé',
        };
    }

    /**
     * Couleur du badge associée au statut.
     */
    public function color(): string
    {
        return match ($this) {
            self::Trial => 'blue',
            self::Active => 'green',
            self::Suspended => 'red',
            self::Cancelled => 'gray',
        };
    }
}
