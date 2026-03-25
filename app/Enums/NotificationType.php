<?php

declare(strict_types=1);

namespace App\Enums;

final class NotificationType
{
    const BULLETIN_PUBLISHED      = 'bulletin_published';
    const ABSENCE_RECORDED        = 'absence_recorded';
    const JUSTIFICATION_SUBMITTED = 'justification_submitted';
    const JUSTIFICATION_REVIEWED  = 'justification_reviewed';
    const PAYMENT_OVERDUE         = 'payment_overdue';
    const PAYMENT_RECEIVED        = 'payment_received';
    const TIMETABLE_CHANGE        = 'timetable_change';
    const INVITATION_SENT         = 'invitation_sent';
    const ANNOUNCEMENT_PUBLISHED  = 'announcement_published';
    const GRADE_PUBLISHED         = 'grade_published';

    public static function getTitle(string $type, array $data = []): string
    {
        return match ($type) {
            self::BULLETIN_PUBLISHED      => 'Bulletin de ' . ($data['student_name'] ?? 'élève') . ' publié',
            self::ABSENCE_RECORDED        => 'Absence signalée — ' . ($data['student_name'] ?? 'élève'),
            self::JUSTIFICATION_SUBMITTED => 'Justification soumise — ' . ($data['student_name'] ?? 'élève'),
            self::JUSTIFICATION_REVIEWED  => 'Justification ' . ($data['status'] === 'approved' ? 'approuvée' : 'refusée'),
            self::PAYMENT_OVERDUE         => 'Paiement en retard — ' . ($data['student_name'] ?? 'élève'),
            self::PAYMENT_RECEIVED        => 'Paiement reçu — ' . ($data['student_name'] ?? 'élève'),
            self::TIMETABLE_CHANGE        => 'Modification emploi du temps',
            self::INVITATION_SENT         => "Invitation à rejoindre l'école",
            self::ANNOUNCEMENT_PUBLISHED  => 'Nouvelle annonce : ' . ($data['title'] ?? ''),
            self::GRADE_PUBLISHED         => 'Notes publiées — ' . ($data['classe_name'] ?? ''),
            default                       => 'Notification',
        };
    }

    public static function getIcon(string $type): string
    {
        return match ($type) {
            self::BULLETIN_PUBLISHED                                        => 'FileText',
            self::ABSENCE_RECORDED                                          => 'UserX',
            self::JUSTIFICATION_SUBMITTED, self::JUSTIFICATION_REVIEWED     => 'ClipboardCheck',
            self::PAYMENT_OVERDUE                                           => 'AlertCircle',
            self::PAYMENT_RECEIVED                                          => 'CheckCircle',
            self::TIMETABLE_CHANGE                                          => 'CalendarX',
            self::INVITATION_SENT                                           => 'MailPlus',
            self::ANNOUNCEMENT_PUBLISHED                                    => 'Megaphone',
            self::GRADE_PUBLISHED                                           => 'ClipboardList',
            default                                                         => 'Bell',
        };
    }

    public static function getColor(string $type): string
    {
        return match ($type) {
            self::BULLETIN_PUBLISHED      => '#3b82f6',
            self::ABSENCE_RECORDED        => '#ef4444',
            self::JUSTIFICATION_SUBMITTED => '#f59e0b',
            self::JUSTIFICATION_REVIEWED  => '#10b981',
            self::PAYMENT_OVERDUE         => '#ef4444',
            self::PAYMENT_RECEIVED        => '#10b981',
            self::TIMETABLE_CHANGE        => '#f97316',
            self::INVITATION_SENT         => '#8b5cf6',
            self::ANNOUNCEMENT_PUBLISHED  => '#6366f1',
            self::GRADE_PUBLISHED         => '#0ea5e9',
            default                       => '#6b7280',
        };
    }

    public static function getActionUrl(string $type, array $data = []): ?string
    {
        return match ($type) {
            self::BULLETIN_PUBLISHED                                    => isset($data['report_card_id']) ? "/school/report-cards/{$data['report_card_id']}" : null,
            self::ABSENCE_RECORDED,
            self::JUSTIFICATION_SUBMITTED,
            self::JUSTIFICATION_REVIEWED                                => '/school/attendance',
            self::PAYMENT_OVERDUE,
            self::PAYMENT_RECEIVED                                      => isset($data['enrollment_id']) ? "/school/payments/student/{$data['enrollment_id']}" : '/school/payments',
            self::TIMETABLE_CHANGE                                      => '/school/timetable',
            self::GRADE_PUBLISHED                                       => '/school/grades',
            self::ANNOUNCEMENT_PUBLISHED                                => '/school/announcements',
            default                                                     => null,
        };
    }
}
