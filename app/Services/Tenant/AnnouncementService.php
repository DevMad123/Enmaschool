<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Jobs\NotifyAnnouncementJob;
use App\Models\Tenant\Announcement;
use App\Models\Tenant\AnnouncementRead;
use App\Models\Tenant\User;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Pagination\LengthAwarePaginator;

class AnnouncementService
{
    public function list(User $user, array $filters = []): LengthAwarePaginator
    {
        $query = Announcement::forUser($user)
            ->with('createdBy')
            ->withCount('reads');

        if (isset($filters['type'])) {
            $query->where('type', $filters['type']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        if (isset($filters['is_read']) && $filters['is_read'] === false) {
            $query->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $user->id));
        }

        return $query->latest('published_at')->paginate($filters['per_page'] ?? 15);
    }

    public function create(array $data, User $createdBy): Announcement
    {
        $attachmentPath = null;

        if (isset($data['attachment']) && $data['attachment'] instanceof UploadedFile) {
            $attachmentPath = $data['attachment']->store('announcements', 'public');
        }

        $now         = now();
        $isImmediate = empty($data['publish_at']) || Carbon::parse($data['publish_at'])->isPast();

        $announcement = Announcement::create([
            'title'            => $data['title'],
            'body'             => $data['body'],
            'type'             => $data['type'],
            'priority'         => $data['priority'] ?? 'normal',
            'target_roles'     => $data['target_roles'],
            'target_class_ids' => $data['target_class_ids'] ?? null,
            'attachment_path'  => $attachmentPath,
            'publish_at'       => $data['publish_at'] ?? null,
            'expires_at'       => $data['expires_at'] ?? null,
            'is_published'     => $isImmediate,
            'published_at'     => $isImmediate ? $now : null,
            'created_by'       => $createdBy->id,
        ]);

        if ($isImmediate) {
            NotifyAnnouncementJob::dispatch($announcement->id);
        }

        return $announcement;
    }

    public function publish(Announcement $announcement): Announcement
    {
        $announcement->update(['is_published' => true, 'published_at' => now()]);
        NotifyAnnouncementJob::dispatch($announcement->id);

        return $announcement;
    }

    public function update(Announcement $announcement, array $data): Announcement
    {
        $announcement->update($data);

        return $announcement;
    }

    public function delete(Announcement $announcement): void
    {
        $announcement->delete();
    }

    public function markRead(Announcement $announcement, User $user): void
    {
        AnnouncementRead::firstOrCreate(
            ['announcement_id' => $announcement->id, 'user_id' => $user->id],
            ['read_at' => now()],
        );
    }

    public function markAllRead(User $user): int
    {
        $announcements = Announcement::forUser($user)
            ->whereDoesntHave('reads', fn ($q) => $q->where('user_id', $user->id))
            ->pluck('id');

        $count = $announcements->count();

        foreach ($announcements as $id) {
            AnnouncementRead::firstOrCreate(
                ['announcement_id' => $id, 'user_id' => $user->id],
                ['read_at' => now()],
            );
        }

        return $count;
    }
}
