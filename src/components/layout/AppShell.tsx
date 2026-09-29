import { useEffect, useRef, useState } from 'react'
import { Link, Outlet, ScrollRestoration } from 'react-router'
import { SITE_NAME } from '../../config'
import { useSettings, type Mode, type SupportLang, type Theme } from '../../state/settings'
import { Icon } from '../ui/Icon'
import { BrandMark } from './BrandMark'

function Segmented<T extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: T
  options: { value: T; label: string; lang?: string }[]
  onChange: (v: T) => void
  label: string
}) {
  return (
    <div className="seg" role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          lang={o.lang}
          className={`seg__opt ${value === o.value ? 'is-on' : ''}`}
          onClick={() => onChange(o.value)}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

const HELP_OPTIONS: { value: SupportLang; label: string; lang?: string }[] = [
  { value: 'none', label: 'EN' },
  { value: 'tr', label: 'TR', lang: 'tr' },
  { value: 'ar', label: 'ع', lang: 'ar' },
]

function SettingsMenu() {
  const s = useSettings()
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => !box.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div className="settings" ref={box}>
      <button type="button" className="iconbtn" aria-expanded={open} aria-label="Settings" onClick={() => setOpen((o) => !o)}>
        <Icon name="gear" />
      </button>
      {open && (
        <div className="settings__panel" role="dialog" aria-label="Settings">
          <div className="settings__row">
            <span className="settings__label">Help language</span>
            <Segmented<SupportLang>
              label="Help language"
              value={s.supportLang}
              onChange={(v) => s.update({ supportLang: v })}
              options={[
                { value: 'none', label: 'English only' },
                { value: 'tr', label: 'Türkçe', lang: 'tr' },
                { value: 'ar', label: 'العربية', lang: 'ar' },
              ]}
            />
          </div>
          <div className="settings__row">
            <span className="settings__label">Audio speed</span>
            <Segmented<'normal' | 'slow'>
              label="Audio speed"
              value={s.slow ? 'slow' : 'normal'}
              onChange={(v) => s.update({ slow: v === 'slow' })}
              options={[
                { value: 'normal', label: 'Normal' },
                { value: 'slow', label: 'Slow' },
              ]}
            />
          </div>
          <div className="settings__row">
            <span className="settings__label">Design (preview)</span>
            <Segmented<Theme>
              label="Design"
              value={s.theme}
              onChange={(v) => s.update({ theme: v })}
              options={[
                { value: 'notebook', label: 'Notebook' },
                { value: 'minimal', label: 'Minimal' },
                { value: 'warm', label: 'Warm' },
              ]}
            />
          </div>
          <div className="settings__row">
            <span className="settings__label">Appearance</span>
            <Segmented<Mode>
              label="Appearance"
              value={s.mode}
              onChange={(v) => s.update({ mode: v })}
              options={[
                { value: 'auto', label: 'Auto' },
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
              ]}
            />
          </div>
          {s.teacher && (
            <div className="settings__row">
              <span className="settings__label">Teacher view</span>
              <button type="button" className="btn btn--ghost" onClick={() => s.update({ teacher: false })}>
                Turn off
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function AppShell() {
  const s = useSettings()
  return (
    <>
      <a href="#main" className="skip">
        Skip to content
      </a>
      <header className="topbar">
        <Link to="/" className="brand" aria-label={`${SITE_NAME} — home`}>
          <BrandMark />
          <span className="brand__name">{SITE_NAME}</span>
        </Link>
        <div className="topbar__right">
          <div className="topbar__help">
            <span className="topbar__helplabel">Help</span>
            <Segmented<SupportLang>
              label="Help language"
              value={s.supportLang}
              onChange={(v) => s.update({ supportLang: v })}
              options={HELP_OPTIONS}
            />
          </div>
          <SettingsMenu />
        </div>
      </header>
      <main id="main">
        <Outlet />
      </main>
      <footer className="sitefoot">
        <span>
          {SITE_NAME} · {new Date().getFullYear()}
        </span>
        <span>Levels follow the CEFR (Starter → C1).</span>
      </footer>
      <ScrollRestoration />
    </>
  )
}
