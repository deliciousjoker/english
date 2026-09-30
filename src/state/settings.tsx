import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { audio } from '../audio/AudioService'
import { readJSON, writeJSON } from '../lib/storage'

export type SupportLang = 'none' | 'tr' | 'ar'
export type Mode = 'auto' | 'light' | 'dark'

export type Settings = {
  supportLang: SupportLang
  mode: Mode
  slow: boolean
  teacher: boolean
}

const DEFAULTS: Settings = { supportLang: 'none', mode: 'auto', slow: false, teacher: false }

type Ctx = Settings & { update: (patch: Partial<Settings>) => void }

const SettingsContext = createContext<Ctx | null>(null)

function initialSettings(): Settings {
  const saved = { ...DEFAULTS, ...readJSON<Partial<Settings>>('settings', {}) }
  // ?teacher=1 bir kez açınca öğretmen görünümü kalıcı olarak açılır (?teacher=0 kapatır)
  const param = new URLSearchParams(location.search).get('teacher')
  if (param === '1') saved.teacher = true
  if (param === '0') saved.teacher = false
  return saved
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(initialSettings)

  useEffect(() => {
    writeJSON('settings', settings)
    const root = document.documentElement
    audio.rate = settings.slow ? 0.75 : 1
    // "auto" ise sistemin açık/koyu tercihine uyar; CSS sadece data-scheme'e bakar
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const apply = () => {
      root.dataset.scheme = settings.mode === 'auto' ? (media.matches ? 'dark' : 'light') : settings.mode
    }
    apply()
    media.addEventListener('change', apply)
    return () => media.removeEventListener('change', apply)
  }, [settings])

  const value = useMemo<Ctx>(
    () => ({ ...settings, update: (patch) => setSettings((s) => ({ ...s, ...patch })) }),
    [settings],
  )
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings(): Ctx {
  const ctx = useContext(SettingsContext)
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider')
  return ctx
}
