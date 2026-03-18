<?php

declare(strict_types=1);

namespace App\Enums;

enum SettingGroup: string
{
    case General = 'general';
    case Academic = 'academic';
    case Grading = 'grading';
    case Attendance = 'attendance';
    case Fees = 'fees';
    case Notifications = 'notifications';

    public function label(): string
    {
        return match ($this) {
            self::General => 'Général',
            self::Academic => 'Académique',
            self::Grading => 'Notes & Évaluations',
            self::Attendance => 'Présences',
            self::Fees => 'Frais de scolarité',
            self::Notifications => 'Notifications',
        };
    }
}
