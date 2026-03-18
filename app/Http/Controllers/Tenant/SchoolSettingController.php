<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\SchoolSettingResource;
use App\Services\Tenant\SchoolSettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SchoolSettingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SchoolSettingService $service,
    ) {}

    public function index(): JsonResponse
    {
        $settings = $this->service->getAll();

        $grouped = $settings->groupBy(fn ($s) => $s->group->value);

        return $this->success(
            data: $grouped->map(fn ($items) => SchoolSettingResource::collection($items)),
        );
    }

    public function update(Request $request, string $key): JsonResponse
    {
        $request->validate(['value' => 'required']);

        $setting = $this->service->update($key, $request->input('value'));

        return $this->success(
            data: new SchoolSettingResource($setting),
            message: 'Paramètre mis à jour.',
        );
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $request->validate(['settings' => 'required|array']);

        $this->service->bulkUpdate($request->input('settings'));

        return $this->success(message: 'Paramètres mis à jour.');
    }
}
