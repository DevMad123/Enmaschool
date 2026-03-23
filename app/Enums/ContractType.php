<?php

declare(strict_types=1);

namespace App\Enums;

enum ContractType: string
{
    case Permanent = 'permanent';
    case Contract  = 'contract';
    case PartTime  = 'part_time';
    case Interim   = 'interim';

    public function label(): string
    {
        return match ($this) {
            self::Permanent => 'Titulaire',
            self::Contract  => 'Contractuel',
            self::PartTime  => 'Temps partiel',
            self::Interim   => 'Intérimaire',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Permanent => 'green',
            self::Contract  => 'blue',
            self::PartTime  => 'orange',
            self::Interim   => 'gray',
        };
    }
}
