import { Link, useParams } from 'react-router'
import { getLevel, lessonExists } from '../content/loader'
import { LEVEL_LABEL, LEVEL_NAME } from '../config'
import { Icon } from '../components/ui/Icon'
import { completion, useProgress } from '../state/progress'
import { NotFoundPage } from './NotFoundPage'

export function LevelPage() {
  const { levelId = '' } = useParams()
  const level = getLevel(levelId)
  const { lessons } = useProgress()
  if (!level) return <NotFoundPage />

  return (
    <div className={`page levelpage lv-${level.id}`}>
      <header className="levelpage__head">
        <span className="levelpage__code">{LEVEL_LABEL[level.id]}</span>
        <div>
          <p className="kicker">{LEVEL_NAME[level.id]}</p>
          <h1 className="page__title">{level.description}</h1>
        </div>
      </header>

      {level.units.length === 0 && <p className="empty">Lessons for this level are coming soon.</p>}

      {level.units.map((unit) => (
        <section key={unit.number} className="unit" aria-labelledby={`unit-${unit.number}`}>
          <h2 id={`unit-${unit.number}`} className="unit__title">
            <span className="unit__num">Unit {unit.number}</span> {unit.title}
          </h2>
          <ol className="unit__lessons">
            {unit.lessons.map((l, i) => {
              const available = lessonExists(l.id)
              const done = Math.round(completion(lessons[l.id]) * 100)
              const inner = (
                <>
                  <span className="lessonrow__num">
                    {level.id === 'starter' ? i + 1 : `${unit.number}.${i + 1}`}
                  </span>
                  <span className="lessonrow__title">{l.title}</span>
                  {available ? (
                    <span className="lessonrow__status">
                      {done > 0 ? (
                        <>
                          <span className="meter" style={{ ['--p' as string]: `${done}%` }} aria-hidden="true" />
                          {done === 100 ? <Icon name="check" size={16} /> : `${done}%`}
                        </>
                      ) : (
                        <Icon name="arrowRight" size={16} />
                      )}
                    </span>
                  ) : (
                    <span className="lessonrow__status lessonrow__soon">soon</span>
                  )}
                </>
              )
              return (
                <li key={l.id}>
                  {available ? (
                    <Link to={`/lesson/${l.id}`} className="lessonrow">
                      {inner}
                    </Link>
                  ) : (
                    <div className="lessonrow is-soon" aria-disabled="true">
                      {inner}
                    </div>
                  )}
                </li>
              )
            })}
          </ol>
        </section>
      ))}
    </div>
  )
}
