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
            if (is_array($value) || is_object($value)) {
                $serialized = json_encode($value);
            } elseif (is_bool($value)) {
                $serialized = $value ? 'true' : 'false';
            } elseif ($value === null) {
                $serialized = '';
            } else {
                $serialized = (string) $value;
            }

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
