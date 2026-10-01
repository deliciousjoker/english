import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router'
import { allLessons, getLevel, lessonRef, levelsWithLessons, loadLevelLessons } from '../content/loader'
import { supportPolicy, type GrammarSection as GrammarData, type Lesson, type Level } from '../content/schema'
import { GrammarBody } from '../components/grammar/GrammarSection'
import { sectionTitle } from '../components/lesson/SectionFrame'
import { sectionId } from '../components/lesson/LessonContext'
import { LevelCode } from '../components/ui/LevelCode'
import { useProgress } from '../state/progress'

type Item = { lesson: Lesson; section: GrammarData; anchor: string; sectionAnchor: string }

/** "Grammar: at, on, in" → "At, on, in" */
function shortTitle(s: GrammarData): string {
  const t = sectionTitle(s).replace(/^Grammar:\s*/i, '')
  return t.charAt(0).toUpperCase() + t.slice(1)
}

/** Gramer rehberi: bir seviyedeki bütün gramer kutuları, ünite ünite. */
export function GrammarPage() {
  const { level: param } = useParams()
  const { lastLesson } = useProgress()
  const fallback = (lastLesson && lessonRef(lastLesson)?.level) || 'a1'
  const level = (levelsWithLessons.includes(param as Level) ? param : fallback) as Level
  const [loaded, setLoaded] = useState<{ level: Level; lessons: Lesson[] } | null>(null)

  useEffect(() => {
    let alive = true
    loadLevelLessons(level).then((lessons) => alive && setLoaded({ level, lessons }))
    return () => {
      alive = false
    }
  }, [level])

  const lessons = loaded?.level === level ? loaded.lessons : null
  const items: Item[] = (lessons ?? []).flatMap((lesson) =>
    lesson.sections.flatMap((s, i) =>
      s.type === 'grammar' ? [{ lesson, section: s, anchor: `${lesson.id}-g${i}`, sectionAnchor: sectionId(s, i) }] : [],
    ),
  )
  const units = (getLevel(level)?.units ?? [])
    .map((u) => ({ ...u, items: items.filter((it) => it.lesson.unit === u.number) }))
    .filter((u) => u.items.length)
  const policy = supportPolicy(level)

  return (
    <div className={`page refpage lv-${level}`}>
      <header className="refhead">
        <h1 className="page__title">Grammar</h1>
        <p className="refhead__lead">Every grammar box from the lessons, in one place.</p>
        <nav className="levelnav" aria-label="Level">
          {levelsWithLessons.map((lv) => (
            <Link key={lv} to={`/grammar/${lv}`} className={`levelnav__link lv-${lv} ${lv === level ? 'is-on' : ''}`}>
              <LevelCode level={lv} />
            </Link>
          ))}
        </nav>
      </header>

      {!lessons ? (
        <div className="page--loading" aria-busy="true" />
      ) : (
        <div className="refpage__layout">
          <nav className="toc" aria-label="Contents">
            {units.map((u) => (
              <div key={u.number} className="toc__unit">
                <span className="toc__unitname">
                  <span className="unit__num">{u.number}</span> {u.title}
                </span>
                <ol>
                  {u.items.map((it) => (
                    <li key={it.anchor}>
                      <a href={`#${it.anchor}`}>{shortTitle(it.section)}</a>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </nav>

          <div className="refpage__list">
            {units.map((u) => (
              <section key={u.number} className="refunit" aria-labelledby={`gu-${u.number}`}>
                <h2 id={`gu-${u.number}`} className="unit__title">
                  <span className="unit__num">{u.number}</span> {u.title}
                </h2>
                {u.items.map((it) => {
                  const ref = allLessons.find((l) => l.id === it.lesson.id)
                  return (
                    <article key={it.anchor} id={it.anchor} className="refcard">
                      <header className="refcard__head">
                        <h3 className="refcard__title">{shortTitle(it.section)}</h3>
                        <Link to={`/lesson/${it.lesson.id}#${it.sectionAnchor}`} className="refcard__from">
                          {ref ? `${ref.unitNumber}.${ref.order}` : ''} {it.lesson.title}
                        </Link>
                      </header>
                      <GrammarBody section={it.section} id={`${it.lesson.id}:${it.sectionAnchor}`} policy={policy} />
                    </article>
                  )
                })}
              </section>
            ))}
            {units.length === 0 && <p className="empty">No grammar for this level yet.</p>}
          </div>
        </div>
      )}
    </div>
  )
}
