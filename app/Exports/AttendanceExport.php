<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Tenant\Attendance;
use App\Models\Tenant\Enrollment;
use App\Models\Tenant\Period;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttendanceExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    private ?Period $period;

    public function __construct(
        private readonly int  $yearId,
        private readonly ?int $periodId,
        private readonly ?int $classeId,
    ) {
        $this->period = $periodId ? Period::find($periodId) : null;
    }

    public function collection(): Collection
    {
        $query = Enrollment::where('academic_year_id', $this->yearId)
            ->where('status', 'active')
            ->with(['student', 'classe']);

        if ($this->classeId) {
            $query->where('classe_id', $this->classeId);
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Matricule', 'Nom', 'Prénom', 'Classe',
            'Heures Absence', 'Heures Justifiées', 'Heures Non Justifiées', 'Taux Présence (%)',
        ];
    }

    public function map($enrollment): array
    {
        $query = Attendance::where('enrollment_id', $enrollment->id);
        if ($this->period) {
            $query->whereBetween('date', [$this->period->start_date, $this->period->end_date]);
        }
        $records      = $query->get();
        $total        = $records->count();
        $present      = $records->whereIn('status', ['present', 'late'])->count();
        $absentHours  = $records->where('status', 'absent')->sum('duration_hours') ?? 0;
        $excusedHours = $records->where('status', 'excused')->sum('duration_hours') ?? 0;
        $rate         = $total > 0 ? round($present / $total * 100, 1) : 100.0;

        return [
            $enrollment->student?->matricule ?? '-',
            $enrollment->student?->last_name ?? '-',
            $enrollment->student?->first_name ?? '-',
            $enrollment->classe?->display_name ?? '-',
            $absentHours,
            $excusedHours,
            max(0, $absentHours - $excusedHours),
            $rate,
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
        return 'Absences';
    }
}
