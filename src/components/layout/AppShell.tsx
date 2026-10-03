import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, ScrollRestoration, useLocation } from 'react-router'
import { COPYRIGHT, SITE_NAME } from '../../config'
import { useSettings, type Mode, type SupportLang, type VoiceMode } from '../../state/settings'
import { useNaturalVoicesAvailable } from '../../audio/AudioService'
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

/** Ana bölümler. Dersler ve seviye sayfaları da "Lessons" sayılır. */
function MainNav({ className }: { className: string }) {
  const { pathname } = useLocation()
  const inLessons = pathname === '/' || pathname.startsWith('/level') || pathname.startsWith('/lesson')
  return (
    <nav className={className} aria-label="Main">
      <NavLink to="/" className={`mainnav__link ${inLessons ? 'is-on' : ''}`}>
        Lessons
      </NavLink>
      <NavLink to="/words" className={({ isActive }) => `mainnav__link ${isActive ? 'is-on' : ''}`}>
        Words
      </NavLink>
      <NavLink to="/library" className={({ isActive }) => `mainnav__link ${isActive ? 'is-on' : ''}`}>
        Library
      </NavLink>
      <NavLink to="/grammar" className={({ isActive }) => `mainnav__link ${isActive ? 'is-on' : ''}`}>
        Grammar
      </NavLink>
      <NavLink to="/sounds" className={({ isActive }) => `mainnav__link ${isActive ? 'is-on' : ''}`}>
        Sounds
      </NavLink>
    </nav>
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
  const natural = useNaturalVoicesAvailable()
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
          <div className="settings__row settings__nav" onClick={(e) => (e.target as HTMLElement).closest('a') && setOpen(false)}>
            <span className="settings__label">Go to</span>
            <MainNav className="mainnav mainnav--panel" />
          </div>
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
          {natural && (
            <div className="settings__row">
              <span className="settings__label">Voice</span>
              <Segmented<VoiceMode>
                label="Voice"
                value={s.voiceMode}
                onChange={(v) => s.update({ voiceMode: v })}
                options={[
                  { value: 'recorded', label: 'Recorded' },
                  { value: 'live', label: 'Edge natural' },
                ]}
              />
              <span className="settings__hint">Edge natural: the best voices in this browser, but only here.</span>
            </div>
          )}
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
        <Link to="/" className="brand" aria-label={`${SITE_NAME}, home`}>
          <BrandMark />
          <span className="brand__name">{SITE_NAME}</span>
        </Link>
        <MainNav className="mainnav mainnav--bar" />
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
          {SITE_NAME} · free English lessons for our class
        </span>
        <span>{COPYRIGHT}</span>
      </footer>
      <ScrollRestoration />
    </>
  )
}
