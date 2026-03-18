<?php
// ===== app/Enums/InvitationStatus.php =====

declare(strict_types=1);

namespace App\Enums;

enum InvitationStatus: string
{
    case Pending  = 'pending';
    case Accepted = 'accepted';
    case Expired  = 'expired';
    case Revoked  = 'revoked';

    public function label(): string
    {
        return match ($this) {
            self::Pending  => 'En attente',
            self::Accepted => 'Acceptée',
            self::Expired  => 'Expirée',
            self::Revoked  => 'Révoquée',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pending  => 'blue',
            self::Accepted => 'green',
            self::Expired  => 'gray',
            self::Revoked  => 'red',
        };
    }
}
