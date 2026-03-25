<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Tenant\Payment;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class PaymentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private readonly int   $yearId,
        private readonly array $filters = [],
    ) {}

    public function collection(): Collection
    {
        $query = Payment::where('academic_year_id', $this->yearId)
            ->with(['studentFee.feeType', 'enrollment.student', 'enrollment.classe', 'recordedBy']);

        if (! empty($this->filters['date_from']) && ! empty($this->filters['date_to'])) {
            $query->whereBetween('payment_date', [$this->filters['date_from'], $this->filters['date_to']]);
        }
        if (! empty($this->filters['method'])) {
            $query->where('payment_method', $this->filters['method']);
        }
        if (! empty($this->filters['class_id'])) {
            $query->whereHas('enrollment', fn ($q) => $q->where('classe_id', $this->filters['class_id']));
        }

        return $query->orderByDesc('payment_date')->get();
    }

    public function headings(): array
    {
        return [
            'Reçu N°', 'Date', 'Élève', 'Classe',
            'Type de Frais', 'Montant (FCFA)', 'Mode de Paiement', 'Saisi par',
        ];
    }

    public function map($payment): array
    {
        return [
            $payment->id,
            $payment->payment_date?->format('d/m/Y') ?? '-',
            $payment->enrollment?->student?->full_name ?? '-',
            $payment->enrollment?->classe?->display_name ?? '-',
            $payment->studentFee?->feeType?->name ?? '-',
            number_format((float) $payment->amount, 0, ',', ' '),
            ucfirst($payment->payment_method ?? '-'),
            $payment->recordedBy?->full_name ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();

        $sheet->getStyle('A1:H1')->applyFromArray([
            'font'    => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2563EB']],
            'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['argb' => 'FFCCCCCC']]],
        ]);

        for ($row = 2; $row <= $lastRow; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:H{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF3F4F6']],
                ]);
            }
        }

        return [];
    }

    public function title(): string
    {
        return 'Paiements';
    }
}
