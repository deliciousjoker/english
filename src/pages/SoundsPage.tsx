import { useState } from 'react'
import soundsJson from '../../content/sounds.json'
import { audio } from '../audio/AudioService'
import { Sounds, type SoundSet } from '../content/schema'
import { BidiText } from '../components/support/BidiText'
import { Icon } from '../components/ui/Icon'
import { PlayButton } from '../components/ui/PlayButton'
import { RecordButton } from '../components/ui/RecordButton'
import { useSettings } from '../state/settings'

const sounds = Sounds.parse(soundsJson)
const say = (w: string) => ({ key: `snd:${w}`, text: w })
const ROUNDS = 8

/** "Hangisini duydun?" oyunu: çiftlerden rastgele bir kelime çalar, öğrenci seçer. */
function Game({ set, onClose }: { set: SoundSet; onClose: () => void }) {
  const [rounds] = useState(() =>
    Array.from({ length: ROUNDS }, () => {
      const pair = set.pairs[Math.floor(Math.random() * set.pairs.length)]
      return { pair, answer: Math.random() < 0.5 ? 0 : 1 }
    }),
  )
  const [i, setI] = useState(0)
  const [chosen, setChosen] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const r = rounds[i]

  if (!r)
    return (
      <div className="sgame sgame--done">
        <p className="sgame__score">
          {score} / {ROUNDS}
        </p>
        <p>{score === ROUNDS ? 'Perfect ears!' : score >= ROUNDS - 2 ? 'Very good!' : 'Listen to the pairs again and try once more.'}</p>
        <button type="button" className="btn btn--ghost" onClick={onClose}>
          Close
        </button>
      </div>
    )

  const target = r.pair[r.answer]
  const pick = (k: number) => {
    if (chosen != null) return
    setChosen(k)
    if (k === r.answer) setScore((s) => s + 1)
  }
  return (
    <div className="sgame">
      <p className="sgame__ask">
        {i + 1} / {ROUNDS} · Which word do you hear?
      </p>
      <PlayButton variant="pill" text="Listen" items={[say(target)]} label="Listen to the word" />
      <div className="sgame__options">
        {r.pair.map((w, k) => {
          const state = chosen == null ? '' : k === r.answer ? 'is-correct' : k === chosen ? 'is-wrong' : ''
          return (
            <button key={w} type="button" className={`opt sgame__opt ${state}`} onClick={() => pick(k)} disabled={chosen != null && !state}>
              {w}
            </button>
          )
        })}
      </div>
      {chosen != null && (
        <button
          type="button"
          className="btn btn--primary"
          onClick={() => {
            setChosen(null)
            setI((n) => n + 1)
            const next = rounds[i + 1]
            if (next) void audio.play([say(next.pair[next.answer])])
          }}
        >
          Next <Icon name="arrowRight" size={16} />
        </button>
      )}
    </div>
  )
}

function Tip({ set }: { set: SoundSet }) {
  const { supportLang } = useSettings()
  const langs = supportLang === 'none' ? (['tr', 'ar'] as const) : [supportLang]
  return (
    <div className="sset__tips">
      {langs.map((lang) =>
        set.tip[lang] ? (
          <p key={lang} className={`sset__tip support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
            <BidiText text={set.tip[lang]!} lang={lang} />
          </p>
        ) : null,
      )}
    </div>
  )
}

export function SoundsPage() {
  const { supportLang } = useSettings()
  const [playing, setPlaying] = useState<string | null>(null)
  // Öğrencinin diline göre en zor setler önce
  const sets = [...sounds.sets].sort((a, b) => {
    if (supportLang === 'none') return 0
    return Number(b.for.includes(supportLang)) - Number(a.for.includes(supportLang))
  })

  return (
    <div className="page refpage sounds">
      <header className="refhead">
        <h1 className="page__title">Sounds</h1>
        <p className="refhead__lead">
          Pairs of sounds that are easy to mix up. Listen to both words, play the game, then say them yourself.
        </p>
      </header>

      <div className="sounds__list">
        {sets.map((set) => (
          <section key={set.id} className="sset" aria-labelledby={`sset-${set.id}`}>
            <header className="sset__head">
              <h2 id={`sset-${set.id}`} className="sset__title">
                {set.title}
              </h2>
              <span className="sset__for">
                {set.for.includes('tr') && <span>Hard for Turkish speakers</span>}
                {set.for.includes('ar') && <span>Hard for Arabic speakers</span>}
              </span>
            </header>
            <Tip set={set} />

            {playing === set.id ? (
              <Game key={set.id} set={set} onClose={() => setPlaying(null)} />
            ) : (
              <button
                type="button"
                className="btn btn--primary sset__play"
                onClick={() => {
                  setPlaying(set.id)
                }}
              >
                <Icon name="headphones" size={18} /> Which word do you hear?
              </button>
            )}

            <table className="sset__pairs">
              <thead>
                <tr>
                  <th>{set.sounds[0]}</th>
                  <th>{set.sounds[1]}</th>
                  <th>
                    <span className="sr-only">Say it</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {set.pairs.map(([a, b]) => (
                  <tr key={a + b}>
                    <td>
                      <PlayButton items={[say(a)]} label={`Listen: ${a}`} /> {a}
                    </td>
                    <td>
                      <PlayButton items={[say(b)]} label={`Listen: ${b}`} /> {b}
                    </td>
                    <td>
                      <RecordButton model={[say(a), say(b)]} label={`${a} and ${b}`} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  )
}
