<?php
// ===== app/Mail/Central/WelcomeTenantMail.php =====

declare(strict_types=1);

namespace App\Mail\Central;

use App\Models\Central\Tenant;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class WelcomeTenantMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    public function __construct(
        public readonly Tenant $tenant,
        public readonly string $adminEmail,
        public readonly string $adminName,
        public readonly string $tempPassword,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: "Bienvenue sur Enma School — {$this->tenant->name}",
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.central.welcome-tenant',
        );
    }

    public function attachments(): array
    {
        return [];
    }
}
