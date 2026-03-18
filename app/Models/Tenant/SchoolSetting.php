<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\SettingGroup;
use App\Enums\SettingType;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class SchoolSetting extends Model
{
    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
    ];

    protected function casts(): array
    {
        return [
            'type' => SettingType::class,
            'group' => SettingGroup::class,
        ];
    }

    protected static function boot(): void
    {
        parent::boot();

        static::saved(function (SchoolSetting $setting): void {
            Cache::forget("school_setting_{$setting->key}");
        });

        static::deleted(function (SchoolSetting $setting): void {
            Cache::forget("school_setting_{$setting->key}");
        });
    }

    public static function get(string $key, mixed $default = null): mixed
    {
        return Cache::remember("school_setting_{$key}", 3600, function () use ($key, $default) {
            $setting = static::where('key', $key)->first();

            if (! $setting) {
                return $default;
            }

            return match ($setting->type) {
                SettingType::Boolean => filter_var($setting->value, FILTER_VALIDATE_BOOLEAN),
                SettingType::Integer => (int) $setting->value,
                SettingType::Float => (float) $setting->value,
                SettingType::Json => json_decode($setting->value, true),
                default => $setting->value,
            };
        });
    }

    public static function set(string $key, mixed $value): void
    {
        $setting = static::where('key', $key)->first();

        if ($setting) {
            $setting->update([
                'value' => is_array($value) ? json_encode($value) : (string) $value,
            ]);
        }
    }
}
