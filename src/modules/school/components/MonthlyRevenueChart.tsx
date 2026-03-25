// ===== src/modules/school/components/MonthlyRevenueChart.tsx =====

import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { formatMonthLabel } from '../lib/dashboardHelpers';

interface MonthlyRevenueChartProps {
  data: Array<{ month: string; amount: number; payments_count: number }>;
}

function formatXOF(value: number): string {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(0)}k`;
  return String(value);
}

export function MonthlyRevenueChart({ data }: MonthlyRevenueChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: formatMonthLabel(d.month),
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <AreaChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor="#2563eb" stopOpacity={0.3} />
            <stop offset="95%" stopColor="#2563eb" stopOpacity={0.02} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} tickFormatter={formatXOF} />
        <Tooltip
          formatter={(value: number) => [
            `${value.toLocaleString('fr-FR')} FCFA`,
            'Encaissements',
          ]}
          labelFormatter={(label) => `Mois : ${label}`}
        />
        <Area
          type="monotone"
          dataKey="amount"
          stroke="#2563eb"
          strokeWidth={2}
          fill="url(#revenueGrad)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
