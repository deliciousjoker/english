import { Link } from 'react-router'
import { allLessons, curriculum, lessonRef } from '../content/loader'
import { LEVEL_NAME, SITE_NAME } from '../config'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { completion, useProgress } from '../state/progress'

export function HomePage() {
  const { lastLesson, lessons } = useProgress()
  const last = lastLesson ? lessonRef(lastLesson) : undefined
  const first = allLessons.find((l) => l.available)

  return (
    <div className="page home">
      <section className="home__hello">
        <p className="home__greet">
          <span>Welcome</span>
          <span className="home__sep" aria-hidden="true">/</span>
          <span lang="tr">Hoş geldin</span>
          <span className="home__sep" aria-hidden="true">/</span>
          <bdi lang="ar">أهلاً بك</bdi>
        </p>
        <h1 className="home__title">Our English coursebook</h1>
        <p className="home__lead">
          Free lessons for Turkish and Arabic speakers, from the very first word up to C1. You read, listen and write
          here. We practise speaking together in class.
        </p>
        <p className="home__tip">
          <span>
            Tap a word like <mark>breakfast</mark> and see
          </span>
          <span className="home__gloss" lang="tr">
            kahvaltı
          </span>
          <span>or</span>
          <span className="home__gloss" lang="ar">
            فطور
          </span>
        </p>
        {last?.available ? (
          <Link to={`/lesson/${last.id}`} className={`resume lv-${last.level}`}>
            <LevelCode level={last.level} className="resume__code" />
            <span className="resume__text">
              <small>
                Continue · Unit {last.unitNumber}, lesson {last.order}
              </small>
              <strong>{last.title}</strong>
            </span>
            <Icon name="arrowRight" />
          </Link>
        ) : (
          first && (
            <div className="home__cta">
              <Link to={`/lesson/${first.id}`} className="btn btn--primary btn--big">
                Start from zero <Icon name="arrowRight" size={18} />
              </Link>
              <Link to="/level/a1" className="btn btn--ghost btn--big">
                I know some English
              </Link>
            </div>
          )
        )}
      </section>

      <section className="books" aria-labelledby="books-title">
        <div className="books__head">
          <h2 id="books-title" className="books__title">
            The books
          </h2>
          <p className="books__note">Six levels, the same steps as the CEFR.</p>
        </div>
        <ul className="books__grid">
          {curriculum.levels.map((lv) => {
            const refs = allLessons.filter((l) => l.level === lv.id)
            const ready = refs.filter((l) => l.available)
            const done = ready.filter((l) => completion(lessons[l.id]) >= 1).length
            const pct = ready.length ? Math.round((done / ready.length) * 100) : 0
            return (
              <li key={lv.id}>
                <Link to={`/level/${lv.id}`} className={`cover lv-${lv.id} ${ready.length ? '' : 'is-soon'}`}>
                  <span className="cover__series">{SITE_NAME}</span>
                  <span className="cover__name">{lv.id === 'starter' ? 'First steps' : LEVEL_NAME[lv.id]}</span>
                  {lv.id === 'starter' ? (
                    <span className="cover__code cover__code--word">Starter</span>
                  ) : (
                    <LevelCode level={lv.id} className="cover__code" />
                  )}
                  <span className="cover__meta">
                    {ready.length === 0
                      ? 'Coming soon'
                      : ready.length < refs.length
                        ? `${ready.length} of ${refs.length} lessons`
                        : `${refs.length} lessons`}
                    {done > 0 && <span className="cover__bar" style={{ ['--p' as string]: `${pct}%` }} title={`${done} done`} />}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
