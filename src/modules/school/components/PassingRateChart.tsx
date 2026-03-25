// ===== src/modules/school/components/PassingRateChart.tsx =====

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
import { getPassingRateColor } from '../lib/dashboardHelpers';

interface PassingRateChartProps {
  data: Array<{ name: string; rate: number; avg: number | null }>;
  type?: 'by_class' | 'by_subject';
  passingThreshold?: number;
}

export function PassingRateChart({ data, passingThreshold = 60 }: PassingRateChartProps) {
  return (
    <ResponsiveContainer width="100%" height={Math.max(180, data.length * 32)}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
        <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 11 }}
          width={100}
        />
        <Tooltip
          formatter={(value: number) => [`${value}%`, 'Taux de réussite']}
        />
        {passingThreshold && (
          <ReferenceLine
            x={passingThreshold}
            stroke="#dc2626"
            strokeDasharray="4 2"
          />
        )}
        <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
          {data.map((entry, i) => (
            <Cell key={i} fill={getPassingRateColor(entry.rate)} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
