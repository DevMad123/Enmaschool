<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use App\Enums\SettingGroup;
use App\Models\Tenant\SchoolSetting;
use Illuminate\Support\Collection;

class SchoolSettingService
{
    public function getAll(): Collection
    {
        return SchoolSetting::all();
    }

    public function getByGroup(SettingGroup $group): Collection
    {
        return SchoolSetting::where('group', $group)->get();
    }

    public function update(string $key, mixed $value): SchoolSetting
    {
        $setting = SchoolSetting::where('key', $key)->firstOrFail();

        $setting->update([
            'value' => is_array($value) ? json_encode($value) : (string) $value,
        ]);

        return $setting->fresh();
    }

    public function bulkUpdate(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $this->update($key, $value);
        }
    }
}
