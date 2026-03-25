<?php

declare(strict_types=1);

namespace App\Enums;

enum AnnouncementType: string
{
    case General  = 'general';
    case Academic = 'academic';
    case Event    = 'event';
    case Alert    = 'alert';
    case Reminder = 'reminder';

    public function label(): string
    {
        return match ($this) {
            self::General  => 'Général',
            self::Academic => 'Pédagogique',
            self::Event    => 'Événement',
            self::Alert    => 'Alerte',
            self::Reminder => 'Rappel',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::General  => 'Megaphone',
            self::Academic => 'BookOpen',
            self::Event    => 'Calendar',
            self::Alert    => 'AlertTriangle',
            self::Reminder => 'Bell',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::General  => '#6b7280',
            self::Academic => '#3b82f6',
            self::Event    => '#8b5cf6',
            self::Alert    => '#ef4444',
            self::Reminder => '#f59e0b',
        };
    }
}
