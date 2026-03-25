<?php

declare(strict_types=1);

namespace App\Models\Tenant;

use App\Enums\PaymentMethod;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Storage;

class Payment extends Model
{
    protected $fillable = [
        'student_fee_id',
        'enrollment_id',
        'academic_year_id',
        'receipt_number',
        'amount',
        'payment_method',
        'payment_date',
        'reference',
        'notes',
        'pdf_path',
        'recorded_by',
        'cancelled_at',
        'cancelled_by',
        'cancel_reason',
    ];

    protected function casts(): array
    {
        return [
            'payment_method' => PaymentMethod::class,
            'payment_date'   => 'date',
            'amount'         => 'decimal:2',
            'cancelled_at'   => 'datetime',
        ];
    }

    // ── Boot ───────────────────────────────────────────────────────────

    protected static function boot(): void
    {
        parent::boot();

        // Génération automatique du numéro de reçu au format YYYY-NNNNN
        static::creating(function (Payment $payment): void {
            if (empty($payment->receipt_number)) {
                $year = now()->year;

                // Récupère le dernier numéro de séquence de l'année en cours
                $lastSeq = static::whereYear('created_at', $year)
                    ->max(\Illuminate\Support\Facades\DB::raw(
                        "CAST(SPLIT_PART(receipt_number, '-', 2) AS INTEGER)"
                    ));

                $seq = ($lastSeq ?? 0) + 1;

                $payment->receipt_number = sprintf('%d-%05d', $year, $seq);
            }
        });
    }

    // ── Relations ──────────────────────────────────────────────────────

    public function studentFee(): BelongsTo
    {
        return $this->belongsTo(StudentFee::class);
    }

    public function enrollment(): BelongsTo
    {
        return $this->belongsTo(Enrollment::class);
    }

    public function academicYear(): BelongsTo
    {
        return $this->belongsTo(AcademicYear::class);
    }

    public function recordedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }

    public function cancelledBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    // ── Accessors ──────────────────────────────────────────────────────

    public function getIsCancelledAttribute(): bool
    {
        return ! is_null($this->cancelled_at);
    }

    public function getPdfUrlAttribute(): ?string
    {
        if (! $this->pdf_path) {
            return null;
        }

        return Storage::disk('local')->exists($this->pdf_path)
            ? route('api.payments.receipt', ['payment' => $this->id])
            : null;
    }

    // ── Scopes ─────────────────────────────────────────────────────────

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereNull('cancelled_at');
    }

    public function scopeForYear(Builder $query, int $yearId): Builder
    {
        return $query->where('academic_year_id', $yearId);
    }

    public function scopeByMethod(Builder $query, PaymentMethod $method): Builder
    {
        return $query->where('payment_method', $method->value);
    }

    public function scopeBetweenDates(Builder $query, string $from, string $to): Builder
    {
        return $query->whereBetween('payment_date', [$from, $to]);
    }
}
