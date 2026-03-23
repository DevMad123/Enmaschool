<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Enums\Gender;
use App\Enums\ParentRelationship;
use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\ParentResource;
use App\Models\Tenant\ParentModel;
use App\Services\Tenant\ParentService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class ParentController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly ParentService $service,
    ) {}

    public function index(Request $request): JsonResponse
    {
        $query = ParentModel::withCount('students');

        if ($request->filled('search')) {
            $term = $request->input('search');
            $query->where(function ($q) use ($term): void {
                $q->where('last_name', 'ILIKE', "%{$term}%")
                  ->orWhere('first_name', 'ILIKE', "%{$term}%")
                  ->orWhere('phone', 'ILIKE', "%{$term}%")
                  ->orWhere('email', 'ILIKE', "%{$term}%");
            });
        }

        $parents = $query->orderBy('last_name')->paginate(25);

        return $this->paginated(
            $parents->through(fn ($p) => new ParentResource($p)),
        );
    }

    public function show(ParentModel $parent): JsonResponse
    {
        $parent->loadCount('students');

        return $this->success(new ParentResource($parent));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate([
            'first_name'           => ['required', 'string', 'max:100'],
            'last_name'            => ['required', 'string', 'max:100'],
            'gender'               => ['required', Rule::in(array_column(Gender::cases(), 'value'))],
            'relationship'         => ['required', Rule::in(array_column(ParentRelationship::cases(), 'value'))],
            'phone'                => ['nullable', 'string', 'max:20'],
            'phone_secondary'      => ['nullable', 'string', 'max:20'],
            'email'                => ['nullable', 'email'],
            'profession'           => ['nullable', 'string'],
            'address'              => ['nullable', 'string'],
            'national_id'          => ['nullable', 'string'],
            'is_emergency_contact' => ['nullable', 'boolean'],
            'notes'                => ['nullable', 'string'],
        ]);

        $parent = $this->service->create($data);

        return $this->created(new ParentResource($parent));
    }

    public function update(Request $request, ParentModel $parent): JsonResponse
    {
        $data = $request->validate([
            'first_name'           => ['sometimes', 'string', 'max:100'],
            'last_name'            => ['sometimes', 'string', 'max:100'],
            'gender'               => ['sometimes', Rule::in(array_column(Gender::cases(), 'value'))],
            'relationship'         => ['sometimes', Rule::in(array_column(ParentRelationship::cases(), 'value'))],
            'phone'                => ['nullable', 'string', 'max:20'],
            'phone_secondary'      => ['nullable', 'string', 'max:20'],
            'email'                => ['nullable', 'email'],
            'profession'           => ['nullable', 'string'],
            'address'              => ['nullable', 'string'],
            'national_id'          => ['nullable', 'string'],
            'is_emergency_contact' => ['nullable', 'boolean'],
            'notes'                => ['nullable', 'string'],
        ]);

        $updated = $this->service->update($parent, $data);

        return $this->success(new ParentResource($updated));
    }

    public function destroy(ParentModel $parent): JsonResponse
    {
        try {
            $this->service->delete($parent);

            return $this->deleted();
        } catch (\RuntimeException $e) {
            return $this->error($e->getMessage(), 422);
        }
    }
}
