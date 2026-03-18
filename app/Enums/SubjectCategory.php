<?php

declare(strict_types=1);

namespace App\Enums;

enum SubjectCategory: string
{
    case Litteraire = 'litteraire';
    case Scientifique = 'scientifique';
    case Technique = 'technique';
    case Artistique = 'artistique';
    case Sportif = 'sportif';

    public function label(): string
    {
        return match ($this) {
            self::Litteraire => 'Littéraire',
            self::Scientifique => 'Scientifique',
            self::Technique => 'Technique',
            self::Artistique => 'Artistique',
            self::Sportif => 'Sportif',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Litteraire => '#f59e0b',
            self::Scientifique => '#3b82f6',
            self::Technique => '#8b5cf6',
            self::Artistique => '#ec4899',
            self::Sportif => '#22c55e',
        };
    }
}
