import { useState, forwardRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Save, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { LoadingSpinner } from '@/shared/components/feedback/LoadingSpinner'
import { useSchoolSettings, useBulkUpdateSchoolSettings, useUploadLogo } from '../hooks/useSchoolSettings'
import { LogoUpload } from '../components/LogoUpload'
import { SettingSwitch } from '../components/SettingSwitch'
import { DaySelector } from '../components/DaySelector'
import { MentionsEditor } from '../components/MentionsEditor'
import type { SchoolSetting, SettingGroup, SettingUpdatePayload } from '../types/school.types'

// ── Helpers ───────────────────────────────────────────────────────────────────

function getVal<T>(settings: SchoolSetting[], key: string, fallback: T): T {
  const s = settings.find(x => x.key === key)
  if (!s) return fallback
  const v = s.value
  if (v === null || v === undefined) return fallback
  return v as T
}

function sectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium text-gray-900">{label}</label>
      {description && <p className="mb-1.5 text-xs text-gray-400">{description}</p>}
      {children}
    </div>
  )
}

const TextInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={`w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 disabled:bg-gray-50 disabled:text-gray-500 ${className ?? ''}`}
    />
  ),
)

const NumberInput = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement> & { unit?: string }>(
  ({ unit, ...props }, ref) => (
    <div className="flex items-center gap-2">
      <input
        ref={ref}
        type="number"
        {...props}
        className="w-32 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
      />
      {unit && <span className="text-sm text-gray-500">{unit}</span>}
    </div>
  ),
)

function SaveBar({ isPending, onSave }: { isPending: boolean; onSave: () => void }) {
  return (
    <div className="flex justify-end pt-2">
      <Button onClick={onSave} disabled={isPending} className="gap-2">
        {isPending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Save className="h-4 w-4" />}
        Sauvegarder
      </Button>
    </div>
  )
}

// ── Zod schemas ───────────────────────────────────────────────────────────────

const generalSchema = z.object({
  school_name: z.string().min(2, 'Nom obligatoire').max(200),
  school_short_name: z.string().max(10).optional().or(z.literal('')),
  school_director_name: z.string().optional().or(z.literal('')),
  school_address: z.string().optional().or(z.literal('')),
  school_city: z.string().optional().or(z.literal('')),
  school_phone: z.string().optional().or(z.literal('')),
  school_phone_2: z.string().optional().or(z.literal('')),
  school_email: z.string().email('Email invalide').optional().or(z.literal('')),
  school_website: z.string().url('URL invalide').optional().or(z.literal('')),
  school_motto: z.string().max(200).optional().or(z.literal('')),
  school_founded_year: z.number().int().min(1900).max(new Date().getFullYear()),
  country: z.string(),
  timezone: z.string(),
  language: z.string(),
})
type GeneralForm = z.infer<typeof generalSchema>

const academicSchema = z.object({
  school_start_time: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm'),
  school_end_time: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm'),
  class_duration_minutes: z.number().int().min(30).max(180),
  break_duration_minutes: z.number().int().min(5).max(60),
  lunch_break_start: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm'),
  lunch_break_end: z.string().regex(/^([0-1]\d|2[0-3]):[0-5]\d$/, 'Format HH:mm'),
  school_days: z.array(z.number().int().min(1).max(6)).min(1, 'Au moins 1 jour requis'),
  max_students_per_class: z.number().int().min(1).max(200),
}).refine(d => d.school_end_time > d.school_start_time, {
  message: "L'heure de fin doit être après l'heure de début",
  path: ['school_end_time'],
})
type AcademicForm = z.infer<typeof academicSchema>

const gradingSchema = z.object({
  grading_scale: z.number().int().refine(v => [10, 20, 100].includes(v), 'Barème invalide'),
  passing_average: z.number().min(0),
  grade_rounding: z.enum(['half_up', 'floor', 'ceil']),
  grade_decimal_places: z.number().int().min(0).max(2),
  show_rank_in_report: z.boolean(),
  show_class_average: z.boolean(),
  show_min_max_in_report: z.boolean(),
  absence_counts_as_zero: z.boolean(),
  allow_grade_override: z.boolean(),
}).refine(d => d.passing_average <= d.grading_scale, {
  message: 'La moyenne de passage ne peut pas dépasser le barème',
  path: ['passing_average'],
})
type GradingForm = z.infer<typeof gradingSchema>

const attendanceSchema = z.object({
  attendance_risk_threshold: z.number().min(0).max(100),
  late_threshold_minutes: z.number().int().min(1).max(60),
  justify_absence_deadline_days: z.number().int().min(1).max(30),
  auto_mark_absent: z.boolean(),
  count_late_as_absent: z.boolean(),
  max_unjustified_absences: z.number().int().min(1).max(50),
  notify_absence_immediately: z.boolean(),
})
type AttendanceForm = z.infer<typeof attendanceSchema>

const notificationsSchema = z.object({
  notify_bulletin_published: z.boolean(),
  notify_absence_recorded: z.boolean(),
  notify_justification_submitted: z.boolean(),
  notify_payment_overdue: z.boolean(),
  notify_timetable_change: z.boolean(),
  email_notifications_enabled: z.boolean(),
  email_sender_name: z.string().optional().or(z.literal('')),
  email_sender_address: z.string().email().optional().or(z.literal('')),
  admin_notification_email: z.string().email().optional().or(z.literal('')),
})
type NotificationsForm = z.infer<typeof notificationsSchema>

// ── Tab components ────────────────────────────────────────────────────────────

function GeneralTab({ settings }: { settings: SchoolSetting[] }) {
  const bulk = useBulkUpdateSchoolSettings()
  const uploadLogo = useUploadLogo()

  const logoUrl = getVal<string>(settings, 'school_logo_path', '')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<GeneralForm>({
    resolver: zodResolver(generalSchema),
    defaultValues: {
      school_name:         getVal<string>(settings, 'school_name', ''),
      school_short_name:   getVal<string>(settings, 'school_short_name', ''),
      school_director_name:getVal<string>(settings, 'school_director_name', ''),
      school_address:      getVal<string>(settings, 'school_address', ''),
      school_city:         getVal<string>(settings, 'school_city', 'Abidjan'),
      school_phone:        getVal<string>(settings, 'school_phone', ''),
      school_phone_2:      getVal<string>(settings, 'school_phone_2', ''),
      school_email:        getVal<string>(settings, 'school_email', ''),
      school_website:      getVal<string>(settings, 'school_website', ''),
      school_motto:        getVal<string>(settings, 'school_motto', ''),
      school_founded_year: getVal<number>(settings, 'school_founded_year', 2000),
      country:             getVal<string>(settings, 'country', 'CI'),
      timezone:            getVal<string>(settings, 'timezone', 'Africa/Abidjan'),
      language:            getVal<string>(settings, 'language', 'fr'),
    },
  })

  const onSubmit = (data: GeneralForm) => {
    const payload: SettingUpdatePayload[] = Object.entries(data).map(([key, value]) => ({ key, value }))
    bulk.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Logo */}
      {sectionCard({
        title: 'Logo de l\'école',
        children: (
          <LogoUpload
            currentUrl={logoUrl || null}
            schoolName={getVal<string>(settings, 'school_name', 'E')}
            onUpload={file => uploadLogo.mutate(file)}
            isUploading={uploadLogo.isPending}
          />
        ),
      })}

      {/* Identité */}
      {sectionCard({
        title: 'Identité',
        children: (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Nom de l'école *" description={errors.school_name?.message}>
              <TextInput {...register('school_name')} className={errors.school_name ? 'border-red-400' : ''} />
            </Field>
            <Field label="Sigle (abrégé)">
              <TextInput {...register('school_short_name')} maxLength={10} placeholder="ex: ECSA" />
            </Field>
            <Field label="Devise de l'école">
              <TextInput {...register('school_motto')} placeholder="ex: Per aspera ad astra" />
            </Field>
            <Field label="Nom du directeur / directrice">
              <TextInput {...register('school_director_name')} />
            </Field>
            <Field label="Année de fondation" description={errors.school_founded_year?.message}>
              <TextInput {...register('school_founded_year', { valueAsNumber: true })} type="number" min={1900} max={new Date().getFullYear()} />
            </Field>
          </div>
        ),
      })}

      {/* Coordonnées */}
      {sectionCard({
        title: 'Coordonnées',
        children: (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Field label="Adresse">
                <textarea
                  {...register('school_address')}
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-none"
                />
              </Field>
            </div>
            <Field label="Ville">
              <TextInput {...register('school_city')} />
            </Field>
            <Field label="Téléphone principal">
              <TextInput {...register('school_phone')} type="tel" placeholder="+225 07 00 00 00 00" />
            </Field>
            <Field label="Téléphone secondaire">
              <TextInput {...register('school_phone_2')} type="tel" placeholder="Optionnel" />
            </Field>
            <Field label="Email de contact" description={errors.school_email?.message}>
              <TextInput {...register('school_email')} type="email" />
            </Field>
            <div className="sm:col-span-2">
              <Field label="Site web" description={errors.school_website?.message}>
                <TextInput {...register('school_website')} type="url" placeholder="https://..." />
              </Field>
            </div>
          </div>
        ),
      })}

      {/* Paramètres régionaux */}
      {sectionCard({
        title: 'Paramètres régionaux',
        children: (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Pays">
              <select {...register('country')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="CI">🇨🇮 Côte d'Ivoire</option>
              </select>
            </Field>
            <Field label="Fuseau horaire">
              <select {...register('timezone')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="Africa/Abidjan">Africa/Abidjan (GMT+0)</option>
                <option value="Africa/Lagos">Africa/Lagos (GMT+1)</option>
              </select>
            </Field>
            <Field label="Langue">
              <select {...register('language')} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value="fr">Français</option>
              </select>
            </Field>
            <Field label="Devise">
              <TextInput value="XOF" disabled readOnly />
            </Field>
          </div>
        ),
      })}

      <SaveBar isPending={bulk.isPending} onSave={handleSubmit(onSubmit)} />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AcademicTab({ settings }: { settings: SchoolSetting[] }) {
  const bulk = useBulkUpdateSchoolSettings()

  const defaultDays = (() => {
    const raw = getVal<unknown>(settings, 'school_days', [1,2,3,4,5])
    if (Array.isArray(raw)) return raw as number[]
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return [1,2,3,4,5] } }
    return [1,2,3,4,5]
  })()

  const [days, setDays] = useState<number[]>(defaultDays)

  const { register, handleSubmit, formState: { errors } } = useForm<AcademicForm>({
    resolver: zodResolver(academicSchema),
    defaultValues: {
      school_start_time:      getVal<string>(settings, 'school_start_time', '07:30'),
      school_end_time:        getVal<string>(settings, 'school_end_time', '17:00'),
      class_duration_minutes: getVal<number>(settings, 'class_duration_minutes', 60),
      break_duration_minutes: getVal<number>(settings, 'break_duration_minutes', 30),
      lunch_break_start:      getVal<string>(settings, 'lunch_break_start', '13:00'),
      lunch_break_end:        getVal<string>(settings, 'lunch_break_end', '15:00'),
      school_days:            defaultDays,
      max_students_per_class: getVal<number>(settings, 'max_students_per_class', 40),
    },
  })

  const onSubmit = (data: AcademicForm) => {
    const payload: SettingUpdatePayload[] = [
      ...Object.entries({ ...data, school_days: undefined }).filter(([k]) => k !== 'school_days').map(([key, value]) => ({ key, value })),
      { key: 'school_days', value: days },
    ]
    bulk.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Warning */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
        <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500 mt-0.5" />
        <p className="text-sm text-amber-700">
          La modification des horaires impacte la génération de l'emploi du temps. Pensez à mettre à jour les créneaux après modification.
        </p>
      </div>

      {sectionCard({
        title: 'Horaires',
        children: (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Heure de début des cours" description={errors.school_start_time?.message}>
              <TextInput {...register('school_start_time')} type="time" />
            </Field>
            <Field label="Heure de fin des cours" description={errors.school_end_time?.message}>
              <TextInput {...register('school_end_time')} type="time" />
            </Field>
            <Field label="Durée d'un cours">
              <NumberInput {...register('class_duration_minutes', { valueAsNumber: true })} unit="minutes" min={30} max={180} />
            </Field>
            <Field label="Durée de la récréation">
              <NumberInput {...register('break_duration_minutes', { valueAsNumber: true })} unit="minutes" min={5} max={60} />
            </Field>
          </div>
        ),
      })}

      {sectionCard({
        title: 'Pause déjeuner',
        children: (
          <div className="grid grid-cols-2 gap-4">
            <Field label="Début">
              <TextInput {...register('lunch_break_start')} type="time" />
            </Field>
            <Field label="Fin">
              <TextInput {...register('lunch_break_end')} type="time" />
            </Field>
          </div>
        ),
      })}

      {sectionCard({
        title: 'Jours scolaires',
        children: (
          <Field label="" description={errors.school_days?.message}>
            <DaySelector value={days} onChange={setDays} />
          </Field>
        ),
      })}

      {sectionCard({
        title: 'Organisation',
        children: (
          <Field label="Effectif maximum par classe">
            <NumberInput {...register('max_students_per_class', { valueAsNumber: true })} unit="élèves max" min={1} max={200} />
          </Field>
        ),
      })}

      <SaveBar isPending={bulk.isPending} onSave={handleSubmit(onSubmit)} />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function GradingTab({ settings }: { settings: SchoolSetting[] }) {
  const bulk = useBulkUpdateSchoolSettings()

  const defaultMentions = (() => {
    const raw = getVal<unknown>(settings, 'grade_mentions', {})
    if (typeof raw === 'object' && raw !== null && !Array.isArray(raw)) return raw as Record<string, string>
    if (typeof raw === 'string') { try { return JSON.parse(raw) } catch { return {} } }
    return { '16': 'Très Bien', '14': 'Bien', '12': 'Assez Bien', '10': 'Passable', '0': 'Insuffisant' }
  })()

  const [mentions, setMentions] = useState<Record<string, string>>(defaultMentions)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<GradingForm>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grading_scale:          getVal<number>(settings, 'grading_scale', 20),
      passing_average:        getVal<number>(settings, 'passing_average', 10),
      grade_rounding:         getVal<'half_up'|'floor'|'ceil'>(settings, 'grade_rounding', 'half_up'),
      grade_decimal_places:   getVal<number>(settings, 'grade_decimal_places', 2),
      show_rank_in_report:    getVal<boolean>(settings, 'show_rank_in_report', true),
      show_class_average:     getVal<boolean>(settings, 'show_class_average', true),
      show_min_max_in_report: getVal<boolean>(settings, 'show_min_max_in_report', true),
      absence_counts_as_zero: getVal<boolean>(settings, 'absence_counts_as_zero', false),
      allow_grade_override:   getVal<boolean>(settings, 'allow_grade_override', false),
    },
  })

  const scale = watch('grading_scale')

  const [showRank, setShowRank] = useState(getVal<boolean>(settings, 'show_rank_in_report', true))
  const [showAvg, setShowAvg] = useState(getVal<boolean>(settings, 'show_class_average', true))
  const [showMinMax, setShowMinMax] = useState(getVal<boolean>(settings, 'show_min_max_in_report', true))
  const [absenceZero, setAbsenceZero] = useState(getVal<boolean>(settings, 'absence_counts_as_zero', false))
  const [allowOverride, setAllowOverride] = useState(getVal<boolean>(settings, 'allow_grade_override', false))

  const onSubmit = (data: GradingForm) => {
    const payload: SettingUpdatePayload[] = [
      { key: 'grading_scale', value: data.grading_scale },
      { key: 'passing_average', value: data.passing_average },
      { key: 'grade_rounding', value: data.grade_rounding },
      { key: 'grade_decimal_places', value: data.grade_decimal_places },
      { key: 'show_rank_in_report', value: showRank },
      { key: 'show_class_average', value: showAvg },
      { key: 'show_min_max_in_report', value: showMinMax },
      { key: 'absence_counts_as_zero', value: absenceZero },
      { key: 'allow_grade_override', value: allowOverride },
      { key: 'grade_mentions', value: mentions },
    ]
    bulk.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {sectionCard({
        title: 'Système de notation',
        children: (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Barème de notation">
              <select {...register('grading_scale', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value={20}>Sur 20</option>
                <option value={10}>Sur 10</option>
                <option value={100}>Sur 100</option>
              </select>
            </Field>
            <Field label={`Moyenne de passage (sur ${scale ?? 20})`} description={errors.passing_average?.message}>
              <TextInput {...register('passing_average', { valueAsNumber: true })} type="number" step={0.5} min={0} max={scale} />
            </Field>
            <Field label="Arrondi des notes">
              <div className="space-y-2">
                {([
                  { value: 'half_up', label: 'Standard (0.5 → supérieur)' },
                  { value: 'floor',   label: 'Troncature (toujours inférieur)' },
                  { value: 'ceil',    label: 'Arrondi supérieur (toujours)' },
                ] as const).map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" value={opt.value} {...register('grade_rounding')} className="accent-indigo-600" />
                    {opt.label}
                  </label>
                ))}
              </div>
            </Field>
            <Field label="Décimales affichées">
              <select {...register('grade_decimal_places', { valueAsNumber: true })} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300">
                <option value={0}>0 décimale</option>
                <option value={1}>1 décimale</option>
                <option value={2}>2 décimales</option>
              </select>
            </Field>
          </div>
        ),
      })}

      {sectionCard({
        title: 'Affichage dans les bulletins',
        children: (
          <div className="divide-y divide-gray-100">
            <SettingSwitch label="Afficher le rang de l'élève dans la classe" value={showRank} onChange={setShowRank} />
            <SettingSwitch label="Afficher la moyenne de la classe" value={showAvg} onChange={setShowAvg} />
            <SettingSwitch label="Afficher les notes min/max de la classe" value={showMinMax} onChange={setShowMinMax} />
          </div>
        ),
      })}

      {sectionCard({
        title: 'Règles de notation',
        children: (
          <div className="divide-y divide-gray-100">
            <SettingSwitch
              label="Une absence à une évaluation compte comme zéro"
              description="Si désactivé, l'absence est ignorée dans le calcul"
              value={absenceZero}
              onChange={setAbsenceZero}
            />
            <SettingSwitch
              label="Autoriser la modification des notes verrouillées"
              description="Réservé aux school_admin uniquement"
              value={allowOverride}
              onChange={setAllowOverride}
            />
          </div>
        ),
      })}

      {sectionCard({
        title: 'Mentions',
        children: <MentionsEditor value={mentions} onChange={setMentions} />,
      })}

      <SaveBar isPending={bulk.isPending} onSave={handleSubmit(onSubmit)} />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function AttendanceTab({ settings }: { settings: SchoolSetting[] }) {
  const bulk = useBulkUpdateSchoolSettings()

  const [autoMark, setAutoMark] = useState(getVal<boolean>(settings, 'auto_mark_absent', false))
  const [countLate, setCountLate] = useState(getVal<boolean>(settings, 'count_late_as_absent', false))
  const [notifyImm, setNotifyImm] = useState(getVal<boolean>(settings, 'notify_absence_immediately', true))

  const { register, handleSubmit } = useForm<AttendanceForm>({
    resolver: zodResolver(attendanceSchema),
    defaultValues: {
      attendance_risk_threshold:    getVal<number>(settings, 'attendance_risk_threshold', 80),
      late_threshold_minutes:       getVal<number>(settings, 'late_threshold_minutes', 15),
      justify_absence_deadline_days:getVal<number>(settings, 'justify_absence_deadline_days', 3),
      auto_mark_absent:             getVal<boolean>(settings, 'auto_mark_absent', false),
      count_late_as_absent:         getVal<boolean>(settings, 'count_late_as_absent', false),
      max_unjustified_absences:     getVal<number>(settings, 'max_unjustified_absences', 10),
      notify_absence_immediately:   getVal<boolean>(settings, 'notify_absence_immediately', true),
    },
  })

  const threshold = getVal<number>(settings, 'attendance_risk_threshold', 80)

  const onSubmit = (data: AttendanceForm) => {
    const payload: SettingUpdatePayload[] = [
      { key: 'attendance_risk_threshold', value: data.attendance_risk_threshold },
      { key: 'late_threshold_minutes', value: data.late_threshold_minutes },
      { key: 'justify_absence_deadline_days', value: data.justify_absence_deadline_days },
      { key: 'max_unjustified_absences', value: data.max_unjustified_absences },
      { key: 'auto_mark_absent', value: autoMark },
      { key: 'count_late_as_absent', value: countLate },
      { key: 'notify_absence_immediately', value: notifyImm },
    ]
    bulk.mutate(payload)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {sectionCard({
        title: 'Seuils et alertes',
        children: (
          <div className="space-y-4">
            <Field label="Seuil d'alerte de présence" description={`En dessous de ${threshold}% — élève considéré à risque`}>
              <NumberInput {...register('attendance_risk_threshold', { valueAsNumber: true })} unit="%" min={0} max={100} step={1} />
            </Field>
            <Field label='Délai avant "En retard"' description="Un élève arrivé après X minutes est marqué En retard">
              <NumberInput {...register('late_threshold_minutes', { valueAsNumber: true })} unit="minutes" min={1} max={60} />
            </Field>
            <Field label="Max absences non justifiées avant alerte">
              <NumberInput {...register('max_unjustified_absences', { valueAsNumber: true })} unit="absences" min={1} max={50} />
            </Field>
          </div>
        ),
      })}

      {sectionCard({
        title: 'Justifications',
        children: (
          <Field label="Délai pour justifier une absence" description="Une absence peut être justifiée jusqu'à X jours après">
            <NumberInput {...register('justify_absence_deadline_days', { valueAsNumber: true })} unit="jours" min={1} max={30} />
          </Field>
        ),
      })}

      {sectionCard({
        title: 'Règles automatiques',
        children: (
          <div className="divide-y divide-gray-100">
            <SettingSwitch
              label="Marquer absent automatiquement si l'appel n'est pas fait"
              value={autoMark}
              onChange={setAutoMark}
            />
            <SettingSwitch
              label="Comptabiliser les retards comme des absences partielles"
              value={countLate}
              onChange={setCountLate}
            />
            <SettingSwitch
              label="Notifier l'admin à chaque nouvelle absence"
              value={notifyImm}
              onChange={setNotifyImm}
            />
          </div>
        ),
      })}

      <SaveBar isPending={bulk.isPending} onSave={handleSubmit(onSubmit)} />
    </form>
  )
}

// ─────────────────────────────────────────────────────────────────────────────

function NotificationsTab({ settings }: { settings: SchoolSetting[] }) {
  const bulk = useBulkUpdateSchoolSettings()

  const [notifs, setNotifs] = useState({
    notify_bulletin_published:      getVal<boolean>(settings, 'notify_bulletin_published', true),
    notify_absence_recorded:        getVal<boolean>(settings, 'notify_absence_recorded', true),
    notify_justification_submitted: getVal<boolean>(settings, 'notify_justification_submitted', true),
    notify_payment_overdue:         getVal<boolean>(settings, 'notify_payment_overdue', true),
    notify_timetable_change:        getVal<boolean>(settings, 'notify_timetable_change', true),
    email_notifications_enabled:    getVal<boolean>(settings, 'email_notifications_enabled', false),
  })

  const { register, handleSubmit, watch } = useForm<NotificationsForm>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      ...notifs,
      email_sender_name:       getVal<string>(settings, 'email_sender_name', 'Enma School'),
      email_sender_address:    getVal<string>(settings, 'email_sender_address', ''),
      admin_notification_email:getVal<string>(settings, 'admin_notification_email', ''),
    },
  })

  const emailEnabled = notifs.email_notifications_enabled

  const onSubmit = (data: NotificationsForm) => {
    const payload: SettingUpdatePayload[] = [
      ...Object.entries(notifs).map(([key, value]) => ({ key, value })),
      { key: 'email_sender_name', value: data.email_sender_name ?? '' },
      { key: 'email_sender_address', value: data.email_sender_address ?? '' },
      { key: 'admin_notification_email', value: data.admin_notification_email ?? '' },
    ]
    bulk.mutate(payload)
  }

  const appNotifItems = [
    { key: 'notify_bulletin_published' as const,      label: 'Bulletin publié',              description: "Notifier les enseignants à la publication d'un bulletin" },
    { key: 'notify_absence_recorded' as const,        label: 'Absence signalée',             description: "Notifier l'administration quand une absence est enregistrée" },
    { key: 'notify_justification_submitted' as const, label: 'Justification soumise',        description: 'Notifier quand une justification est soumise' },
    { key: 'notify_payment_overdue' as const,         label: 'Paiement en retard',           description: 'Notifier la comptabilité pour les frais en retard' },
    { key: 'notify_timetable_change' as const,        label: "Changement d'emploi du temps", description: 'Notifier les enseignants affectés en cas de modification' },
  ]

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {sectionCard({
        title: 'Notifications application',
        children: (
          <div className="divide-y divide-gray-100">
            {appNotifItems.map(item => (
              <SettingSwitch
                key={item.key}
                label={item.label}
                description={item.description}
                value={notifs[item.key]}
                onChange={v => setNotifs(prev => ({ ...prev, [item.key]: v }))}
              />
            ))}
          </div>
        ),
      })}

      {sectionCard({
        title: 'Notifications email',
        children: (
          <div className="space-y-4">
            <SettingSwitch
              label="Activer les notifications par email"
              value={emailEnabled}
              onChange={v => setNotifs(prev => ({ ...prev, email_notifications_enabled: v }))}
            />

            {emailEnabled && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 pt-2 border-t border-gray-100">
                <Field label="Nom d'expéditeur">
                  <TextInput {...register('email_sender_name')} placeholder="Enma School" />
                </Field>
                <Field label="Email d'expéditeur">
                  <TextInput {...register('email_sender_address')} type="email" />
                </Field>
                <div className="sm:col-span-2">
                  <Field label="Email administrateur (alertes)">
                    <TextInput {...register('admin_notification_email')} type="email" />
                  </Field>
                </div>
              </div>
            )}

            <div className="flex items-start gap-2 rounded-lg bg-blue-50 p-3">
              <Info className="h-4 w-4 shrink-0 text-blue-500 mt-0.5" />
              <p className="text-xs text-blue-700">
                Les emails nécessitent une configuration SMTP. Contactez votre administrateur système.
              </p>
            </div>
          </div>
        ),
      })}

      <SaveBar isPending={bulk.isPending} onSave={handleSubmit(onSubmit)} />
    </form>
  )
}

// ── Main page ─────────────────────────────────────────────────────────────────

const TABS: { id: SettingGroup; label: string }[] = [
  { id: 'general',       label: 'Général' },
  { id: 'academic',      label: 'Académique' },
  { id: 'grading',       label: 'Notes & Évaluations' },
  { id: 'attendance',    label: 'Présences' },
  { id: 'notifications', label: 'Notifications' },
]

export function SchoolSettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingGroup>('general')
  const { data, isLoading } = useSchoolSettings()

  const grouped: Record<string, SchoolSetting[]> = data?.data ?? {}
  const currentSettings = grouped[activeTab] ?? []

  if (isLoading) {
    return <div className="flex justify-center py-20"><LoadingSpinner size="lg" /></div>
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Paramètres de l'école</h1>
        <p className="text-sm text-gray-500 mt-1">Configuration générale de votre établissement</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <nav className="flex lg:flex-col gap-1 lg:w-56 shrink-0">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors text-left ${
                activeTab === tab.id
                  ? 'bg-indigo-50 text-indigo-700 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {currentSettings.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-sm text-gray-400 shadow-sm">
              Aucun paramètre configuré pour cette section.<br />
              <span className="text-xs mt-1 block">Exécutez : <code className="bg-gray-100 px-1 rounded">php artisan tenants:seed --class=SchoolSettingsSeeder</code></span>
            </div>
          ) : (
            <>
              {activeTab === 'general'       && <GeneralTab       settings={currentSettings} />}
              {activeTab === 'academic'      && <AcademicTab      settings={currentSettings} />}
              {activeTab === 'grading'       && <GradingTab       settings={currentSettings} />}
              {activeTab === 'attendance'    && <AttendanceTab    settings={currentSettings} />}
              {activeTab === 'notifications' && <NotificationsTab settings={currentSettings} />}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
