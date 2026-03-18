<?php

declare(strict_types=1);

namespace App\Enums;

enum PeriodType: string
{
    case Trimestre = 'trimestre';
    case Semestre = 'semestre';

    public function label(): string
    {
        return match ($this) {
            self::Trimestre => 'Trimestre',
            self::Semestre => 'Semestre',
        };
    }

    public function count(): int
    {
        return match ($this) {
            self::Trimestre => 3,
            self::Semestre => 2,
        };
    }

    /**
     * @return string[]
     */
    public function periodNames(): array
    {
        return match ($this) {
            self::Trimestre => ['1er Trimestre', '2ème Trimestre', '3ème Trimestre'],
            self::Semestre => ['1er Semestre', '2ème Semestre'],
        };
    }
}
