<?php

declare(strict_types=1);

namespace App\Enums;

enum LyceeSerie: string
{
    case A = 'A';
    case B = 'B';
    case C = 'C';
    case D = 'D';
    case F1 = 'F1';
    case F2 = 'F2';
    case G1 = 'G1';
    case G2 = 'G2';
    case G3 = 'G3';

    public function label(): string
    {
        return "Série {$this->value}";
    }

    public function shortLabel(): string
    {
        return $this->value;
    }
}
