import { Link } from 'react-router'
import { allLessons, curriculum, lessonRef } from '../content/loader'
import { LEVEL_LABEL, SITE_TAGLINE, SPINE_NAME } from '../config'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { useProgress } from '../state/progress'

const INSIDE = [
  { title: 'Words', text: 'Hear every new word and see it in a sentence.' },
  { title: 'Read and listen', text: 'Short texts and dialogues. Tap any word, play any sentence.' },
  { title: 'Grammar', text: 'One clear pattern at a time — with help in Türkçe or العربية if you want it.' },
  { title: 'Practice and write', text: 'Check yourself, then write a few sentences about you.' },
]

export function HomePage() {
  const { lastLesson } = useProgress()
  const last = lastLesson ? lessonRef(lastLesson) : undefined
  const first = allLessons.find((l) => l.available)

  return (
    <div className="page home">
      <section className="home__intro">
        <p className="kicker">Reading · Listening · Writing</p>
        <h1 className="home__title">{SITE_TAGLINE}</h1>
        <p className="home__lead">
          Short texts, real dialogues and clear grammar — from your very first word to C1. Every sentence has audio,
          and every lesson ends with something new you can do.
        </p>
        <div className="home__cta">
          {last?.available ? (
            <Link to={`/lesson/${last.id}`} className="btn btn--primary btn--big">
              Continue: {last.title} <Icon name="arrowRight" size={18} />
            </Link>
          ) : (
            first && (
              <Link to={`/lesson/${first.id}`} className="btn btn--primary btn--big">
                Start from zero <Icon name="arrowRight" size={18} />
              </Link>
            )
          )}
          <Link to="/level/a1" className="btn btn--ghost btn--big">
            Go to <LevelCode level="a1" />
          </Link>
        </div>
      </section>

      <section className="shelf" aria-labelledby="shelf-title">
        <h2 id="shelf-title" className="shelf__title">
          Levels
        </h2>
        <ul className="shelf__row">
          {curriculum.levels.map((lv) => {
            const count = allLessons.filter((l) => l.level === lv.id && l.available).length
            const planned = allLessons.filter((l) => l.level === lv.id).length
            return (
              <li key={lv.id}>
                <Link to={`/level/${lv.id}`} className={`spine lv-${lv.id} ${count ? '' : 'is-soon'}`}>
                  <span className="spine__code">{lv.id === 'starter' ? 'Pre' : LEVEL_LABEL[lv.id]}</span>
                  <span className="spine__name">{SPINE_NAME[lv.id]}</span>
                  <span className="spine__count">{count ? (count < planned ? `${count} of ${planned} lessons` : `${count} lessons`) : 'soon'}</span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      <section className="inside" aria-labelledby="inside-title">
        <h2 id="inside-title" className="inside__title">
          Inside every lesson
        </h2>
        <ol className="inside__list">
          {INSIDE.map((s, i) => (
            <li key={s.title}>
              <span className="inside__num">{String(i + 1).padStart(2, '0')}</span>
              <span className="inside__name">{s.title}</span>
              <span className="inside__text">{s.text}</span>
            </li>
          ))}
        </ol>
      </section>
    </div>
  )
}
