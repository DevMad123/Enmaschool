// ===== src/modules/superadmin/pages/settings/SystemSettingsPage.tsx =====

import { useState, useEffect } from 'react'
import {
  Settings,
  Mail,
  Shield,
  Save,
  TestTube,
  AlertTriangle,
  LoaderCircle,
  Upload,
  Image,
} from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { ConfirmDialog } from '@/shared/components/feedback/ConfirmDialog'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { toast } from '@/shared/lib/toast'
import {
  useSystemSettings,
  useUpdateSettings,
} from '../../hooks/useSystemSettings'
import api from '@/shared/lib/axios'
import type { GroupedSettings } from '../../types/settings.types'

// ── Tabs config ────────────────────────────────────────────────────────
type TabKey = 'general' | 'email' | 'maintenance'

const tabs: { key: TabKey; label: string; icon: typeof Settings }[] = [
  { key: 'general', label: 'Général', icon: Settings },
  { key: 'email', label: 'Email / SMTP', icon: Mail },
  { key: 'maintenance', label: 'Maintenance', icon: Shield },
]

// ── General Tab ────────────────────────────────────────────────────────
function GeneralTab({
  values,
  onChange,
}: {
  values: Record<string, string | number | boolean | null>
  onChange: (key: string, value: string | number | boolean | null) => void
}) {
  const [logoPreview, setLogoPreview] = useState<string | null>(null)

  return (
    <div className="space-y-6">
      {/* App name */}
      <div className="space-y-2">
        <Label htmlFor="app_name">Nom de l&apos;application</Label>
        <Input
          id="app_name"
          value={String(values['app_name'] ?? '')}
          onChange={(e) => onChange('app_name', e.target.value)}
          placeholder="Enma School"
        />
      </div>

      {/* Logo */}
      <div className="space-y-2">
        <Label>Logo</Label>
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50">
            {logoPreview || values['app_logo'] ? (
              <img
                src={logoPreview ?? String(values['app_logo'] ?? '')}
                alt="Logo"
                className="h-14 w-14 rounded object-contain"
              />
            ) : (
              <Image className="h-6 w-6 text-gray-400" />
            )}
          </div>
          <div>
            <label className="cursor-pointer inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors">
              <Upload className="mr-2 h-4 w-4" />
              Changer
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => {
                      setLogoPreview(reader.result as string)
                      onChange('app_logo', reader.result as string)
                    }
                    reader.readAsDataURL(file)
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>

      {/* System email */}
      <div className="space-y-2">
        <Label htmlFor="app_email">Email de contact</Label>
        <Input
          id="app_email"
          type="email"
          value={String(values['app_email'] ?? '')}
          onChange={(e) => onChange('app_email', e.target.value)}
          placeholder="contact@enmaschool.com"
        />
      </div>

      {/* Country */}
      <div className="space-y-2">
        <Label htmlFor="app_country">Pays</Label>
        <select
          id="app_country"
          value={String(values['app_country'] ?? '')}
          onChange={(e) => onChange('app_country', e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sélectionner un pays</option>
          <option value="CI">Côte d&apos;Ivoire</option>
          <option value="MA">Maroc</option>
          <option value="SN">Sénégal</option>
          <option value="CM">Cameroun</option>
          <option value="TN">Tunisie</option>
          <option value="DZ">Algérie</option>
          <option value="ML">Mali</option>
          <option value="BF">Burkina Faso</option>
          <option value="GN">Guinée</option>
          <option value="BJ">Bénin</option>
          <option value="TG">Togo</option>
          <option value="NE">Niger</option>
          <option value="CD">Congo (RDC)</option>
          <option value="MG">Madagascar</option>
          <option value="FR">France</option>
        </select>
      </div>

      {/* Currency */}
      <div className="space-y-2">
        <Label htmlFor="app_currency">Devise</Label>
        <select
          id="app_currency"
          value={String(values['app_currency'] ?? '')}
          onChange={(e) => onChange('app_currency', e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sélectionner une devise</option>
          <option value="XOF">XOF (Franc CFA)</option>
          <option value="MAD">MAD (Dirham)</option>
          <option value="EUR">EUR (Euro)</option>
          <option value="USD">USD (Dollar US)</option>
        </select>
      </div>

      {/* Language */}
      <div className="space-y-2">
        <Label htmlFor="app_language">Langue</Label>
        <select
          id="app_language"
          value={String(values['app_language'] ?? 'fr')}
          onChange={(e) => onChange('app_language', e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="fr">Français</option>
          <option value="ar">العربية</option>
          <option value="en">English</option>
        </select>
      </div>

      {/* Timezone */}
      <div className="space-y-2">
        <Label htmlFor="app_timezone">Fuseau horaire</Label>
        <select
          id="app_timezone"
          value={String(values['app_timezone'] ?? '')}
          onChange={(e) => onChange('app_timezone', e.target.value)}
          className="flex h-10 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="">Sélectionner un fuseau</option>
          <option value="Africa/Abidjan">Africa/Abidjan</option>
          <option value="Africa/Casablanca">Africa/Casablanca</option>
          <option value="Africa/Dakar">Africa/Dakar</option>
          <option value="Africa/Lagos">Africa/Lagos</option>
          <option value="Africa/Nairobi">Africa/Nairobi</option>
          <option value="Europe/Paris">Europe/Paris</option>
        </select>
      </div>
    </div>
  )
}

// ── Email Tab ──────────────────────────────────────────────────────────
function EmailTab({
  values,
  onChange,
}: {
  values: Record<string, string | number | boolean | null>
  onChange: (key: string, value: string | number | boolean | null) => void
}) {
  const [testing, setTesting] = useState(false)

  const handleTestSMTP = async () => {
    setTesting(true)
    try {
      const res = await api.post('/central/settings/test-smtp', {
        smtp_host: values['smtp_host'],
        smtp_port: values['smtp_port'],
        smtp_user: values['smtp_user'],
        smtp_password: values['smtp_password'],
      })
      toast.success(res.data?.message ?? 'Connexion SMTP réussie !')
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ??
        'Échec de la connexion SMTP. Vérifiez vos paramètres.'
      )
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="smtp_host">Hôte SMTP</Label>
        <Input
          id="smtp_host"
          value={String(values['smtp_host'] ?? '')}
          onChange={(e) => onChange('smtp_host', e.target.value)}
          placeholder="smtp.mailtrap.io"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="smtp_port">Port</Label>
        <Input
          id="smtp_port"
          type="number"
          value={String(values['smtp_port'] ?? '')}
          onChange={(e) =>
            onChange('smtp_port', e.target.value ? Number(e.target.value) : null)
          }
          placeholder="587"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="smtp_user">Utilisateur</Label>
        <Input
          id="smtp_user"
          value={String(values['smtp_user'] ?? '')}
          onChange={(e) => onChange('smtp_user', e.target.value)}
          placeholder="username"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="smtp_password">Mot de passe</Label>
        <Input
          id="smtp_password"
          type="password"
          value={String(values['smtp_password'] ?? '')}
          onChange={(e) => onChange('smtp_password', e.target.value)}
          placeholder="••••••••"
        />
      </div>

      <div className="pt-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleTestSMTP}
          disabled={testing}
        >
          {testing ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <TestTube className="mr-2 h-4 w-4" />
          )}
          Tester la connexion SMTP
        </Button>
      </div>
    </div>
  )
}

// ── Maintenance Tab ────────────────────────────────────────────────────
function MaintenanceTab({
  values,
  onChange,
}: {
  values: Record<string, string | number | boolean | null>
  onChange: (key: string, value: string | number | boolean | null) => void
}) {
  const isEnabled = values['maintenance_mode'] === true || values['maintenance_mode'] === 'true'
  const [confirmEnable, setConfirmEnable] = useState(false)

  const handleToggle = () => {
    if (!isEnabled) {
      setConfirmEnable(true)
    } else {
      onChange('maintenance_mode', false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      {isEnabled && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
          <div>
            <p className="text-sm font-medium text-amber-800">
              Mode maintenance activé
            </p>
            <p className="mt-0.5 text-xs text-amber-600">
              L&apos;application est actuellement inaccessible aux écoles.
            </p>
          </div>
        </div>
      )}

      {/* Toggle */}
      <div className="flex items-center justify-between rounded-xl border border-gray-200 bg-white p-4">
        <div>
          <p className="text-sm font-medium text-gray-900">
            Mode maintenance
          </p>
          <p className="mt-0.5 text-xs text-gray-500">
            Activer le mode maintenance rendra l&apos;application
            inaccessible aux écoles
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={isEnabled}
          onClick={handleToggle}
          className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2 ${
            isEnabled ? 'bg-amber-500' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-200 ${
              isEnabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {/* Maintenance message */}
      {isEnabled && (
        <div className="space-y-2">
          <Label htmlFor="maintenance_message">
            Message de maintenance
          </Label>
          <textarea
            id="maintenance_message"
            value={String(values['maintenance_message'] ?? '')}
            onChange={(e) =>
              onChange('maintenance_message', e.target.value)
            }
            rows={4}
            className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="L'application est en cours de maintenance. Veuillez réessayer plus tard."
          />
        </div>
      )}

      {/* Confirm dialog for enabling */}
      <ConfirmDialog
        open={confirmEnable}
        onOpenChange={setConfirmEnable}
        title="Activer le mode maintenance"
        description="Activer le mode maintenance rendra l'application inaccessible aux écoles. Les super admins pourront toujours accéder au panel d'administration. Êtes-vous sûr ?"
        confirmLabel="Activer la maintenance"
        onConfirm={() => {
          onChange('maintenance_mode', true)
          setConfirmEnable(false)
        }}
        variant="warning"
      />
    </div>
  )
}

// ── Main Page ──────────────────────────────────────────────────────────
export function SystemSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('general')
  const { data, isLoading } = useSystemSettings()
  const updateMutation = useUpdateSettings()

  // Local form state
  const [values, setValues] = useState<
    Record<string, string | number | boolean | null>
  >({})
  const [initialized, setInitialized] = useState(false)

  // Initialize form values from loaded settings
  useEffect(() => {
    if (!data?.data || initialized) return

    const v: Record<string, string | number | boolean | null> = {}
    const grouped = data.data as GroupedSettings
    for (const group of Object.values(grouped)) {
      for (const s of group) {
        v[s.key] = s.value as string | number | boolean | null
      }
    }
    setValues(v)
    setInitialized(true)
  }, [data, initialized])

  const handleChange = (
    key: string,
    value: string | number | boolean | null,
  ) => {
    setValues((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = () => {
    const settings = Object.entries(values).map(([key, value]) => ({
      key,
      value,
    }))
    updateMutation.mutate({ settings })
  }

  if (isLoading) {
    return <LoadingSpinner fullScreen />
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Paramètres système
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Configurez les paramètres globaux de la plateforme
          </p>
        </div>
        <Button
          size="sm"
          onClick={handleSave}
          disabled={updateMutation.isPending}
        >
          {updateMutation.isPending ? (
            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Enregistrer
        </Button>
      </div>

      {/* Tabs + content */}
      <div className="flex flex-col gap-6 lg:flex-row">
        {/* Tab nav */}
        <nav className="flex gap-1 lg:flex-col lg:w-56 shrink-0">
          {tabs.map((tab) => {
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            )
          })}
        </nav>

        {/* Tab content */}
        <div className="flex-1 rounded-xl border border-gray-200 bg-white p-6">
          {activeTab === 'general' && (
            <GeneralTab
              values={values}
              onChange={handleChange}
            />
          )}
          {activeTab === 'email' && (
            <EmailTab values={values} onChange={handleChange} />
          )}
          {activeTab === 'maintenance' && (
            <MaintenanceTab values={values} onChange={handleChange} />
          )}
        </div>
      </div>
    </div>
  )
}
