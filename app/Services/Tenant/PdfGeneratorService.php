<?php

declare(strict_types=1);

namespace App\Services\Tenant;

use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Storage;

class PdfGeneratorService
{
    /**
     * Génère un PDF depuis une vue Blade et le sauvegarde sur le disque local.
     *
     * @param  string $view     Nom de la vue Blade (ex: 'pdf.report_card')
     * @param  array  $data     Variables passées à la vue
     * @param  string $filePath Chemin relatif dans storage/app (ex: 'tenant_demo/bulletins/...')
     * @return string           Le chemin sauvegardé
     */
    public function generate(string $view, array $data, string $filePath): string
    {
        $pdf = Pdf::loadView($view, $data)
            ->setPaper('A4', 'portrait')
            ->setOptions([
                'dpi'          => 150,
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled'      => true,
                'defaultFont'  => 'DejaVu Sans',
            ]);

        $pdfContent = $pdf->output();

        // Crée les répertoires si nécessaire
        $directory = dirname($filePath);
        if (! Storage::disk('local')->exists($directory)) {
            Storage::disk('local')->makeDirectory($directory);
        }

        Storage::disk('local')->put($filePath, $pdfContent);

        return $filePath;
    }

    /**
     * Retourne l'URL de téléchargement du PDF.
     */
    public function getUrl(string $pdfPath): string
    {
        return route('api.report-cards.download-by-path', ['path' => base64_encode($pdfPath)]);
    }
}
