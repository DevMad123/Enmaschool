// ===== src/modules/superadmin/types/settings.types.ts =====

export type SettingType = 'string' | 'integer' | 'float' | 'boolean' | 'array' | 'json'

export type SettingGroup = 'general' | 'email' | 'maintenance'

export interface SystemSetting {
  key: string
  value: string | number | boolean | string[] | Record<string, unknown> | null
  type: SettingType
  group: SettingGroup
  label: string
  description: string | null
  is_public: boolean
}

export type GroupedSettings = Record<SettingGroup, SystemSetting[]>

export interface UpdateSettingsDTO {
  settings: { key: string; value: string | number | boolean | null }[]
}
