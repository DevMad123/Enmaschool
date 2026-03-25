// ===== src/modules/school/components/AttendanceTrendChart.tsx =====

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

interface AttendanceTrendChartProps {
  data: Array<{ date: string; rate: number | null; recorded: boolean }>;
}

export function AttendanceTrendChart({ data }: AttendanceTrendChartProps) {
  const chartData = data.map((d) => ({
    ...d,
    label: format(parseISO(d.date), 'dd MMM', { locale: fr }),
    rateDisplay: d.recorded ? d.rate : null,
  }));

  return (
    <ResponsiveContainer width="100%" height={220}>
      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10 }}
          interval="preserveStartEnd"
        />
        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
        <Tooltip
          formatter={(value: number | null) =>
            value !== null ? [`${value}%`, 'Taux de présence'] : ['Non saisi', 'Taux de présence']
          }
        />
        <Line
          type="monotone"
          dataKey="rateDisplay"
          stroke="#2563eb"
          strokeWidth={2}
          dot={false}
          connectNulls={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
