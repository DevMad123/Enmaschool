// ===== src/modules/school/lib/dashboardHelpers.ts =====

import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function downloadExcelBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
}

export function downloadPdfBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export function formatTrend(trend: number): string {
  if (trend > 0) return `+${trend.toFixed(1)}%`;
  return `${trend.toFixed(1)}%`;
}

export function getTrendColor(trend: number): string {
  if (trend > 0) return 'text-green-600';
  if (trend < 0) return 'text-red-600';
  return 'text-gray-500';
}

export function getPassingRateColor(rate: number): string {
  if (rate >= 80) return '#16a34a';
  if (rate >= 60) return '#d97706';
  return '#dc2626';
}

export function getCollectionRateColor(rate: number): string {
  if (rate >= 75) return '#16a34a';
  if (rate >= 50) return '#d97706';
  return '#dc2626';
}

export function formatMonthLabel(monthStr: string): string {
  // "2025-01" → "Jan. 25"
  return format(parseISO(`${monthStr}-01`), 'MMM yy', { locale: fr });
}

export function formatCacheAge(generatedAt: string): string {
  const diff = Math.floor((Date.now() - new Date(generatedAt).getTime()) / 1000);
  if (diff < 60) return 'à l\'instant';
  if (diff < 3600) return `il y a ${Math.floor(diff / 60)} min`;
  return `il y a ${Math.floor(diff / 3600)}h`;
}

// ── Palettes de couleurs ──────────────────────────────────────────────────────

export const CHART_COLORS = {
  primary: '#2563eb',  // blue
  success: '#16a34a',  // green
  warning: '#d97706',  // orange
  danger:  '#dc2626',  // red
  info:    '#0891b2',  // cyan
  purple:  '#7c3aed',
  pink:    '#db2777',
  gray:    '#6b7280',
};

export const GENDER_COLORS = {
  male:   '#3b82f6',
  female: '#ec4899',
};

export const GRADE_DIST_COLORS: Record<string, string> = {
  '0-5':   '#ef4444',
  '5-10':  '#f97316',
  '10-12': '#eab308',
  '12-14': '#84cc16',
  '14-16': '#22c55e',
  '16-20': '#10b981',
};

export const PIE_COLORS = [
  '#2563eb', '#16a34a', '#d97706', '#dc2626', '#7c3aed', '#0891b2', '#db2777',
];
