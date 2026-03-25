<?php

declare(strict_types=1);

namespace App\Enums;

enum ConversationType: string
{
    case Direct = 'direct';
    case Group  = 'group';

    public function label(): string
    {
        return match ($this) {
            self::Direct => 'Direct',
            self::Group  => 'Groupe',
        };
    }
}
