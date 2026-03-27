<?php

declare(strict_types=1);

namespace App\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Http\Resources\Tenant\SchoolSettingResource;
use App\Models\Tenant\SchoolSetting;
use App\Services\Tenant\SchoolSettingService;
use App\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

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

    public function uploadLogo(Request $request): JsonResponse
    {
        $request->validate([
            'logo' => 'required|image|mimes:png,jpg,jpeg,svg+xml,svg|max:2048',
        ]);

        $tenantId = tenant('id') ?? 'default';
        $disk     = 'public';
        $dir      = "logos/{$tenantId}";

        // Delete old logo if it exists
        $old = SchoolSetting::where('key', 'school_logo_path')->value('value');
        if ($old && Storage::disk($disk)->exists($old)) {
            Storage::disk($disk)->delete($old);
        }

        $path = $request->file('logo')->store($dir, $disk);
        $url  = Storage::disk($disk)->url($path);

        $this->service->update('school_logo_path', $path);

        return $this->success(data: ['url' => $url, 'path' => $path], message: 'Logo mis à jour.');
    }

    public function getLogo(): JsonResponse
    {
        $path = SchoolSetting::where('key', 'school_logo_path')->value('value');
        $url  = ($path && Storage::disk('public')->exists($path))
            ? Storage::disk('public')->url($path)
            : null;

        return $this->success(data: ['url' => $url]);
    }
}
