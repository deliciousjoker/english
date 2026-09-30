import { Link, useParams } from 'react-router'
import { allLessons, getLevel, lessonExists } from '../content/loader'
import { LEVEL_NAME, SITE_NAME } from '../config'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { completion, useProgress } from '../state/progress'
import { NotFoundPage } from './NotFoundPage'

export function LevelPage() {
  const { levelId = '' } = useParams()
  const level = getLevel(levelId)
  const { lessons } = useProgress()
  if (!level) return <NotFoundPage />

  const refs = allLessons.filter((l) => l.level === level.id)
  const ready = refs.filter((l) => l.available)
  const done = ready.filter((l) => completion(lessons[l.id]) >= 1).length

  return (
    <div className={`page levelpage lv-${level.id}`}>
      <header className="levelhead">
        <span className="cover" aria-hidden="true">
          <span className="cover__series">{SITE_NAME}</span>
          {level.id === 'starter' ? (
            <span className="cover__code cover__code--word">Starter</span>
          ) : (
            <LevelCode level={level.id} className="cover__code" />
          )}
        </span>
        <div className="levelhead__text">
          <p className="kicker">
            {level.id === 'starter' ? 'Starter' : <LevelCode level={level.id} />} · {LEVEL_NAME[level.id]}
            {level.units.length > 0 && ` · ${level.units.length} units, ${refs.length} lessons`}
          </p>
          <h1 className="page__title">{level.description}</h1>
          {done > 0 && (
            <p className="levelhead__progress">
              <span className="meter" style={{ ['--p' as string]: `${Math.round((done / ready.length) * 100)}%` }} aria-hidden="true" />
              {done} of {ready.length} lessons done
            </p>
          )}
        </div>
      </header>

      {level.units.length === 0 && <p className="empty">Lessons for this level are coming soon.</p>}

      <div className="units">
        {level.units.map((unit) => (
          <section key={unit.number} className="unit" aria-labelledby={`unit-${unit.number}`}>
            <h2 id={`unit-${unit.number}`} className="unit__title">
              <span className="unit__num" aria-label={`Unit ${unit.number}`}>
                {unit.number}
              </span>
              {unit.title}
            </h2>
            <ol className="unit__lessons">
              {unit.lessons.map((l, i) => {
                const available = lessonExists(l.id)
                const pct = Math.round(completion(lessons[l.id]) * 100)
                const inner = (
                  <>
                    <span className="lessonrow__num">{level.id === 'starter' ? i + 1 : `${unit.number}.${i + 1}`}</span>
                    <span className="lessonrow__title">{l.title}</span>
                    {available ? (
                      <span className="lessonrow__status">
                        {pct >= 100 ? (
                          <span className="stamp">Done</span>
                        ) : pct > 0 ? (
                          <>
                            <span className="meter" style={{ ['--p' as string]: `${pct}%` }} aria-hidden="true" />
                            {pct}%
                          </>
                        ) : (
                          <Icon name="arrowRight" size={16} />
                        )}
                      </span>
                    ) : (
                      <span className="lessonrow__status">soon</span>
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
    </div>
  )
}
