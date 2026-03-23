import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useStudentGradesSummary } from '../hooks/useGrades'
import { useStudent } from '../hooks/useStudents'
import { useSchoolStore } from '../store/schoolStore'
import { AverageBadge } from '../components/AverageBadge'
import { RankBadge } from '../components/RankBadge'

export function StudentGradesSummaryPage() {
  const { id }            = useParams<{ id: string }>()
  const studentId         = parseInt(id ?? '0')
  const { currentYearId } = useSchoolStore()

  const [activeTab, setActiveTab] = useState<number | 'annual'>(0)

  const { data: studentData } = useStudent(studentId)
  const student = studentData?.data

  const { data: summary, isLoading } = useStudentGradesSummary(
    studentId,
    currentYearId ?? 0,
  )

  if (isLoading) return <LoadingSpinner />

  if (!summary) {
    return (
      <p className="text-center py-10 text-sm text-gray-400">
        Aucune donnée de notes disponible.
      </p>
    )
  }

  const periods = summary.period_averages

  return (
    <div className="space-y-4">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900">
          Relevé de notes — {student?.full_name ?? ''}
        </h2>
        <p className="text-sm text-gray-500">Vue d'ensemble par période et annuelle</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200">
        {periods.map((p, i) => (
          <button
            key={p.period.id}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === i
                ? 'border-indigo-500 text-indigo-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {p.period.name}
          </button>
        ))}
        <button
          onClick={() => setActiveTab('annual')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'annual'
              ? 'border-indigo-500 text-indigo-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          Annuel
        </button>
      </div>

      {/* Period tab */}
      {activeTab !== 'annual' && periods[activeTab as number] && (() => {
        const periodData = periods[activeTab as number]

        return (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-100 bg-gray-50">
                  <tr>
                    <th className="px-4 py-2.5 text-left font-medium text-gray-600">Matière</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Moyenne</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Rang</th>
                    <th className="px-4 py-2.5 text-center font-medium text-gray-600">Mention</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {periodData.averages.map((a, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800">{a.subject.name}</td>
                      <td className="px-4 py-2.5 text-center">
                        <AverageBadge average={a.average} />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <RankBadge rank={a.rank} total={0} />
                      </td>
                      <td className="px-4 py-2.5 text-center text-xs text-gray-500">
                        {a.average !== null
                          ? a.average >= 16 ? 'Très Bien'
                            : a.average >= 14 ? 'Bien'
                            : a.average >= 12 ? 'Assez Bien'
                            : a.average >= 10 ? 'Passable'
                            : 'Insuffisant'
                          : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
                {periodData.general_average !== null && (
                  <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                    <tr>
                      <td className="px-4 py-2.5 font-semibold text-gray-700">MOYENNE GÉNÉRALE</td>
                      <td className="px-4 py-2.5 text-center">
                        <AverageBadge average={periodData.general_average} showMention />
                      </td>
                      <td className="px-4 py-2.5 text-center">
                        <RankBadge rank={periodData.general_rank} total={0} />
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        )
      })()}

      {/* Annual tab */}
      {activeTab === 'annual' && (
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-gray-100 bg-gray-50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium text-gray-600">Matière</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600">Moy. annuelle</th>
                <th className="px-4 py-2.5 text-center font-medium text-gray-600">Résultat</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {summary.annual_averages.map((a, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-4 py-2.5 font-medium text-gray-800">{a.subject.name}</td>
                  <td className="px-4 py-2.5 text-center">
                    <AverageBadge average={a.annual_average} />
                  </td>
                  <td className="px-4 py-2.5 text-center">
                    {a.is_passing === null ? '—' : a.is_passing ? (
                      <span className="text-xs text-green-600 font-medium">Admis</span>
                    ) : (
                      <span className="text-xs text-red-600 font-medium">Insuffisant</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            {summary.general_annual_average !== null && (
              <tfoot className="border-t-2 border-gray-200 bg-gray-50">
                <tr>
                  <td className="px-4 py-2.5 font-semibold text-gray-700">MOYENNE ANNUELLE</td>
                  <td className="px-4 py-2.5 text-center">
                    <AverageBadge average={summary.general_annual_average} showMention />
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      )}
    </div>
  )
}
