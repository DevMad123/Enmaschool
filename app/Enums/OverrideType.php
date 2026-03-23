<?php

declare(strict_types=1);

namespace App\Enums;

enum OverrideType: string
{
    case Cancellation = 'cancellation';
    case Substitution = 'substitution';
    case RoomChange   = 'room_change';
    case Rescheduled  = 'rescheduled';

    public function label(): string
    {
        return match ($this) {
            self::Cancellation => 'Annulation',
            self::Substitution => 'Remplacement',
            self::RoomChange   => 'Changement de salle',
            self::Rescheduled  => 'Reprogrammé',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Cancellation => 'red',
            self::Substitution => 'yellow',
            self::RoomChange   => 'blue',
            self::Rescheduled  => 'purple',
        };
    }
}
