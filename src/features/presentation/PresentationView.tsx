import { useCallback, useEffect, useRef, useState } from 'react'
import type { Lesson } from '../../content/schema'
import { LevelCode } from '../../components/ui/LevelCode'
import { audio } from '../../audio/AudioService'
import { sectionId } from '../../components/lesson/LessonContext'
import { SectionView } from '../../components/lesson/SectionView'
import { sectionTitle } from '../../components/lesson/SectionFrame'
import { Icon } from '../../components/ui/Icon'
import { splitSubtitle } from '../../lib/text'
import { DrawingLayer, type Tool } from './DrawingLayer'
import { PresentTimer } from './PresentTimer'

const TOOLS: { tool: Tool; icon: 'pencil' | 'highlighter' | 'eraser'; label: string; key: string }[] = [
  { tool: 'red', icon: 'pencil', label: 'Red pen', key: 'P' },
  { tool: 'blue', icon: 'pencil', label: 'Blue pen', key: 'B' },
  { tool: 'marker', icon: 'highlighter', label: 'Highlighter', key: 'H' },
  { tool: 'eraser', icon: 'eraser', label: 'Eraser', key: 'E' },
]

/**
 * Sunum modu (Zoom/Teams ekran paylaşımı için): büyük yazı, menüler gizli,
 * her seferinde tek bölüm. Ok tuşları / PageUp-PageDown ile ilerler, Esc ile çıkar.
 * Öğretmen notları burada hiç görünmez.
 */
export function PresentationView({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const [slide, setSlide] = useState(0)
  const [tool, setTool] = useState<Tool | null>(null)
  const [cleared, setCleared] = useState(0)
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const stage = useRef<HTMLDivElement>(null)
  const total = lesson.sections.length + 1

  const go = useCallback(
    (to: number) => {
      const next = Math.max(0, Math.min(total - 1, to))
      audio.stop()
      setSlide(next)
      stage.current?.scrollTo({ top: 0 })
    },
    [total],
  )

  useEffect(() => {
    const root = document.documentElement
    root.classList.add('is-presenting')
    return () => {
      root.classList.remove('is-presenting')
      if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    }
  }, [])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof Element && e.target.closest('input, textarea, select')) return
      if (e.key === 'ArrowRight' || e.key === 'PageDown') go(slide + 1)
      else if (e.key === 'ArrowLeft' || e.key === 'PageUp') go(slide - 1)
      else if (e.key === 'Escape' && tool) setTool(null)
      else if (e.key === 'Escape' && !document.fullscreenElement) onExit()
      else if (!e.ctrlKey && !e.metaKey && !e.altKey && /^[pbhect]$/i.test(e.key)) {
        const k = e.key.toLowerCase()
        if (k === 'c') setCleared((n) => n + 1)
        else if (k === 't') setTimerEnd(Date.now() + 3 * 60000)
        else {
          const t = TOOLS.find((x) => x.key.toLowerCase() === k)!.tool
          setTool((cur) => (cur === t ? null : t))
        }
      } else return
      e.preventDefault()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [slide, go, onExit, tool])

  const toggleFullscreen = () => {
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {})
    else document.documentElement.requestFullscreen?.().catch(() => {})
  }

  const section = slide > 0 ? lesson.sections[slide - 1] : null
  const { story, focus } = splitSubtitle(lesson.subtitle)

  return (
    <div className={`present lv-${lesson.level}`}>
      <div className="present__stage" ref={stage}>
        <div className="present__content">
          {section ? (
            <SectionView key={slide} section={section} id={sectionId(section, slide - 1)} index={slide - 1} />
          ) : (
            <div className="present__title">
              <div className="banner">
                <div className="banner__unit" aria-hidden="true">
                  <small>Unit</small>
                  {lesson.unit}
                </div>
                <div className="banner__text">
                  <p className="banner__crumb">
                    <LevelCode level={lesson.level} /> · Lesson {lesson.order}
                  </p>
                  <h1 className="lesson__title">{lesson.title}</h1>
                  {story && <p className="lesson__subtitle">{story}</p>}
                </div>
              </div>
              {focus && (
                <p className="lesson__focus">
                  <span className="lesson__cando-label">Focus</span> {focus}
                </p>
              )}
              <div className="present__cando">
                <span className="lesson__cando-label">Today</span>
                <ul>
                  {lesson.canDo.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </div>
        <DrawingLayer tool={tool} clearKey={`${slide}:${cleared}`} />
      </div>

      <nav className="present__bar" aria-label="Presentation controls">
        <button
          type="button"
          className="iconbtn"
          onClick={() => go(slide - 1)}
          disabled={slide === 0}
          aria-label="Previous"
        >
          <Icon name="arrowLeft" />
        </button>
        <span className="present__where">
          <strong>
            {slide + 1} / {total}
          </strong>
          <span>{section ? sectionTitle(section) : 'Start'}</span>
        </span>
        <button
          type="button"
          className="iconbtn"
          onClick={() => go(slide + 1)}
          disabled={slide === total - 1}
          aria-label="Next"
        >
          <Icon name="arrowRight" />
        </button>
        <span className="present__spacer" />
        <span className="present__tools" role="group" aria-label="Drawing tools">
          {TOOLS.map((t) => (
            <button
              key={t.tool}
              type="button"
              className={`iconbtn ptool ptool--${t.tool} ${tool === t.tool ? 'is-on' : ''}`}
              onClick={() => setTool((cur) => (cur === t.tool ? null : t.tool))}
              aria-pressed={tool === t.tool}
              aria-label={t.label}
              title={`${t.label} (${t.key})`}
            >
              <Icon name={t.icon} />
            </button>
          ))}
          <button
            type="button"
            className="iconbtn"
            onClick={() => setCleared((n) => n + 1)}
            aria-label="Clear drawing"
            title="Clear drawing (C)"
          >
            <Icon name="trash" />
          </button>
        </span>
        <PresentTimer end={timerEnd} setEnd={setTimerEnd} />
        <button
          type="button"
          className="iconbtn"
          onClick={toggleFullscreen}
          aria-label="Full screen"
          title="Full screen"
        >
          <Icon name="expand" />
        </button>
        <button type="button" className="btn btn--ghost" onClick={onExit}>
          <Icon name="close" size={16} /> Exit
        </button>
      </nav>
    </div>
  )
}
