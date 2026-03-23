<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\BloodType;
use App\Enums\Gender;
use App\Enums\StudentStatus;
use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Facades\Storage;

class Student extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'matricule',
        'first_name',
        'last_name',
        'birth_date',
        'birth_place',
        'gender',
        'nationality',
        'birth_certificate_number',
        'photo',
        'address',
        'city',
        'blood_type',
        'first_enrollment_year',
        'previous_school',
        'notes',
        'status',
        'created_by',
    ];

    protected function casts(): array
    {
        return [
            'birth_date'  => 'date',
            'gender'      => Gender::class,
            'blood_type'  => BloodType::class,
            'status'      => StudentStatus::class,
        ];
    }

    // ── Boot ───────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        static::creating(function (Student $student): void {
            if (empty($student->matricule)) {
                $student->matricule = self::generateMatricule();
            }
        });
    }

    /**
     * Génère un matricule unique.
     * Format : {YEAR}{CAT_CODE}{SEQ_5DIGITS}  ex: "2024PRI00042"
     * CAT_CODE est provisoire à la création (avant enrollment). On utilise 'GEN' par défaut.
     * Il sera mis à jour lors du premier enrollment via EnrollmentService.
     */
    public static function generateMatricule(string $categoryCode = 'GEN'): string
    {
        $year = now()->year;
        $prefix = $year.$categoryCode;

        // Cherche le dernier matricule avec ce préfixe (séquence la plus haute)
        $last = static::withTrashed()
            ->where('matricule', 'like', $prefix.'%')
            ->orderByRaw("CAST(SUBSTRING(matricule FROM ".(\strlen($prefix) + 1).") AS INTEGER) DESC")
            ->value('matricule');

        $sequence = $last ? (int) substr($last, \strlen($prefix)) + 1 : 1;

        return $prefix.str_pad((string) $sequence, 5, '0', STR_PAD_LEFT);
    }

    // ── Accessors ──────────────────────────────────────────────

    public function getFullNameAttribute(): string
    {
        return "{$this->last_name} {$this->first_name}";
    }

    public function getAgeAttribute(): int
    {
        return Carbon::parse($this->birth_date)->age;
    }

    public function getPhotoUrlAttribute(): ?string
    {
        if (! $this->photo) {
            return null;
        }

        return Storage::url($this->photo);
    }

    // ── Relations ──────────────────────────────────────────────

    public function parents(): BelongsToMany
    {
        return $this->belongsToMany(ParentModel::class, 'student_parents', 'student_id', 'parent_id')
            ->withPivot('is_primary_contact', 'can_pickup')
            ->withTimestamps();
    }

    public function enrollments(): HasMany
    {
        return $this->hasMany(Enrollment::class);
    }

    public function currentEnrollment(): HasOne
    {
        return $this->hasOne(Enrollment::class)
            ->whereHas('academicYear', fn (Builder $q) => $q->where('status', 'active'))
            ->where('is_active', true)
            ->latest();
    }

    public function createdBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->where('status', StudentStatus::Active->value);
    }

    public function scopeByStatus(Builder $query, StudentStatus $status): Builder
    {
        return $query->where('status', $status->value);
    }

    public function scopeInClasse(Builder $query, int $classeId): Builder
    {
        return $query->whereHas('enrollments', fn (Builder $q) => $q->where('classe_id', $classeId)->where('is_active', true));
    }

    public function scopeInYear(Builder $query, int $yearId): Builder
    {
        return $query->whereHas('enrollments', fn (Builder $q) => $q->where('academic_year_id', $yearId));
    }

    public function scopeSearch(Builder $query, string $term): Builder
    {
        return $query->whereAny(['first_name', 'last_name', 'matricule'], 'ILIKE', "%{$term}%");
    }
}
