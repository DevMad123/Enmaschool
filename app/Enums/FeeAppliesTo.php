<?php

declare(strict_types=1);

namespace App\Enums;

enum FeeAppliesTo: string
{
    case All        = 'all';
    case Maternelle = 'maternelle';
    case Primaire   = 'primaire';
    case College    = 'college';
    case Lycee      = 'lycee';

    public function label(): string
    {
        return match ($this) {
            self::All        => 'Tous',
            self::Maternelle => 'Maternelle',
            self::Primaire   => 'Primaire',
            self::College    => 'Collège',
            self::Lycee      => 'Lycée',
        };
    }

    /**
     * Indique si ce type de frais s'applique à la catégorie donnée.
     * Un frais 'all' s'applique à toutes les catégories.
     */
    public function matchesCategory(string $category): bool
    {
        if ($this === self::All) {
            return true;
        }

        return $this->value === $category;
    }
}
