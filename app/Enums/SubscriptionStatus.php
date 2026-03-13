<?php
// ===== app/Enums/SubscriptionStatus.php =====

declare(strict_types=1);

namespace App\Enums;

enum SubscriptionStatus: string
{
    case Trial     = 'trial';
    case Active    = 'active';
    case Suspended = 'suspended';
    case Cancelled = 'cancelled';
    case Expired   = 'expired';

    /**
     * Libellé français du statut.
     */
    public function label(): string
    {
        return match ($this) {
            self::Trial     => 'Essai',
            self::Active    => 'Actif',
            self::Suspended => 'Suspendu',
            self::Cancelled => 'Annulé',
            self::Expired   => 'Expiré',
        };
    }

    /**
     * Couleur du badge associée au statut.
     */
    public function color(): string
    {
        return match ($this) {
            self::Trial     => 'blue',
            self::Active    => 'green',
            self::Suspended => 'orange',
            self::Cancelled => 'gray',
            self::Expired   => 'red',
        };
    }
}
