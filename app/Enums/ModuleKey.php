<?php
// ===== app/Enums/ModuleKey.php =====

declare(strict_types=1);

namespace App\Enums;

enum ModuleKey: string
{
    case Grades     = 'grades';
    case Attendance = 'attendance';
    case Timetable  = 'timetable';
    case Payments   = 'payments';
    case Elearning  = 'elearning';
    case Messaging  = 'messaging';
    case Reports    = 'reports';
    case Library    = 'library';
    case Transport  = 'transport';

    /**
     * Libellé français du module.
     */
    public function label(): string
    {
        return match ($this) {
            self::Grades     => 'Notes & Évaluations',
            self::Attendance => 'Présences',
            self::Timetable  => 'Emploi du temps',
            self::Payments   => 'Frais scolaires',
            self::Elearning  => 'E-Learning',
            self::Messaging  => 'Messagerie',
            self::Reports    => 'Rapports & Stats',
            self::Library    => 'Bibliothèque',
            self::Transport  => 'Transport',
        };
    }

    /**
     * Nom de l'icône lucide-react associée.
     */
    public function icon(): string
    {
        return match ($this) {
            self::Grades     => 'ClipboardList',
            self::Attendance => 'UserCheck',
            self::Timetable  => 'Calendar',
            self::Payments   => 'CreditCard',
            self::Elearning  => 'BookOpen',
            self::Messaging  => 'MessageCircle',
            self::Reports    => 'BarChart2',
            self::Library    => 'Library',
            self::Transport  => 'Bus',
        };
    }

    /**
     * Indique si le module est un module core (non désactivable).
     */
    public function isCore(): bool
    {
        return in_array($this, [self::Grades, self::Attendance], true);
    }

    /**
     * Types d'école compatibles avec ce module.
     * Valeurs possibles : 'maternelle', 'primary', 'college', 'lycee'
     *
     * @return list<string>
     */
    public function availableFor(): array
    {
        return match ($this) {
            self::Grades     => ['maternelle', 'primary', 'college', 'lycee'],
            self::Attendance => ['maternelle', 'primary', 'college', 'lycee'],
            self::Timetable  => ['primary', 'college', 'lycee'],
            self::Payments   => ['maternelle', 'primary', 'college', 'lycee'],
            self::Elearning  => ['primary', 'college', 'lycee'],
            self::Messaging  => ['maternelle', 'primary', 'college', 'lycee'],
            self::Reports    => ['maternelle', 'primary', 'college', 'lycee'],
            self::Library    => ['primary', 'college', 'lycee'],
            self::Transport  => ['maternelle', 'primary', 'college', 'lycee'],
        };
    }
}
