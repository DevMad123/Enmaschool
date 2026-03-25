<?php

declare(strict_types=1);

namespace App\Listeners;

use App\Enums\NotificationType;
use App\Events\NotificationReceived;
use App\Jobs\SendNotificationEmailJob;

class SendNotificationEmailListener
{
    public function handle(NotificationReceived $event): void
    {
        $emailTypes = [
            NotificationType::BULLETIN_PUBLISHED,
            NotificationType::PAYMENT_OVERDUE,
            NotificationType::JUSTIFICATION_REVIEWED,
        ];

        if (in_array($event->notification->type, $emailTypes, true)) {
            SendNotificationEmailJob::dispatch($event->notification->id);
        }
    }
}
