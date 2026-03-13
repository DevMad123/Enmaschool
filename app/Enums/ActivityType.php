<?php
// ===== app/Enums/ActivityType.php =====

declare(strict_types=1);

namespace App\Enums;

enum ActivityType: string
{
    case Login    = 'login';
    case Logout   = 'logout';
    case Create   = 'create';
    case Update   = 'update';
    case Delete   = 'delete';
    case Export   = 'export';
    case Import   = 'import';
    case Generate = 'generate';
    case Payment  = 'payment';

    /**
     * Libellé français du type d'activité.
     */
    public function label(): string
    {
        return match ($this) {
            self::Login    => 'Connexion',
            self::Logout   => 'Déconnexion',
            self::Create   => 'Création',
            self::Update   => 'Modification',
            self::Delete   => 'Suppression',
            self::Export   => 'Export',
            self::Import   => 'Import',
            self::Generate => 'Génération',
            self::Payment  => 'Paiement',
        };
    }
}
