<?php

declare(strict_types=1);

namespace App\Exports;

use App\Models\Tenant\Enrollment;
use Illuminate\Support\Collection;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;
use Maatwebsite\Excel\Concerns\WithStyles;
use Maatwebsite\Excel\Concerns\WithTitle;
use PhpOffice\PhpSpreadsheet\Style\Fill;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class StudentsExport implements FromCollection, WithHeadings, WithMapping, WithStyles, ShouldAutoSize, WithTitle
{
    public function __construct(
        private readonly int   $yearId,
        private readonly array $filters = [],
    ) {}

    public function collection(): Collection
    {
        $query = Enrollment::where('academic_year_id', $this->yearId)
            ->with(['student.parents', 'classe.level']);

        if (! empty($this->filters['classe_id'])) {
            $query->where('classe_id', $this->filters['classe_id']);
        }
        if (! empty($this->filters['status'])) {
            $query->where('status', $this->filters['status']);
        }
        if (! empty($this->filters['level_category'])) {
            $query->whereHas('classe.level', fn ($q) => $q->where('category', $this->filters['level_category']));
        }
        if (! empty($this->filters['gender'])) {
            $query->whereHas('student', fn ($q) => $q->where('gender', $this->filters['gender']));
        }

        return $query->get();
    }

    public function headings(): array
    {
        return [
            'Matricule', 'Nom', 'Prénom', 'Date Naissance', 'Genre',
            'Classe', 'Niveau', 'Catégorie', 'Nationalité', 'Statut',
            'Parent 1 - Nom', 'Parent 1 - Tél', 'Parent 2 - Nom', 'Parent 2 - Tél',
        ];
    }

    public function map($enrollment): array
    {
        $student = $enrollment->student;
        $parents = $student?->parents ?? collect();
        $parent1 = $parents->first();
        $parent2 = $parents->skip(1)->first();

        return [
            $student?->matricule ?? '-',
            $student?->last_name ?? '-',
            $student?->first_name ?? '-',
            $student?->birth_date?->format('d/m/Y') ?? '-',
            $student?->gender === 'male' ? 'Masculin' : 'Féminin',
            $enrollment->classe?->display_name ?? '-',
            $enrollment->classe?->level?->label ?? '-',
            ucfirst($enrollment->classe?->level?->category ?? '-'),
            $student?->nationality ?? '-',
            ucfirst($enrollment->status ?? '-'),
            $parent1?->full_name ?? '-',
            $parent1?->phone ?? '-',
            $parent2?->full_name ?? '-',
            $parent2?->phone ?? '-',
        ];
    }

    public function styles(Worksheet $sheet): array
    {
        $lastRow = $sheet->getHighestRow();

        // Header
        $sheet->getStyle('A1:N1')->applyFromArray([
            'font'    => ['bold' => true, 'color' => ['argb' => 'FFFFFFFF']],
            'fill'    => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FF2563EB']],
            'borders' => ['allBorders' => ['borderStyle' => 'thin', 'color' => ['argb' => 'FFCCCCCC']]],
        ]);

        // Lignes alternées
        for ($row = 2; $row <= $lastRow; $row++) {
            if ($row % 2 === 0) {
                $sheet->getStyle("A{$row}:N{$row}")->applyFromArray([
                    'fill' => ['fillType' => Fill::FILL_SOLID, 'startColor' => ['argb' => 'FFF3F4F6']],
                ]);
            }
        }

        return [];
    }

    public function title(): string
    {
        return 'Élèves';
    }
}
