<?php

declare(strict_types=1);

namespace App\Enums;

enum ReportCardStatus: string
{
    case Draft     = 'draft';
    case Generated = 'generated';
    case Published = 'published';
    case Archived  = 'archived';

    public function label(): string
    {
        return match ($this) {
            self::Draft     => 'Brouillon',
            self::Generated => 'Généré',
            self::Published => 'Publié',
            self::Archived  => 'Archivé',
        };
    }

    public function color(): string
    {
        return match ($this) {
            self::Draft     => 'gray',
            self::Generated => 'blue',
            self::Published => 'green',
            self::Archived  => 'orange',
        };
    }

    public function isEditable(): bool
    {
        return $this === self::Draft;
    }
}
