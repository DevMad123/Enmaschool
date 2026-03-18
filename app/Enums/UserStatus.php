<?php
// ===== app/Enums/UserStatus.php =====

declare(strict_types=1);

namespace App\Enums;

enum UserStatus: string
{
    case Active    = 'active';
    case Inactive  = 'inactive';
    case Suspended = 'suspended';
    case Pending   = 'pending';

    public function label(): string
    {
        return match ($this) {
            self::Active    => 'Actif',
            self::Inactive  => 'Inactif',
            self::Suspended => 'Suspendu',
            self::Pending   => 'En attente',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Active    => 'green',
            self::Inactive  => 'gray',
            self::Suspended => 'red',
            self::Pending   => 'orange',
        };
    }
}
