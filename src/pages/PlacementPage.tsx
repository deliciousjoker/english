import { useEffect, useState } from 'react'
import { Link } from 'react-router'
import placementJson from '../../content/placement.json'
import { audio } from '../audio/AudioService'
import { allLessons } from '../content/loader'
import { Placement, type Level } from '../content/schema'
import { LEVEL_LABEL, LEVEL_NAME, SITE_NAME } from '../config'
import { Icon } from '../components/ui/Icon'
import { LevelCode } from '../components/ui/LevelCode'
import { PlayButton } from '../components/ui/PlayButton'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Seviye belirleme sınavı: /placement
 * Seviyeler sırayla gelir; bir seviyede geçme sınırının altında kalınca durur ve o seviyeyi önerir.
 */

const placement = Placement.parse(placementJson)

export type PlacementResult = { level: Level; beyond: boolean; scores: { level: Level; correct: number; total: number }[]; at: number }

/** Son sınav sonucu (bu tarayıcıda) */
export function readPlacementResult(): PlacementResult | null {
  return readJSON<PlacementResult | null>('placement', null)
}

const itemKey = (s: number, i: number) => `placement:${s}:${i}`

/** Sonucu tarih damgasıyla bu tarayıcıya kaydeder. */
function saveResult(level: Level, beyond: boolean, scores: PlacementResult['scores']): PlacementResult {
  const r: PlacementResult = { level, beyond, scores, at: Date.now() }
  writeJSON('placement', r)
  return r
}

function Result({ result, onAgain }: { result: PlacementResult; onAgain: () => void }) {
  const ready = allLessons.some((l) => l.level === result.level && l.available)
  const first = allLessons.find((l) => l.level === result.level && l.available)
  return (
    <div className="placement__result">
      <div className="levelhead">
        <span className={`cover lv-${result.level}`} aria-hidden="true">
          <span className="cover__series">{SITE_NAME}</span>
          {result.level === 'starter' ? <span className="cover__code cover__code--word">Starter</span> : <LevelCode level={result.level} className="cover__code" />}
        </span>
        <div className="levelhead__text">
          <p className="kicker">Your result</p>
          <h2 className="page__title">
            {result.beyond ? 'Great! You are B1 or higher.' : `Start with ${LEVEL_LABEL[result.level]}: ${LEVEL_NAME[result.level]}`}
          </h2>
          <p>
            {result.beyond
              ? 'Our B1 lessons are coming soon. Talk to your teacher about the next step.'
              : ready
                ? 'Begin with the first lesson. If it feels too easy, move on quickly.'
                : 'These lessons are coming soon. Talk to your teacher; you can review the level before it.'}
          </p>
        </div>
      </div>
      <ul className="placement__scores">
        {result.scores.map((s) => (
          <li key={s.level} className={`lv-${s.level}`}>
            <span className="placement__lv">{s.level === 'starter' ? 'Starter' : <LevelCode level={s.level} />}</span>
            <span className="meter" style={{ ['--p' as string]: `${(s.correct / s.total) * 100}%` }} aria-hidden="true" />
            {s.correct} / {s.total}
          </li>
        ))}
      </ul>
      <div className="home__cta">
        {first && !result.beyond && (
          <Link to={`/lesson/${first.id}`} className="btn btn--primary btn--big">
            Start: {first.title} <Icon name="arrowRight" size={18} />
          </Link>
        )}
        <Link to={`/level/${result.level}`} className="btn btn--ghost btn--big">
          See all <LevelCode level={result.level} /> lessons
        </Link>
        <button type="button" className="btn btn--ghost btn--big" onClick={onAgain}>
          <Icon name="reset" size={18} /> Take the test again
        </button>
      </div>
    </div>
  )
}

export function PlacementPage() {
  const [result, setResult] = useState<PlacementResult | null>(() => readPlacementResult())
  const [started, setStarted] = useState(false)
  const [sec, setSec] = useState(0)
  const [i, setI] = useState(0)
  const [correct, setCorrect] = useState(0)
  const [scores, setScores] = useState<PlacementResult['scores']>([])

  const section = placement.sections[sec]
  const item = section?.items[i]
  const answered = scores.reduce((n, s) => n + s.total, 0) + i
  const maxQuestions = placement.sections.reduce((n, s) => n + s.items.length, 0)

  // Dinleme sorusu gelince kendiliğinden çalsın (öğrenci düğmeye basarak başladığı için izin var)
  useEffect(() => {
    if (started && item?.audio) void audio.play([{ key: itemKey(sec, i), text: item.audio, voice: item.voice }])
  }, [started, sec, i, item])

  const answer = (k: number | null) => {
    audio.stop()
    const right = k === item.answer
    const c = correct + (right ? 1 : 0)
    if (i + 1 < section.items.length) {
      setCorrect(c)
      setI(i + 1)
      return
    }
    // Bölüm bitti: geçtiyse sonraki seviye, geçemediyse sonuç
    const done = [...scores, { level: section.level, correct: c, total: section.items.length }]
    const passed = c >= placement.pass
    if (passed && sec + 1 < placement.sections.length) {
      setScores(done)
      setSec(sec + 1)
      setI(0)
      setCorrect(0)
      return
    }
    setResult(saveResult(section.level, passed, done))
  }

  const restart = () => {
    setResult(null)
    setStarted(false)
    setSec(0)
    setI(0)
    setCorrect(0)
    setScores([])
  }

  return (
    <div className="page placement">
      <header className="refhead">
        <h1 className="page__title">Level test</h1>
        <p className="refhead__lead">Not sure where to start? Answer a few questions and we'll suggest a book.</p>
      </header>

      {result ? (
        <Result result={result} onAgain={restart} />
      ) : !started ? (
        <div className="placement__intro">
          <ul className="pr__bullets">
            <li>About 10 minutes, {maxQuestions} questions or fewer.</li>
            <li>Some questions have audio. Use headphones if you can.</li>
            <li>Don't guess. If you don't know, choose "I don't know".</li>
          </ul>
          <button type="button" className="btn btn--primary btn--big" onClick={() => setStarted(true)}>
            Start the test <Icon name="arrowRight" size={18} />
          </button>
        </div>
      ) : (
        <div className="practice placement__q">
          <div className="practice__bar">
            <span>Question {answered + 1}</span>
            <span className="practice__meter" style={{ ['--p' as string]: `${(answered / maxQuestions) * 100}%` }} aria-hidden="true" />
          </div>
          <div className="practice__card">
            {item.audio && (
              <PlayButton variant="pill" text="Listen again" items={[{ key: itemKey(sec, i), text: item.audio, voice: item.voice }]} label="Listen again" />
            )}
            <p className="placement__prompt">{item.prompt}</p>
            <div className="practice__options">
              {item.options.map((o, k) => (
                <button key={o} type="button" className="opt practice__opt" onClick={() => answer(k)}>
                  {o}
                </button>
              ))}
              <button type="button" className="opt practice__opt placement__dunno" onClick={() => answer(null)}>
                I don't know
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
