<?php

declare(strict_types=1);

namespace App\Enums;

enum Gender: string
{
    case Male   = 'male';
    case Female = 'female';

    public function label(): string
    {
        return match ($this) {
            self::Male   => 'Masculin',
            self::Female => 'Féminin',
        };
    }

    public function short(): string
    {
        return match ($this) {
            self::Male   => 'M',
            self::Female => 'F',
        };
    }
}
