import type { PeriodAverage } from '../types/grades.types'
import { AverageBadge } from './AverageBadge'
import { RankBadge } from './RankBadge'

interface PeriodAveragesTableProps {
  averages: PeriodAverage[]
  showRank?: boolean
  totalStudents?: number
}

export function PeriodAveragesTable({
  averages,
  showRank = false,
  totalStudents = 0,
}: PeriodAveragesTableProps) {
  if (averages.length === 0) {
    return (
      <p className="text-center py-6 text-sm text-gray-400">
        Aucune moyenne disponible
      </p>
    )
  }

  return (
    <table className="w-full text-sm">
      <thead className="border-b border-gray-100 bg-gray-50">
        <tr>
          <th className="px-3 py-2 text-left font-medium text-gray-600">Matière</th>
          <th className="px-3 py-2 text-center font-medium text-gray-600">Coeff</th>
          <th className="px-3 py-2 text-center font-medium text-gray-600">Moyenne</th>
          {showRank && (
            <th className="px-3 py-2 text-center font-medium text-gray-600">Rang</th>
          )}
          <th className="px-3 py-2 text-center font-medium text-gray-600">Mention</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-gray-50">
        {averages.map((avg) => (
          <tr key={avg.id} className="hover:bg-gray-50">
            <td className="px-3 py-2 font-medium text-gray-800">
              {avg.subject?.name ?? '—'}
            </td>
            <td className="px-3 py-2 text-center text-gray-500">
              {avg.coefficient}
            </td>
            <td className="px-3 py-2 text-center">
              <AverageBadge average={avg.average} />
            </td>
            {showRank && (
              <td className="px-3 py-2 text-center">
                <RankBadge rank={avg.rank} total={totalStudents} />
              </td>
            )}
            <td className="px-3 py-2 text-center text-gray-500 text-xs">
              {avg.average !== null
                ? avg.average >= 10
                  ? avg.average >= 16 ? 'Très Bien'
                    : avg.average >= 14 ? 'Bien'
                    : avg.average >= 12 ? 'Assez Bien'
                    : 'Passable'
                  : 'Insuffisant'
                : '—'}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}
