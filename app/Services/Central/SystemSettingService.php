<?php
// ===== app/Services/Central/SystemSettingService.php =====

declare(strict_types=1);

namespace App\Services\Central;

use App\Models\Central\SystemSetting;
use Illuminate\Support\Collection;

class SystemSettingService
{
    /**
     * Retourne tous les settings regroupés par "group".
     *
     * @return Collection<string, Collection<int, SystemSetting>>
     */
    public function getAll(): Collection
    {
        return SystemSetting::all()->groupBy('group');
    }

    /**
     * Met à jour plusieurs settings d'un coup.
     *
     * @param array<string, mixed> $settings  ['key' => 'value', ...]
     */
    public function updateMany(array $settings): void
    {
        foreach ($settings as $key => $value) {
            $serialized = is_array($value) || is_object($value)
                ? json_encode($value)
                : (string) $value;

            SystemSetting::where('key', $key)->update([
                'value' => $serialized,
            ]);
        }
    }

    /**
     * Retourne les settings publics (visibles côté tenant) sous forme de tableau
     * clé → valeur castée.
     *
     * @return array<string, mixed>
     */
    public function getPublicSettings(): array
    {
        return SystemSetting::getAllPublic()
            ->mapWithKeys(fn (SystemSetting $s): array => [
                $s->key => $s->getCastedValue(),
            ])
            ->all();
    }
}
