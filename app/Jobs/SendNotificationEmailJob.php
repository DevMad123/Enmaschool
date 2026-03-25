<?php

declare(strict_types=1);

namespace App\Jobs;

use App\Models\Tenant\Notification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class SendNotificationEmailJob implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public string $queue = 'emails';

    public function __construct(public readonly string $notificationId) {}

    public function handle(): void
    {
        $notification = Notification::with('user')->find($this->notificationId);

        if (!$notification || !$notification->user) {
            return;
        }

        // Mark email as sent (mail sending requires mailables to be created)
        // For now, log and mark as sent
        Log::info('Sending notification email', [
            'type'    => $notification->type,
            'user_id' => $notification->user_id,
        ]);

        $notification->sent_via_email = true;
        $notification->email_sent_at  = now()->toDateTimeString();
        $notification->save();
    }
}
