<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Requests\Tenant\SendMessageRequest;
use App\Http\Requests\Tenant\StoreConversationRequest;
use App\Http\Resources\Tenant\ConversationResource;
use App\Http\Resources\Tenant\MessageResource;
use App\Http\Resources\Tenant\UnreadCountsResource;
use App\Models\Tenant\Announcement;
use App\Models\Tenant\Conversation;
use App\Models\Tenant\Message;
use App\Services\Tenant\ConversationService;
use App\Services\Tenant\MessageService;
use App\Services\Tenant\NotificationService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ConversationController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ConversationService $convService,
        private readonly MessageService $msgService,
        private readonly NotificationService $notifService,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $user  = $request->user();
        $convs = $this->convService->listForUser($user);

        return $this->paginated(
            $convs->through(fn ($c) => new ConversationResource($c)),
        );
    }

    public function store(StoreConversationRequest $request): JsonResponse
    {
        $user = $request->user();
        $data = $request->validated();

        if ($data['type'] === 'direct') {
            $otherUser = \App\Models\Tenant\User::findOrFail($data['user_ids'][0]);
            $conv      = $this->convService->findOrCreateDirect($user, $otherUser);
        } else {
            $conv = $this->convService->createGroup($data, $user);
        }

        $conv->load(['participants.user', 'lastMessage']);

        return $this->successResponse(ConversationResource::make($conv), 'Conversation créée.', 201);
    }

    public function show(Request $request, string $conversation): JsonResponse
    {
        $conv = $this->convService->get($conversation, $request->user());

        return $this->successResponse(ConversationResource::make($conv));
    }

    public function messages(Request $request, string $conversation): JsonResponse
    {
        $conv = Conversation::findOrFail($conversation);

        if (! $conv->isParticipant($request->user())) {
            abort(403);
        }

        $messages = $this->msgService->getMessages($conv, $request->user(), $request->all());

        return $this->paginated(
            $messages->through(fn ($m) => new MessageResource($m)),
        );
    }

    public function sendMessage(SendMessageRequest $request, string $conversation): JsonResponse
    {
        $conv = Conversation::findOrFail($conversation);
        $data = $request->validated();

        if ($request->hasFile('attachment')) {
            $data['attachment'] = $request->file('attachment');
        }

        $message = $this->msgService->send($conv, $request->user(), $data);

        return $this->successResponse(MessageResource::make($message), 'Message envoyé.', 201);
    }

    public function editMessage(Request $request, string $conversation, string $message): JsonResponse
    {
        $msg     = Message::findOrFail($message);
        $updated = $this->msgService->edit($msg, $request->input('body', ''), $request->user());

        return $this->successResponse(MessageResource::make($updated));
    }

    public function deleteMessage(Request $request, string $conversation, string $message): JsonResponse
    {
        $msg = Message::findOrFail($message);
        $this->msgService->delete($msg, $request->user());

        return $this->successResponse(null, 'Message supprimé.');
    }

    public function markRead(Request $request, string $conversation): JsonResponse
    {
        $conv = Conversation::findOrFail($conversation);
        $this->convService->markAsRead($conv, $request->user());

        return $this->successResponse(null, 'Conversation marquée comme lue.');
    }

    public function unreadCounts(Request $request): JsonResponse
    {
        $user = $request->user();

        // Messages non lus : compter les convs avec unread > 0
        $msgCount = Conversation::forUser($user)
            ->with('participants')
            ->get()
            ->sum(fn($c) => $c->getUnreadCountFor($user));

        $notifCount = $this->notifService->getUnreadCount($user);

        $announcementCount = Announcement::forUser($user)
            ->whereDoesntHave('reads', fn($q) => $q->where('user_id', $user->id))
            ->count();

        return $this->successResponse(UnreadCountsResource::make([
            'messages'      => $msgCount,
            'notifications' => $notifCount,
            'announcements' => $announcementCount,
        ]));
    }
}
