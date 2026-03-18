import { useState } from 'react'
import { Save, LoaderCircle } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSchoolSettings, useUpdateSchoolSetting } from '../hooks/useSchoolSettings'
import type { SchoolSetting, SettingGroup } from '../types/school.types'

const TABS: { id: SettingGroup; label: string }[] = [
  { id: 'general', label: 'Général' },
  { id: 'academic', label: 'Académique' },
  { id: 'grading', label: 'Notes & Évaluations' },
  { id: 'attendance', label: 'Présences' },
  { id: 'notifications', label: 'Notifications' },
]

function SettingField({
  setting,
  onSave,
  isSaving,
}: {
  setting: SchoolSetting
  onSave: (key: string, value: unknown) => void
  isSaving: boolean
}) {
  const [value, setValue] = useState<string>(String(setting.value ?? ''))

  const handleSave = () => {
    let parsed: unknown = value
    if (setting.type === 'integer') parsed = parseInt(value, 10)
    else if (setting.type === 'float') parsed = parseFloat(value)
    else if (setting.type === 'boolean') parsed = value === 'true'
    onSave(setting.key, parsed)
  }

  return (
    <div className="flex items-start justify-between gap-4 py-4 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <Label className="text-sm font-medium text-slate-900">{setting.label}</Label>
        {setting.description && (
          <p className="text-xs text-slate-500 mt-0.5">{setting.description}</p>
        )}
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {setting.type === 'boolean' ? (
          <select
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="h-9 rounded-md border border-slate-200 bg-white px-3 text-sm"
          >
            <option value="true">Oui</option>
            <option value="false">Non</option>
          </select>
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            type={setting.type === 'integer' || setting.type === 'float' ? 'number' : 'text'}
            className="w-48"
          />
        )}
        <Button size="sm" variant="outline" onClick={handleSave} disabled={isSaving}>
          {isSaving ? <LoaderCircle className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  )
}

export function SchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingGroup>('general')
  const { data, isLoading } = useSchoolSettings()
  const updateMutation = useUpdateSchoolSetting()

  const grouped: Record<string, SchoolSetting[]> = data?.data ?? {}
  const currentSettings = grouped[activeTab] ?? []

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Paramètres de l'école</h1>
        <p className="text-sm text-slate-500 mt-1">Configuration générale de votre établissement</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar tabs */}
        <nav className="flex lg:flex-col gap-1 lg:w-56 shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Settings content */}
        <div className="flex-1 rounded-lg border border-slate-200 bg-white p-6">
          {currentSettings.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Aucun paramètre configuré pour cette section.
            </p>
          ) : (
            currentSettings.map((setting) => (
              <SettingField
                key={setting.key}
                setting={setting}
                onSave={(key, value) => updateMutation.mutate({ key, value })}
                isSaving={updateMutation.isPending}
              />
            ))
          )}
        </div>
      </div>
    </div>
  )
}
