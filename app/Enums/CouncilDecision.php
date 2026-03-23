<?php

declare(strict_types=1);

namespace App\Enums;

enum CouncilDecision: string
{
    case Pass        = 'pass';
    case Repeat      = 'repeat';
    case Conditional = 'conditional';
    case Transfer    = 'transfer';
    case Excluded    = 'excluded';
    case Honor       = 'honor';

    public function label(): string
    {
        return match ($this) {
            self::Pass        => 'Admis(e) en classe supérieure',
            self::Repeat      => 'Redouble',
            self::Conditional => 'Passage conditionnel',
            self::Transfer    => 'Orienté(e)',
            self::Excluded    => 'Exclu(e)',
            self::Honor       => 'Admis(e) avec mention',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Pass        => 'green',
            self::Repeat      => 'red',
            self::Conditional => 'orange',
            self::Transfer    => 'blue',
            self::Excluded    => 'red',
            self::Honor       => 'purple',
        };
    }
}
