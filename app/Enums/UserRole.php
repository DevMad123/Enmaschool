<?php
// ===== app/Enums/UserRole.php =====

declare(strict_types=1);

namespace App\Enums;

enum UserRole: string
{
    case SchoolAdmin = 'school_admin';
    case Director    = 'director';
    case Teacher     = 'teacher';
    case Accountant  = 'accountant';
    case Staff       = 'staff';
    case Student     = 'student';
    case Parent      = 'parent';

    public function label(): string
    {
        return match ($this) {
            self::SchoolAdmin => 'Administrateur',
            self::Director    => 'Directeur',
            self::Teacher     => 'Enseignant',
            self::Accountant  => 'Comptable',
            self::Staff       => 'Personnel',
            self::Student     => 'Élève',
            self::Parent      => 'Parent',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::SchoolAdmin => 'purple',
            self::Director    => 'blue',
            self::Teacher     => 'green',
            self::Accountant  => 'orange',
            self::Staff       => 'gray',
            self::Student     => 'cyan',
            self::Parent      => 'pink',
        };
    }

    /**
     * Rôles du personnel (exclut student et parent).
     *
     * @return self[]
     */
    public static function staffRoles(): array
    {
        return [
            self::SchoolAdmin,
            self::Director,
            self::Teacher,
            self::Accountant,
            self::Staff,
        ];
    }

    /**
     * Rôles qu'un utilisateur donné peut gérer.
     *
     * @return self[]
     */
    public function manageable(): array
    {
        return match ($this) {
            self::SchoolAdmin => [self::Director, self::Teacher, self::Accountant, self::Staff],
            self::Director    => [self::Teacher, self::Accountant, self::Staff],
            default           => [],
        };
    }
}
