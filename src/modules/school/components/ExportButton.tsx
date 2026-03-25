// ===== src/modules/school/components/ExportButton.tsx =====

import { Download, FileText, Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';
import { downloadExcelBlob, downloadPdfBlob } from '../lib/dashboardHelpers';
import { toast } from 'sonner';
import { useState } from 'react';

interface ExportButtonProps {
  label: string;
  onExport: () => Promise<Blob>;
  filename: string;
  format?: 'xlsx' | 'pdf' | 'csv';
  disabled?: boolean;
  variant?: 'primary' | 'outline';
  className?: string;
}

export function ExportButton({
  label,
  onExport,
  filename,
  format = 'xlsx',
  disabled = false,
  variant = 'outline',
  className,
}: ExportButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleClick = async () => {
    if (loading || disabled) return;
    setLoading(true);
    try {
      const blob = await onExport();
      if (format === 'pdf') {
        downloadPdfBlob(blob, filename);
      } else {
        downloadExcelBlob(blob, filename);
      }
      toast.success('Fichier téléchargé ✓');
    } catch {
      toast.error('Erreur lors de la génération du fichier.');
    } finally {
      setLoading(false);
    }
  };

  const Icon = format === 'pdf' ? FileText : Download;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={loading || disabled}
      className={cn(
        'inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        variant === 'primary' &&
          'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50',
        variant === 'outline' &&
          'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-50',
        className,
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Génération en cours...
        </>
      ) : (
        <>
          <Icon className="h-4 w-4" />
          {label}
        </>
      )}
    </button>
  );
}
