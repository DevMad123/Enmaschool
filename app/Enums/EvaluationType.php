<?php

declare(strict_types=1);

namespace App\Enums;

enum EvaluationType: string
{
    case Dc           = 'dc';
    case Dm           = 'dm';
    case Composition  = 'composition';
    case Exam         = 'exam';
    case Interrogation = 'interrogation';
    case Tp           = 'tp';
    case Other        = 'other';

    public function label(): string
    {
        return match($this) {
            self::Dc           => 'Devoir de Classe',
            self::Dm           => 'Devoir Maison',
            self::Composition  => 'Composition',
            self::Exam         => 'Examen',
            self::Interrogation => 'Interrogation',
            self::Tp           => 'Travaux Pratiques',
            self::Other        => 'Autre',
        };
    }

    public function short(): string
    {
        return match($this) {
            self::Dc           => 'DC',
            self::Dm           => 'DM',
            self::Composition  => 'COMP',
            self::Exam         => 'EXAM',
            self::Interrogation => 'INTERRO',
            self::Tp           => 'TP',
            self::Other        => 'AUTRE',
        };
    }

    public function color(): string
    {
        return match($this) {
            self::Dc           => 'blue',
            self::Dm           => 'purple',
            self::Composition  => 'orange',
            self::Exam         => 'red',
            self::Interrogation => 'green',
            self::Tp           => 'cyan',
            self::Other        => 'gray',
        };
    }

    public function countsForAverage(): bool
    {
        return $this !== self::Other;
    }

    public function defaultCoefficient(): float
    {
        return match($this) {
            self::Dc           => 1.0,
            self::Dm           => 0.5,
            self::Composition  => 2.0,
            self::Exam         => 3.0,
            self::Interrogation => 0.5,
            self::Tp           => 1.0,
            self::Other        => 1.0,
        };
    }
}
