import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getLevel, loadGlossary, loadLevelLessons } from '../content/loader'
import { LEVELS, supportPolicy, type Glossary, type Lesson, type Level } from '../content/schema'
import { LessonContext, sectionId, type LessonCtx, type WordSelection } from '../components/lesson/LessonContext'
import { SectionView } from '../components/lesson/SectionView'
import { WordCard } from '../components/reader/WordCard'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { buildUnitTest, unitTestId } from '../features/tests/buildUnitTest'
import { readJSON, writeJSON } from '../lib/storage'
import { progress, useLessonProgress } from '../state/progress'
import { NotFoundPage } from './NotFoundPage'

/** Ünite testi: /test/:level/:unit */
export function UnitTestPage() {
  const { level: lv = '', unit: u = '' } = useParams()
  const level = LEVELS.includes(lv as Level) ? (lv as Level) : null
  const unit = getLevel(lv)?.units.find((x) => String(x.number) === u)
  const [data, setData] = useState<{ key: string; lessons: Lesson[]; glossary: Glossary } | null>(null)
  const key = `${lv}-${u}`

  useEffect(() => {
    if (!level || !unit) return
    let alive = true
    Promise.all([loadLevelLessons(level), loadGlossary(level)]).then(([all, glossary]) => {
      if (alive) setData({ key, lessons: all.filter((l) => l.unit === unit.number), glossary })
    })
    return () => {
      alive = false
    }
  }, [level, unit, key])

  if (!level || !unit) return <NotFoundPage />
  if (data?.key !== key) return <div className="page page--loading" aria-busy="true" />
  if (data.lessons.length === 0)
    return (
      <div className="page page--narrow">
        <h1 className="page__title">No lessons in this unit yet.</h1>
      </div>
    )
  return <TestView key={key} level={level} unit={unit.number} unitTitle={unit.title} lessons={data.lessons} glossary={data.glossary} />
}

function TestView(props: { level: Level; unit: number; unitTitle: string; lessons: Lesson[]; glossary: Glossary }) {
  const { level, unit, unitTitle, lessons, glossary } = props
  const id = unitTestId(level, unit)
  const attemptKey = `attempt:${id}`
  const [attempt, setAttempt] = useState(() => readJSON<number>(attemptKey, 1))
  const [selection, selectWord] = useState<WordSelection | null>(null)
  const test = useMemo(() => buildUnitTest(lessons, level, unit, unitTitle, `${id}:${attempt}`), [lessons, level, unit, unitTitle, id, attempt])
  const ctx = useMemo<LessonCtx>(
    // Testte kelimeler vurgulanmaz (ipucu olmasın) ama dokununca anlamı çıkar
    () => ({ lesson: test, glossary, vocab: new Map(), policy: supportPolicy(level), selectWord, selection }),
    [test, glossary, level, selection],
  )
  const results = useLessonProgress(id).exercises
  const parts = test.sections.map((s, i) => ({ s, sid: sectionId(s, i) })).filter((p) => p.s.type === 'exercise')
  const done = parts.filter((p) => results[p.sid])
  const correct = done.reduce((n, p) => n + results[p.sid].correct, 0)
  const total = done.reduce((n, p) => n + results[p.sid].total, 0)
  const pct = total ? Math.round((correct / total) * 100) : 0
  const finished = done.length === parts.length

  const newTest = () => {
    for (const p of parts) progress.clearExercise(id, p.sid)
    const next = attempt + 1
    writeJSON(attemptKey, next)
    setAttempt(next)
    window.scrollTo({ top: 0 })
  }

  return (
    <LessonContext.Provider value={ctx}>
      <div className={`lesson lv-${level}`}>
        <header className="lesson__head">
          <div className="banner">
            <div className="banner__unit" aria-hidden="true">
              <small>Unit</small>
              {unit}
            </div>
            <div className="banner__text">
              <p className="banner__crumb">
                <Link to={`/level/${level}`}>
                  <LevelCode level={level} />
                </Link>{' '}
                · {unitTitle}
              </p>
              <h1 className="lesson__title">Unit test</h1>
              <p className="lesson__subtitle">Words, grammar, listening and reading from this unit.</p>
            </div>
          </div>
          <p className="test__intro">
            Answer every part and press <b>Check</b>. Your score is at the bottom. Each new test has different questions.
          </p>
        </header>

        <div className="lesson__sections test__sections">
          {test.sections.map((s, i) => (
            <SectionView key={`${attempt}:${sectionId(s, i)}`} section={s} id={sectionId(s, i)} index={i} />
          ))}

          <section className={`testresult ${finished ? (pct >= 70 ? 'is-pass' : 'is-retry') : ''}`} aria-live="polite">
            <p className="testresult__score">
              {total ? `${correct} / ${total}` : '—'}
              {total > 0 && <span> · {pct}%</span>}
            </p>
            <p>
              {!finished
                ? `Checked ${done.length} of ${parts.length} parts.`
                : pct >= 70
                  ? 'Well done! You are ready for the next unit.'
                  : 'Go back to the lessons of this unit, then try a new test.'}
            </p>
            <div className="testresult__actions">
              <button type="button" className="btn btn--ghost" onClick={newTest}>
                <Icon name="reset" size={16} /> New test
              </button>
              <Link to={`/level/${level}`} className="btn btn--primary">
                Back to <LevelCode level={level} />
              </Link>
            </div>
          </section>
        </div>
      </div>
      <WordCard />
    </LessonContext.Provider>
  )
}
