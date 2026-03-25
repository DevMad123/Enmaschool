<?php

declare(strict_types=1);

namespace App\Enums;

enum MessageType: string
{
    case Text   = 'text';
    case File   = 'file';
    case Image  = 'image';
    case System = 'system';

    public function label(): string
    {
        return match ($this) {
            self::Text   => 'Texte',
            self::File   => 'Fichier',
            self::Image  => 'Image',
            self::System => 'Système',
        };
    }

    public function icon(): string
    {
        return match ($this) {
            self::Text   => 'MessageSquare',
            self::File   => 'Paperclip',
            self::Image  => 'Image',
            self::System => 'Info',
        };
    }
}
