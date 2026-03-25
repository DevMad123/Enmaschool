<?php

declare(strict_types=1);

namespace App\Enums;

enum AnnouncementPriority: string
{
    case Low    = 'low';
    case Normal = 'normal';
    case High   = 'high';
    case Urgent = 'urgent';

    public function label(): string
    {
        return match ($this) {
            self::Low    => 'Faible',
            self::Normal => 'Normal',
            self::High   => 'Haute',
            self::Urgent => 'Urgente',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Low    => '#9ca3af',
            self::Normal => '#3b82f6',
            self::High   => '#f97316',
            self::Urgent => '#ef4444',
        };
    }
}
