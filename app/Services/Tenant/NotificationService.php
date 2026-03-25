<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\NotificationType;
use App\Events\NotificationReceived;
use App\Models\Tenant\Attendance;
use App\Models\Tenant\Notification;
use App\Models\Tenant\StudentFee;
use App\Models\Tenant\User;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Pagination\LengthAwarePaginator;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class NotificationService
{
    public function notify(int $userId, string $type, array $data = [], ?Model $notifiable = null): Notification
    {
        $icon      = NotificationType::getIcon($type);
        $color     = NotificationType::getColor($type);
        $title     = NotificationType::getTitle($type, $data);
        $actionUrl = NotificationType::getActionUrl($type, $data);

        $notification = Notification::create([
            'id'              => (string) Str::uuid(),
            'user_id'         => $userId,
            'type'            => $type,
            'title'           => $title,
            'data'            => $data,
            'notifiable_type' => $notifiable ? get_class($notifiable) : null,
            'notifiable_id'   => $notifiable?->getKey(),
            'action_url'      => $actionUrl,
            'icon'            => $icon,
            'color'           => $color,
        ]);

        Cache::forget("notif_unread_{$userId}");
        broadcast(new NotificationReceived($notification));

        return $notification;
    }

    public function notifyMany(array $userIds, string $type, array $data = [], ?Model $notifiable = null): void
    {
        $now   = now()->toDateTimeString();
        $icon  = NotificationType::getIcon($type);
        $color = NotificationType::getColor($type);
        $rows  = [];

        foreach ($userIds as $userId) {
            $title  = NotificationType::getTitle($type, $data);
            $rows[] = [
                'id'              => (string) Str::uuid(),
                'user_id'         => $userId,
                'type'            => $type,
                'title'           => $title,
                'data'            => json_encode($data),
                'notifiable_type' => $notifiable ? get_class($notifiable) : null,
                'notifiable_id'   => $notifiable?->getKey(),
                'action_url'      => NotificationType::getActionUrl($type, $data),
                'icon'            => $icon,
                'color'           => $color,
                'is_read'         => false,
                'created_at'      => $now,
            ];
        }

        if (!empty($rows)) {
            DB::table('notifications')->insert($rows);

            foreach ($userIds as $userId) {
                Cache::forget("notif_unread_{$userId}");
            }
        }
    }

    public function notifyByRole(string $role, string $type, array $data = []): void
    {
        $userIds = User::active()->where('role', $role)->pluck('id')->toArray();
        $this->notifyMany($userIds, $type, $data);
    }

    public function markRead(Notification $notification, User $user): void
    {
        if ($notification->user_id !== $user->id) {
            abort(403);
        }

        $notification->markAsRead();
        Cache::forget("notif_unread_{$user->id}");
    }

    public function markAllRead(User $user): int
    {
        $count = Notification::where('user_id', $user->id)->where('is_read', false)->count();

        Notification::where('user_id', $user->id)->where('is_read', false)->update([
            'is_read' => true,
            'read_at' => now()->toDateTimeString(),
        ]);

        Cache::forget("notif_unread_{$user->id}");

        return $count;
    }

    public function getUnreadCount(User $user): int
    {
        return Cache::remember("notif_unread_{$user->id}", 60, function () use ($user): int {
            return Notification::where('user_id', $user->id)->where('is_read', false)->count();
        });
    }

    public function getForUser(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Notification::forUser($user->id)
            ->orderByRaw('is_read ASC, created_at DESC');

        if (isset($filters['is_read'])) {
            $query->where('is_read', (bool) $filters['is_read']);
        }

        if (isset($filters['type'])) {
            $query->byType($filters['type']);
        }

        return $query->paginate($filters['per_page'] ?? 20);
    }

    // ── Automatic notification methods ──────────────────────────────────────

    public function onBulletinPublished(\App\Models\Tenant\ReportCard $rc): void
    {
        $rc->load(['enrollment.classe', 'enrollment.student', 'period']);

        $data = [
            'report_card_id' => $rc->id,
            'student_name'   => $rc->enrollment->student->full_name ?? '',
            'classe_name'    => $rc->enrollment->classe->display_name ?? '',
            'period_name'    => $rc->period->name ?? '',
        ];

        $teacherIds = User::active()->where('role', 'teacher')->pluck('id')->toArray();
        $this->notifyMany($teacherIds, NotificationType::BULLETIN_PUBLISHED, $data, $rc);
    }

    public function onAbsenceRecorded(Attendance $attendance): void
    {
        if ($attendance->status->value !== 'absent') {
            return;
        }

        $attendance->load(['enrollment.student', 'enrollment.classe', 'subject']);

        $data = [
            'student_name' => $attendance->enrollment->student->full_name ?? '',
            'classe_name'  => $attendance->enrollment->classe->display_name ?? '',
            'date'         => $attendance->date,
            'subject_name' => $attendance->subject->name ?? '',
        ];

        $adminIds = User::active()
            ->whereIn('role', ['school_admin', 'director', 'staff'])
            ->pluck('id')
            ->toArray();

        $this->notifyMany($adminIds, NotificationType::ABSENCE_RECORDED, $data, $attendance);
    }

    public function onJustificationSubmitted(\App\Models\Tenant\AbsenceJustification $justif): void
    {
        $data = ['student_name' => $justif->attendance->enrollment->student->full_name ?? ''];

        $adminIds = User::active()
            ->whereIn('role', ['school_admin', 'director'])
            ->pluck('id')
            ->toArray();

        $this->notifyMany($adminIds, NotificationType::JUSTIFICATION_SUBMITTED, $data, $justif);
    }

    public function onJustificationReviewed(\App\Models\Tenant\AbsenceJustification $justif): void
    {
        $data = [
            'student_name' => $justif->attendance->enrollment->student->full_name ?? '',
            'status'       => $justif->status->value ?? '',
            'review_note'  => $justif->review_note ?? '',
        ];

        if ($justif->submitted_by) {
            $this->notify($justif->submitted_by, NotificationType::JUSTIFICATION_REVIEWED, $data, $justif);
        }
    }

    public function onPaymentOverdue(StudentFee $fee): void
    {
        $fee->load(['enrollment.student', 'feeType']);

        $data = [
            'student_name'               => $fee->enrollment->student->full_name ?? '',
            'amount_remaining_formatted' => number_format($fee->amount_remaining, 0, ',', ' ') . ' FCFA',
            'fee_type_name'              => $fee->feeType->name ?? '',
            'enrollment_id'              => $fee->enrollment_id,
        ];

        $accountantIds = User::active()
            ->whereIn('role', ['accountant', 'director'])
            ->pluck('id')
            ->toArray();

        $this->notifyMany($accountantIds, NotificationType::PAYMENT_OVERDUE, $data, $fee);
    }

    public function onTimetableChange(\App\Models\Tenant\TimetableOverride $override): void
    {
        $override->load(['timetableEntry.teacher', 'timetableEntry.subject', 'timetableEntry.classe']);

        $teacherId = $override->timetableEntry->teacher_id ?? null;

        if (!$teacherId) {
            return;
        }

        $data = [
            'type_label'   => $override->type ?? '',
            'date'         => $override->date,
            'subject_name' => $override->timetableEntry->subject->name ?? '',
            'classe_name'  => $override->timetableEntry->classe->display_name ?? '',
            'reason'       => $override->reason ?? '',
        ];

        $this->notify($teacherId, NotificationType::TIMETABLE_CHANGE, $data, $override);
    }
}
