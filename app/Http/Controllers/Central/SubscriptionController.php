<?php
// ===== app/Http/Controllers/Central/SubscriptionController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Resources\Central\SubscriptionResource;
use App\Models\Central\Plan;
use App\Models\Central\Subscription;
use App\Models\Central\Tenant;
use App\Services\Central\SubscriptionService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SubscriptionController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SubscriptionService $subscriptionService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/subscriptions
    // -------------------------------------------------------------------------

    public function index(Request $request): JsonResponse
    {
        $query = Subscription::with(['plan', 'tenant'])
            ->orderBy('created_at', 'desc');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('tenant_id')) {
            $query->where('tenant_id', $request->input('tenant_id'));
        }

        if ($request->filled('plan_id')) {
            $query->where('plan_id', (int) $request->input('plan_id'));
        }

        if ($request->boolean('expires_soon')) {
            $query->where('ends_at', '<=', now()->addDays(7))
                ->whereNotNull('ends_at')
                ->whereIn('status', ['active', 'trial']);
        }

        $paginator = $query->paginate(20);

        return $this->paginated(
            $paginator->setCollection(
                $paginator->getCollection()->transform(
                    fn (Subscription $s) => new SubscriptionResource($s)
                )
            )
        );
    }

    // -------------------------------------------------------------------------
    // POST /central/tenants/{tenant}/subscriptions
    // -------------------------------------------------------------------------

    public function assignPlan(Request $request, Tenant $tenant): JsonResponse
    {
        $validated = $request->validate([
            'plan_id'       => ['required', 'integer', 'exists:central.plans,id'],
            'billing_cycle' => ['nullable', 'string', 'in:monthly,yearly,custom'],
            'starts_at'     => ['nullable', 'date'],
            'ends_at'       => ['nullable', 'date', 'after_or_equal:starts_at'],
            'price_paid'    => ['nullable', 'numeric', 'min:0'],
            'notes'         => ['nullable', 'string', 'max:1000'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        $plan = Plan::findOrFail($validated['plan_id']);

        $subscription = $this->subscriptionService->assignPlan(
            $tenant,
            $plan,
            [
                'starts_at'     => $validated['starts_at'] ?? null,
                'ends_at'       => $validated['ends_at'] ?? null,
                'billing_cycle' => $validated['billing_cycle'] ?? null,
                'price_paid'    => $validated['price_paid'] ?? null,
                'notes'         => $validated['notes'] ?? null,
            ],
            $admin
        );

        $subscription->load('plan');

        return $this->success(new SubscriptionResource($subscription), 'Plan assigné avec succès.', 201);
    }

    // -------------------------------------------------------------------------
    // DELETE /central/subscriptions/{subscription}
    // -------------------------------------------------------------------------

    public function cancel(Request $request, Subscription $subscription): JsonResponse
    {
        $validated = $request->validate([
            'reason' => ['required', 'string', 'max:500'],
        ]);

        /** @var \App\Models\Central\SuperAdmin $admin */
        $admin = $request->user();

        $this->subscriptionService->cancelSubscription(
            $subscription,
            $validated['reason'],
            $admin
        );

        return $this->success(null, 'Abonnement annulé.');
    }

    // -------------------------------------------------------------------------
    // GET /central/tenants/{tenant}/subscriptions
    // -------------------------------------------------------------------------

    public function history(Tenant $tenant): JsonResponse
    {
        $subscriptions = $tenant->subscriptions()
            ->with('plan')
            ->orderBy('created_at', 'desc')
            ->get();

        return $this->success(SubscriptionResource::collection($subscriptions));
    }
}
