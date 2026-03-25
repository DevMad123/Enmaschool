// ===== src/modules/school/components/GradeDistributionChart.tsx =====

import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { GRADE_DIST_COLORS } from '../lib/dashboardHelpers';

interface GradeDistributionChartProps {
  distribution: Record<string, number>;
  passingAverage?: number;
}

const RANGE_LABELS: Record<string, string> = {
  '0-5':   '0–5',
  '5-10':  '5–10',
  '10-12': '10–12',
  '12-14': '12–14',
  '14-16': '14–16',
  '16-20': '16–20',
};

export function GradeDistributionChart({
  distribution,
  passingAverage,
}: GradeDistributionChartProps) {
  const data = Object.entries(distribution).map(([range, count]) => ({
    range,
    label: RANGE_LABELS[range] ?? range,
    count,
    color: GRADE_DIST_COLORS[range] ?? '#6b7280',
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis dataKey="label" tick={{ fontSize: 11 }} />
        <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
        <Tooltip
          formatter={(value: number) => [value, 'Élèves']}
          labelFormatter={(label) => `Intervalle : ${label}`}
        />
        {passingAverage !== undefined && (
          <ReferenceLine
            x={passingAverage >= 10 ? '10–12' : '0–5'}
            stroke="#dc2626"
            strokeDasharray="4 2"
            label={{ value: `Seuil ${passingAverage}`, position: 'top', fontSize: 10, fill: '#dc2626' }}
          />
        )}
        <Bar dataKey="count" radius={[4, 4, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.range} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
