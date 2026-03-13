<?php
// ===== app/Http/Controllers/Central/SupportTicketController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Enums\ActivityType;
use App\Enums\TicketStatus;
use App\Http\Controllers\Controller;
use App\Http\Resources\Central\SupportTicketResource;
use App\Models\Central\SupportTicket;
use App\Models\Central\TicketReply;
use App\Services\Central\ActivityLogService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SupportTicketController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ActivityLogService $activityLogService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/tickets
    // -------------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $query = SupportTicket::with(['assignee'])
            ->withCount('replies')
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('priority')) {
            $query->where('priority', $request->input('priority'));
        }

        if ($request->filled('assigned_to')) {
            $query->where('assigned_to', (int) $request->input('assigned_to'));
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->input('tenant_id'));
        }

        // Tri priorité
        if ($request->input('sort') === 'priority') {
            $query->orderByRaw("CASE priority WHEN 'urgent' THEN 1 WHEN 'high' THEN 2 WHEN 'medium' THEN 3 ELSE 4 END");
        }

        $paginator = $query->paginate(20);

        return $this->paginated(
            $paginator->setCollection(
                $paginator->getCollection()->transform(
                    fn (SupportTicket $t) => new SupportTicketResource($t)
                )
            )
        );
    }

    // -------------------------------------------------------------------------
    // POST /central/tickets
    // -------------------------------------------------------------------------

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tenant_id'          => ['required', 'string', 'exists:central.tenants,id'],
            'tenant_name'        => ['sometimes', 'nullable', 'string', 'max:255'],
            'submitted_by_name'  => ['required', 'string', 'max:255'],
            'submitted_by_email' => ['required', 'email', 'max:255'],
            'subject'            => ['required', 'string', 'max:255'],
            'description'        => ['required', 'string'],
            'priority'           => ['required', 'string', 'in:low,medium,high,urgent'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        // Résoudre tenant_name si non fourni
        if (empty($validated['tenant_name'])) {
            $tenant = \App\Models\Central\Tenant::find($validated['tenant_id']);
            $validated['tenant_name'] = $tenant?->name;
        }

        $ticket = SupportTicket::create(array_merge($validated, [
            'status' => TicketStatus::Open->value,
        ]));

        $this->activityLogService->logSuperAdminAction(
            admin: $admin,
            type: ActivityType::Create->value,
            description: "Ticket créé : «{$ticket->subject}»",
            extra: [
                'tenant_id'   => $ticket->tenant_id,
                'tenant_name' => $ticket->tenant_name,
                'subject_type' => 'support_ticket',
                'subject_id'   => $ticket->id,
                'subject_name' => $ticket->subject,
            ]
        );

        $ticket->loadCount('replies');

        return $this->success(new SupportTicketResource($ticket), 'Ticket créé.', 201);
    }

    // -------------------------------------------------------------------------
    // GET /central/tickets/{ticket}
    // -------------------------------------------------------------------------

    public function show(SupportTicket $ticket): JsonResponse
    {
        $ticket->load(['assignee', 'replies', 'tenant']);
        $ticket->loadCount('replies');

        return $this->success(new SupportTicketResource($ticket));
    }

    // -------------------------------------------------------------------------
    // PUT /central/tickets/{ticket}
    // -------------------------------------------------------------------------

    public function update(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'status'      => ['sometimes', 'string', 'in:open,in_progress,resolved,closed'],
            'priority'    => ['sometimes', 'string', 'in:low,medium,high,urgent'],
            'assigned_to' => ['sometimes', 'nullable', 'integer', 'exists:central.super_admins,id'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        $oldStatus = $ticket->status?->value;
        $ticket->update($validated);

        // Log si changement de statut
        if (isset($validated['status']) && $validated['status'] !== $oldStatus) {
            $this->activityLogService->logSuperAdminAction(
                admin: $admin,
                type: 'update',
                description: "Statut du ticket #{$ticket->id} changé : {$oldStatus} → {$validated['status']}",
                extra: [
                    'tenant_id'    => $ticket->tenant_id,
                    'tenant_name'  => $ticket->tenant_name,
                    'subject_type' => 'support_ticket',
                    'subject_id'   => $ticket->id,
                    'subject_name' => $ticket->subject,
                ]
            );
        }

        $ticket->load('assignee');
        $ticket->loadCount('replies');

        return $this->success(new SupportTicketResource($ticket), 'Ticket mis à jour.');
    }

    // -------------------------------------------------------------------------
    // POST /central/tickets/{ticket}/reply
    // -------------------------------------------------------------------------

    public function reply(Request $request, SupportTicket $ticket): JsonResponse
    {
        $validated = $request->validate([
            'message'     => ['required', 'string'],
            'attachments' => ['sometimes', 'nullable', 'array'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        TicketReply::create([
            'ticket_id'   => $ticket->id,
            'message'     => $validated['message'],
            'attachments' => $validated['attachments'] ?? [],
            'author_type' => 'super_admin',
            'author_id'   => $admin->id,
        ]);

        // Si le ticket est ouvert, passer à in_progress
        if ($ticket->status === TicketStatus::Open) {
            $ticket->update(['status' => TicketStatus::InProgress->value]);
        }

        $ticket->load('assignee');
        $ticket->loadCount('replies');

        return $this->success(new SupportTicketResource($ticket), 'Réponse ajoutée.');
    }

    // -------------------------------------------------------------------------
    // POST /central/tickets/{ticket}/close
    // -------------------------------------------------------------------------

    public function close(SupportTicket $ticket): JsonResponse
    {
        $ticket->update([
            'status'    => TicketStatus::Closed->value,
            'closed_at' => now(),
        ]);

        return $this->success(null, 'Ticket fermé.');
    }
}
