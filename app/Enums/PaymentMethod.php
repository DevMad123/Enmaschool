<?php

declare(strict_types=1);

namespace App\Enums;

enum PaymentMethod: string
{
    case Cash         = 'cash';
    case Wave         = 'wave';
    case OrangeMoney  = 'orange_money';
    case Mtn          = 'mtn';
    case BankTransfer = 'bank_transfer';
    case Check        = 'check';
    case Other        = 'other';

    public function label(): string
    {
        return match ($this) {
            self::Cash         => 'Espèces',
            self::Wave         => 'Wave',
            self::OrangeMoney  => 'Orange Money',
            self::Mtn          => 'MTN Money',
            self::BankTransfer => 'Virement bancaire',
            self::Check        => 'Chèque',
            self::Other        => 'Autre',
        };
    }

    /** Nom de l'icône lucide-react associée. */
    public function icon(): string
    {
        return match ($this) {
            self::Cash         => 'Banknote',
            self::Wave         => 'Waves',
            self::OrangeMoney  => 'Smartphone',
            self::Mtn          => 'Smartphone',
            self::BankTransfer => 'Building2',
            self::Check        => 'FileText',
            self::Other        => 'CreditCard',
        };
    }

    /**
     * Indique si ce mode de paiement nécessite une référence de transaction.
     * (mobile money, virement, chèque)
     */
    public function requiresReference(): bool
    {
        return in_array($this, [
            self::Wave,
            self::OrangeMoney,
            self::Mtn,
            self::BankTransfer,
            self::Check,
        ], true);
    }
}
