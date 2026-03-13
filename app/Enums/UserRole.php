<?php
// ===== app/Enums/UserRole.php =====

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case SchoolAdmin = 'school_admin';
    case Director = 'director';
    case Teacher = 'teacher';
    case Accountant = 'accountant';
    case Staff = 'staff';
    case Student = 'student';
    case Parent = 'parent';

    /**
     * Libellé français du rôle.
     */
    public function label(): string
    {
        return match ($this) {
            self::SchoolAdmin => 'Administrateur scolaire',
            self::Director => 'Directeur',
            self::Teacher => 'Enseignant',
            self::Accountant => 'Comptable',
            self::Staff => 'Personnel',
            self::Student => 'Élève',
            self::Parent => 'Parent',
        };
    }
}
