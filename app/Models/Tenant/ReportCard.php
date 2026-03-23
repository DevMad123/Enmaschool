<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\CouncilDecision;
use App\Enums\HonorMention;
use App\Enums\ReportCardStatus;
use App\Enums\ReportCardType;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User;

class ReportCard extends Model
{
    protected $fillable = [
        'enrollment_id',
        'student_id',
        'class_id',
        'academic_year_id',
        'period_id',
        'type',
        'general_average',
        'general_rank',
        'class_size',
        'class_average',
        'absences_justified',
        'absences_unjustified',
        'general_appreciation',
        'council_decision',
        'honor_mention',
        'status',
        'pdf_path',
        'pdf_generated_at',
        'pdf_hash',
        'generated_by',
        'published_by',
        'published_at',
    ];

    protected $casts = [
        'type'             => ReportCardType::class,
        'status'           => ReportCardStatus::class,
        'council_decision' => CouncilDecision::class,
        'honor_mention'    => HonorMention::class,
        'pdf_generated_at' => 'datetime',
        'published_at'     => 'datetime',
        'general_average'  => 'decimal:2',
        'class_average'    => 'decimal:2',
    ];

    // ── Relations ─────────────────────────────────────────────

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(Student::class);
    }

    public function classe(): BelongsTo
    {
        return $this->belongsTo(Classe::class, 'class_id');
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function period(): BelongsTo
    {
        return $this->belongsTo(Period::class);
    }

    public function appreciations(): HasMany
    {
        return $this->hasMany(ReportCardAppreciation::class);
    }

    public function generatedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'generated_by');
    }

    public function publishedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'published_by');
    }

    // ── Méthodes métier ────────────────────────────────────────

    public function isEditable(): bool
    {
        return $this->status->isEditable() && ! $this->isPublished();
    }

    public function isPublished(): bool
    {
        return $this->status === ReportCardStatus::Published;
    }

    public function isPeriodType(): bool
    {
        return $this->type === ReportCardType::Period;
    }

    public function isAnnualType(): bool
    {
        return $this->type === ReportCardType::Annual;
    }

    public function hasPdf(): bool
    {
        return ! empty($this->pdf_path);
    }

    public function getPdfUrl(): ?string
    {
        if (! $this->hasPdf()) {
            return null;
        }

        return route('api.report-cards.download', $this->id);
    }

    // ── Scopes ─────────────────────────────────────────────────

    public function scopeForStudent(Builder $query, int $studentId): Builder
    {
        return $query->where('student_id', $studentId);
    }

    public function scopeForClass(Builder $query, int $classeId): Builder
    {
        return $query->where('class_id', $classeId);
    }

    public function scopeForPeriod(Builder $query, int $periodId): Builder
    {
        return $query->where('period_id', $periodId);
    }

    public function scopeForYear(Builder $query, int $yearId): Builder
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopePublished(Builder $query): Builder
    {
        return $query->where('status', ReportCardStatus::Published->value);
    }

    public function scopeDraft(Builder $query): Builder
    {
        return $query->where('status', ReportCardStatus::Draft->value);
    }

    public function scopeByType(Builder $query, ReportCardType $type): Builder
    {
        return $query->where('type', $type->value);
    }
}
