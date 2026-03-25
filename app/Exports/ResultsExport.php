<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Tenant\Enrollment;
use App\Models\Tenant\SchoolSetting;
use App\Models\Tenant\Subject;
use App\Models\Tenant\SubjectAverage;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class ResultsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    private Collection $subjects;

    public function __construct(
        private readonly int $yearId,
        private readonly int $periodId,
    ) {
        $this->subjects = Subject::where('is_active', true)->orderBy('name')->get();
    }

    public function collection(): Collection
    {
        return Enrollment::where('academic_year_id', $this->yearId)
            ->where('status', 'active')
            ->with([
                'student', 'classe',
                'periodAverages' => fn ($q) => $q->where('period_id', $this->periodId),
            ])
            ->get();
    }

    public function headings(): array
    {
        $base = ['Matricule', 'Nom', 'Prénom', 'Classe'];
        $subjectHeaders = $this->subjects->pluck('name')->toArray();
        return array_merge($base, $subjectHeaders, ['Moyenne Générale', 'Rang', 'Décision']);
    }

    public function map($enrollment): array
    {
        $passingAvg = (float) SchoolSetting::get('passing_average', 10);
        $row = [
            $enrollment->student?->matricule ?? '-',
            $enrollment->student?->last_name ?? '-',
            $enrollment->student?->first_name ?? '-',
            $enrollment->classe?->display_name ?? '-',
        ];

        foreach ($this->subjects as $subject) {
            $avg = SubjectAverage::where('enrollment_id', $enrollment->id)
                ->where('subject_id', $subject->id)
                ->where('period_id', $this->periodId)
                ->value('average');
            $row[] = $avg !== null ? number_format((float) $avg, 2) : '-';
        }

        $periodAvg = $enrollment->periodAverages->first();
        $row[] = $periodAvg?->average !== null ? number_format((float) $periodAvg->average, 2) : '-';
        $row[] = $periodAvg?->rank ?? '-';
        $row[] = $periodAvg?->decision ?? ($periodAvg?->average >= $passingAvg ? 'Admis' : 'Redouble');

        return $row;
    }

    public function styles(Worksheet $sheet): array
    {
        $lastCol = $sheet->getHighestColumn();
        $lastRow = $sheet->getHighestRow();

        $sheet->getStyle("A1:{$lastCol}1")->applyFromArray([
            'font'    => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2563EB']],
            'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['argb' => 'FFCCCCCC']]],
        ]);

        for ($row = 2; $row <= $lastRow; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:{$lastCol}{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF3F4F6']],
                ]);
            }
        }

        return [];
    }

    public function title(): string
    {
        return 'Résultats';
    }
}
