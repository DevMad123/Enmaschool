// ===== src/modules/school/components/RadarChart.tsx =====

import {
  Legend,
  PolarAngleAxis,
  PolarGrid,
  Radar,
  RadarChart as RechartsRadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

interface RadarChartProps {
  studentAverages: Array<{ subject: string; avg: number; classAvg: number }>;
}

export function RadarChart({ studentAverages }: RadarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <RechartsRadarChart data={studentAverages} margin={{ top: 8, right: 24, bottom: 8, left: 24 }}>
        <PolarGrid />
        <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11 }} />
        <Tooltip formatter={(value: number) => [value.toFixed(2), '']} />
        <Radar
          name="Élève"
          dataKey="avg"
          stroke="#2563eb"
          fill="#2563eb"
          fillOpacity={0.25}
        />
        <Radar
          name="Classe"
          dataKey="classAvg"
          stroke="#d97706"
          fill="#d97706"
          fillOpacity={0.15}
        />
        <Legend />
      </RechartsRadarChart>
    </ResponsiveContainer>
  );
}
