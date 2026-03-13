<?php
// ===== app/Models/Central/SystemSetting.php =====

declare(strict_types=1);

namespace App\Models\Central;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class SystemSetting extends Model
{
    protected $connection = 'central';

    protected $fillable = [
        'key',
        'value',
        'type',
        'group',
        'label',
        'description',
        'is_public',
    ];

    protected function casts(): array
    {
        return [
            'is_public' => 'boolean',
        ];
    }

    // -------------------------------------------------------------------------
    // Instance methods
    // -------------------------------------------------------------------------

    /**
     * Retourne la valeur castée selon le type du setting.
     */
    public function getCastedValue(): mixed
    {
        return match ($this->type) {
            'boolean' => filter_var($this->value, FILTER_VALIDATE_BOOLEAN),
            'integer' => (int) $this->value,
            'json'    => json_decode((string) $this->value, true),
            default   => $this->value,
        };
    }

    // -------------------------------------------------------------------------
    // Static helpers
    // -------------------------------------------------------------------------

    /**
     * Récupère la valeur d'un setting par sa clé, castée selon son type.
     */
    public static function get(string $key, mixed $default = null): mixed
    {
        $setting = static::where('key', $key)->first();

        if ($setting === null) {
            return $default;
        }

        return $setting->getCastedValue();
    }

    /**
     * Met à jour ou crée un setting.
     */
    public static function set(string $key, mixed $value): void
    {
        static::where('key', $key)->update([
            'value' => is_array($value) || is_object($value)
                ? json_encode($value)
                : (string) $value,
        ]);
    }

    /**
     * Retourne tous les settings d'un groupe.
     */
    public static function getGroup(string $group): Collection
    {
        return static::where('group', $group)->get();
    }

    /**
     * Retourne tous les settings publics (visibles côté tenant).
     */
    public static function getAllPublic(): Collection
    {
        return static::where('is_public', true)->get();
    }
}
