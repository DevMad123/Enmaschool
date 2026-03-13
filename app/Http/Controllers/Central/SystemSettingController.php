<?php
// ===== app/Http/Controllers/Central/SystemSettingController.php =====

declare(strict_types=1);

namespace App\Http\Controllers\Central;

use App\Http\Controllers\Controller;
use App\Http\Requests\Central\UpdateSystemSettingsRequest;
use App\Http\Resources\Central\SystemSettingResource;
use App\Services\Central\SystemSettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class SystemSettingController extends Controller
{
    use ApiResponse;

    public function __construct(
        private readonly SystemSettingService $settingService
    ) {}

    // -------------------------------------------------------------------------
    // GET /central/settings
    // -------------------------------------------------------------------------

    public function index(): JsonResponse
    {
        $grouped = $this->settingService->getAll();

        // Transformer chaque groupe en collection de resources
        $result = $grouped->map(
            fn ($settings) => SystemSettingResource::collection($settings)
        );

        return $this->success($result);
    }

    // -------------------------------------------------------------------------
    // PUT /central/settings
    // -------------------------------------------------------------------------

    public function update(UpdateSystemSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        // Convertir le tableau [{key, value}, ...] en ['key' => 'value', ...]
        $mapped = collect($validated['settings'])
            ->pluck('value', 'key')
            ->all();

        $this->settingService->updateMany($mapped);

        // Purger le cache des settings
        Cache::forget('system_settings_public');
        Cache::forget('system_settings_all');

        $grouped = $this->settingService->getAll();
        $result  = $grouped->map(
            fn ($settings) => SystemSettingResource::collection($settings)
        );

        return $this->success($result, 'Paramètres mis à jour.');
    }
}
