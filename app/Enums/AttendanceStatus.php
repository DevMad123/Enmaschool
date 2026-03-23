<?php

declare(strict_types=1);

namespace App\Enums;

enum AttendanceStatus: string
{
    case Present = 'present';
    case Absent  = 'absent';
    case Late    = 'late';
    case Excused = 'excused';

    public function label(): string
    {
        return match ($this) {
            self::Present => 'Présent',
            self::Absent  => 'Absent',
            self::Late    => 'En retard',
            self::Excused => 'Absent justifié',
        };
    }

    public function short(): string
    {
        return match ($this) {
            self::Present => 'P',
            self::Absent  => 'A',
            self::Late    => 'R',
            self::Excused => 'AJ',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Present => 'green',
            self::Absent  => 'red',
            self::Late    => 'orange',
            self::Excused => 'blue',
        };
    }

    /** Absent ou justifié (non présent physiquement) */
    public function isAbsent(): bool
    {
        return in_array($this, [self::Absent, self::Excused], true);
    }

    /** Présent ou en retard (physiquement là) */
    public function isPresent(): bool
    {
        return in_array($this, [self::Present, self::Late], true);
    }

    /** Impacte le compteur d'absences NON justifiées */
    public function countsAsAbsent(): bool
    {
        return $this === self::Absent;
    }

    /** Impacte le compteur d'absences justifiées */
    public function countsAsExcused(): bool
    {
        return $this === self::Excused;
    }
}
