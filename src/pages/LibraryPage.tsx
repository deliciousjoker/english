import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router'
import { getCharacter, getStory, loadGlossary, stories } from '../content/loader'
import { LEVELS, supportPolicy, type Glossary, type Level, type Story } from '../content/schema'
import { storyToLesson } from '../content/stories'
import { LEVEL_LABEL } from '../config'
import { buildVocabMap, LessonContext, sectionId, type LessonCtx, type WordSelection } from '../components/lesson/LessonContext'
import { SectionView } from '../components/lesson/SectionView'
import { WordCard } from '../components/reader/WordCard'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { audio } from '../audio/AudioService'
import { completion, progress, useLessonProgress, useProgress } from '../state/progress'
import { NotFoundPage } from './NotFoundPage'

const storyLevels = LEVELS.filter((lv) => stories.some((s) => s.level === lv))
const exerciseCount = (s: Story) => s.sections.filter((x) => x.type === 'exercise').length
const names = (s: Story) => s.characters.map((c) => getCharacter(c).name).join(', ')

/** Okuma kütüphanesi: /library */
export function LibraryPage() {
  const [level, setLevel] = useState<Level | 'all'>('all')
  const { lessons } = useProgress()
  const shown = stories.filter((s) => level === 'all' || s.level === level)

  return (
    <div className="page refpage library">
      <header className="refhead">
        <h1 className="page__title">Library</h1>
        <p className="refhead__lead">Short stories with audio. Read for fun, and tap any word you don't know.</p>
        <nav className="levelnav" aria-label="Level">
          <button type="button" className={`levelnav__link ${level === 'all' ? 'is-on' : ''}`} onClick={() => setLevel('all')}>
            All
          </button>
          {storyLevels.map((lv) => (
            <button key={lv} type="button" className={`levelnav__link lv-${lv} ${level === lv ? 'is-on' : ''}`} onClick={() => setLevel(lv)}>
              <span className="lvcode">{LEVEL_LABEL[lv]}</span>
            </button>
          ))}
        </nav>
      </header>

      <ul className="shelf">
        {shown.map((s) => {
          const lesson = storyToLesson(s)
          const done = completion({ ...(lessons[lesson.id] ?? { exercises: {}, canDo: {}, writing: {}, updatedAt: 0 }), totalExercises: exerciseCount(s) }) >= 1
          return (
            <li key={s.id}>
              <Link to={`/library/${s.id}`} className={`storycard lv-${s.level}`}>
                <span className="storycard__meta">
                  <LevelCode level={s.level} /> · {s.minutes} min
                </span>
                <span className="storycard__title">{s.title}</span>
                <span className="storycard__summary">{s.summary}</span>
                {s.characters.length > 0 && <span className="storycard__who">{names(s)}</span>}
                {done && <span className="stamp storycard__stamp">Read</span>}
              </Link>
            </li>
          )
        })}
      </ul>
    </div>
  )
}

/** Tek hikâye: /library/:storyId */
export function StoryPage() {
  const { storyId = '' } = useParams()
  const story = getStory(storyId)
  const [glossary, setGlossary] = useState<{ level: Level; g: Glossary } | null>(null)

  useEffect(() => {
    if (!story) return
    let alive = true
    loadGlossary(story.level).then((g) => alive && setGlossary({ level: story.level, g }))
    return () => {
      alive = false
      audio.stop()
    }
  }, [story])

  if (!story) return <NotFoundPage />
  if (glossary?.level !== story.level) return <div className="page page--loading" aria-busy="true" />
  return <StoryView key={story.id} story={story} glossary={glossary.g} />
}

function StoryView({ story, glossary }: { story: Story; glossary: Glossary }) {
  const lesson = useMemo(() => storyToLesson(story), [story])
  const [selection, selectWord] = useState<WordSelection | null>(null)
  const vocab = useMemo(() => buildVocabMap(lesson), [lesson])
  const ctx = useMemo<LessonCtx>(
    () => ({ lesson, glossary, vocab, policy: supportPolicy(story.level), selectWord, selection }),
    [lesson, glossary, vocab, story.level, selection],
  )
  const lp = useLessonProgress(lesson.id)
  const total = exerciseCount(story)

  useEffect(() => {
    progress.opened(lesson.id, total)
  }, [lesson.id, total])

  const more = stories.filter((s) => s.id !== story.id && s.level === story.level).slice(0, 3)
  const done = completion({ ...lp, totalExercises: total }) >= 1

  return (
    <LessonContext.Provider value={ctx}>
      <div className={`lesson story lv-${story.level}`}>
        <header className="lesson__head">
          <div className="banner banner--story">
            <div className="banner__text">
              <p className="banner__crumb">
                <Link to="/library">Library</Link> · <LevelCode level={story.level} /> · {story.minutes} min
                {story.characters.length > 0 && <> · {names(story)}</>}
              </p>
              <h1 className="lesson__title">{story.title}</h1>
              <p className="lesson__subtitle">{story.summary}</p>
            </div>
          </div>
        </header>

        <div className="lesson__sections">
          {story.sections.map((s, i) => (
            <SectionView key={sectionId(s, i)} section={s} id={sectionId(s, i)} index={i} />
          ))}

          <footer className="story__foot">
            {done && <span className="stamp">Read</span>}
            {more.length > 0 && (
              <div className="story__more">
                <p className="kicker">More stories</p>
                <ul>
                  {more.map((s) => (
                    <li key={s.id}>
                      <Link to={`/library/${s.id}`}>
                        {s.title} <Icon name="arrowRight" size={16} />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <Link to="/library" className="btn btn--ghost">
              <Icon name="arrowLeft" size={16} /> All stories
            </Link>
          </footer>
        </div>
      </div>
      <WordCard />
    </LessonContext.Provider>
  )
}
