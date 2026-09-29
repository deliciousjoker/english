import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { audio } from '../audio/AudioService'
import { loadGlossary, loadLesson, lessonRef, neighbours } from '../content/loader'
import { supportPolicy, type Glossary, type Lesson } from '../content/schema'
import { LessonContext, buildVocabMap, sectionId, type LessonCtx, type WordSelection } from '../components/lesson/LessonContext'
import { SectionView } from '../components/lesson/SectionView'
import { sectionTitle } from '../components/lesson/SectionFrame'
import { WordCard } from '../components/reader/WordCard'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { progress, useLessonProgress, completion } from '../state/progress'
import { useSettings } from '../state/settings'
import { PresentationView } from '../features/presentation/PresentationView'
import { useScrollSpy } from '../lib/useScrollSpy'

type Loaded = { id: string; lesson: Lesson; glossary: Glossary }

export function LessonPage() {
  const { lessonId = '' } = useParams()
  const [loaded, setLoaded] = useState<Loaded | null>(null)
  const [error, setError] = useState<{ id: string; message: string } | null>(null)

  useEffect(() => {
    let alive = true
    loadLesson(lessonId)
      .then(async (lesson) => {
        const glossary = await loadGlossary(lesson.level)
        if (alive) setLoaded({ id: lessonId, lesson, glossary })
      })
      .catch((e: Error) => alive && setError({ id: lessonId, message: e.message }))
    return () => {
      alive = false
      audio.stop()
    }
  }, [lessonId])

  if (error?.id === lessonId) {
    return (
      <div className="page page--narrow">
        <h1 className="page__title">This lesson isn't ready yet.</h1>
        <pre className="error-box">{error.message}</pre>
        <Link to="/" className="btn btn--ghost">
          <Icon name="arrowLeft" size={16} /> Back to all levels
        </Link>
      </div>
    )
  }
  if (loaded?.id !== lessonId) return <div className="page page--loading" aria-busy="true" />
  return <LessonView key={lessonId} lesson={loaded.lesson} glossary={loaded.glossary} />
}

function LessonView({ lesson, glossary }: { lesson: Lesson; glossary: Glossary }) {
  const [selection, selectWord] = useState<WordSelection | null>(null)
  const [presenting, setPresenting] = useState(false)
  const { teacher } = useSettings()
  const lp = useLessonProgress(lesson.id)

  const vocab = useMemo(() => buildVocabMap(lesson), [lesson])
  const ctx = useMemo<LessonCtx>(
    () => ({ lesson, glossary, vocab, policy: supportPolicy(lesson.level), selectWord, selection }),
    [lesson, glossary, vocab, selection],
  )

  const ids = lesson.sections.map((s, i) => sectionId(s, i))
  const exerciseCount = lesson.sections.filter((s) => s.type === 'exercise').length
  const ref = lessonRef(lesson.id)
  const { prev, next } = neighbours(lesson.id)
  // Sunumdan dönünce bölümler yeniden oluşur; gözlemci de yeniden kurulsun
  const current = useScrollSpy(presenting ? [] : ids)

  useEffect(() => {
    progress.opened(lesson.id, exerciseCount)
  }, [lesson.id, exerciseCount])

  const done = Math.round(completion({ ...lp, totalExercises: exerciseCount }) * 100)

  return (
    <LessonContext.Provider value={ctx}>
      {presenting ? (
        <PresentationView lesson={lesson} onExit={() => setPresenting(false)} />
      ) : (
        <div className={`lesson lv-${lesson.level}`}>
          <header className="lesson__head">
            <p className="kicker">
              <Link to={`/level/${lesson.level}`}>
                <LevelCode level={lesson.level} />
              </Link>
              <span aria-hidden="true"> · </span>
              Unit {lesson.unit}
              <span aria-hidden="true"> · </span>
              Lesson {lesson.order}
              {ref?.unitTitle && <span className="kicker__unit"> — {ref.unitTitle}</span>}
            </p>
            <h1 className="lesson__title">{lesson.title}</h1>
            {lesson.subtitle && <p className="lesson__subtitle">{lesson.subtitle}</p>}
            <div className="lesson__meta">
              <div className="lesson__cando">
                <span className="lesson__cando-label">In this lesson</span>
                <ul>
                  {lesson.canDo.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
              <div className="lesson__actions">
                <button type="button" className="btn btn--primary" onClick={() => setPresenting(true)}>
                  <Icon name="screen" size={18} /> Present
                </button>
                <span className="lesson__done" title="Exercises done">
                  <span className="meter" style={{ ['--p' as string]: `${done}%` }} aria-hidden="true" />
                  {done}% done
                </span>
              </div>
            </div>
          </header>

          {teacher && lesson.teacherNotes && (
            <details className="teacher-notes">
              <summary>
                <Icon name="note" size={18} /> Öğretmen notları
              </summary>
              <ul>
                {lesson.teacherNotes.map((n, i) => (
                  <li key={i}>{n}</li>
                ))}
              </ul>
            </details>
          )}

          <div className="lesson__layout">
            <nav className="steps" aria-label="Lesson sections">
              <ol>
                {lesson.sections.map((s, i) => (
                  <li key={ids[i]}>
                    <a href={`#${ids[i]}`} className={`steps__link ${current === ids[i] ? 'is-current' : ''} ${lp.exercises[ids[i]] ? 'is-done' : ''}`}>
                      <span className="steps__num">{String(i + 1).padStart(2, '0')}</span>
                      <span className="steps__label">{sectionTitle(s)}</span>
                    </a>
                  </li>
                ))}
              </ol>
            </nav>

            <div className="lesson__sections">
              {lesson.sections.map((s, i) => (
                <SectionView key={ids[i]} section={s} id={ids[i]} index={i} />
              ))}

              <footer className="lesson__foot">
                {prev ? (
                  <Link to={prev.available ? `/lesson/${prev.id}` : `/level/${prev.level}`} className="lesson__nav lesson__nav--prev">
                    <Icon name="arrowLeft" size={16} />
                    <span>
                      <small>Previous</small>
                      {prev.title}
                    </span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link
                    to={next.available ? `/lesson/${next.id}` : `/level/${next.level}`}
                    className={`lesson__nav lesson__nav--next ${next.available ? '' : 'is-soon'}`}
                  >
                    <span>
                      <small>{next.available ? 'Next lesson' : 'Coming soon'}</small>
                      {next.title}
                    </span>
                    <Icon name="arrowRight" size={16} />
                  </Link>
                )}
              </footer>
            </div>
          </div>
        </div>
      )}
      <WordCard />
    </LessonContext.Provider>
  )
}
