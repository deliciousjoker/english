import { useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router'
import { audio } from '../audio/AudioService'
import { BidiText } from '../components/support/BidiText'
import { Icon } from '../components/ui/Icon'
import { PlayButton } from '../components/ui/PlayButton'
import { normalizeAnswer, seededShuffle } from '../lib/text'
import { useSettings } from '../state/settings'
import { dueWords, MAX_BOX, useWordbook, wordbook, type SavedWord } from '../state/words'
import { loadAllWords, type WordEntry } from './WordsPage'

type Lang = 'tr' | 'ar'
type Kind = 'meaning' | 'word' | 'listen'

/** Kutu yükseldikçe kart zorlaşır: anlamı seç → kelimeyi seç → dinleyip yaz. */
const kindFor = (box: number): Kind => (['meaning', 'meaning', 'word', 'listen', 'word', 'listen'] as const)[box] ?? 'listen'
const spoken = (w: SavedWord) => ({ key: `mine:${w.key}`, text: w.say ?? w.word })

function Meaning({ text, lang }: { text: string; lang: Lang }) {
  return (
    <span className={`support--${lang}`} lang={lang} dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <BidiText text={text} lang={lang} />
    </span>
  )
}

function nextDate(ms: number): string {
  const days = Math.ceil((ms - Date.now()) / 86400000)
  if (days <= 0) return 'today'
  if (days === 1) return 'tomorrow'
  return `in ${days} days`
}

/** Tek tek kartlar; her cevap kelimenin kutusunu günceller. */
function Practice({ words, pool, onDone }: { words: SavedWord[]; pool: WordEntry[]; onDone: () => void }) {
  const { supportLang } = useSettings()
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<{ given: string; correct: boolean } | null>(null)
  const [typed, setTyped] = useState('')
  const [score, setScore] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const next = useRef<HTMLButtonElement>(null)

  const w = words[i]
  const lang: Lang = supportLang !== 'none' && w?.gloss[supportLang] ? supportLang : w?.gloss.tr ? 'tr' : 'ar'
  const kind = w ? kindFor(w.box) : 'meaning'

  // Şıklar: doğru cevap + aynı seviyeden 3 çeldirici (her zaman aynı sırada)
  const options = useMemo(() => {
    if (!w || kind === 'listen') return []
    const others = pool.filter((p) => p.key !== w.key && (kind === 'word' || p.gloss[lang]) && p.level)
    const sameLevel = others.filter((p) => p.level === w.level)
    const picks = seededShuffle(sameLevel.length >= 3 ? sameLevel : others, w.key + i).slice(0, 3)
    const texts = kind === 'meaning' ? picks.map((p) => p.gloss[lang]!) : picks.map((p) => p.word)
    const right = kind === 'meaning' ? w.gloss[lang]! : w.word
    return seededShuffle([right, ...texts.filter((t) => t !== right)], w.key)
  }, [w, kind, pool, lang, i])

  useEffect(() => {
    if (!w) return
    if (kind !== 'word') void audio.play([spoken(w)])
    if (kind === 'listen') input.current?.focus()
  }, [w, kind])

  useEffect(() => {
    if (answer) next.current?.focus()
  }, [answer])

  if (!w)
    return (
      <div className="practice practice--done">
        <h2 className="practice__title">Well done!</h2>
        <p>
          You knew <b>{score}</b> of <b>{words.length}</b> words.
        </p>
        <button type="button" className="btn btn--primary" onClick={onDone}>
          Back to my words
        </button>
      </div>
    )

  const choose = (given: string) => {
    if (answer) return
    const right = kind === 'meaning' ? w.gloss[lang] : w.word
    const correct = kind === 'listen' ? normalizeAnswer(given) === normalizeAnswer(w.word) : given === right
    setAnswer({ given, correct })
    if (correct) setScore((s) => s + 1)
    wordbook.grade(w.key, correct)
    if (kind === 'word' || !correct) void audio.play([spoken(w)])
  }
  const goNext = () => {
    audio.stop()
    setAnswer(null)
    setTyped('')
    setI((n) => n + 1)
  }

  return (
    <div className="practice">
      <div className="practice__bar">
        <span>
          {i + 1} / {words.length}
        </span>
        <span className="practice__meter" style={{ ['--p' as string]: `${(i / words.length) * 100}%` }} aria-hidden="true" />
        <button type="button" className="btn btn--ghost" onClick={onDone}>
          Stop
        </button>
      </div>

      <div className="practice__card">
        {kind === 'meaning' && (
          <>
            <p className="practice__ask">What does it mean?</p>
            <p className="practice__prompt">
              <PlayButton items={[spoken(w)]} label={`Listen: ${w.word}`} /> {w.word}
            </p>
          </>
        )}
        {kind === 'word' && (
          <>
            <p className="practice__ask">Which word is it?</p>
            <p className="practice__prompt practice__prompt--meaning">
              <Meaning text={w.gloss[lang] ?? ''} lang={lang} />
            </p>
          </>
        )}
        {kind === 'listen' && (
          <>
            <p className="practice__ask">Listen and write the word.</p>
            <div className="practice__prompt">
              <PlayButton variant="pill" text="Listen again" items={[spoken(w)]} label="Listen again" />
            </div>
          </>
        )}

        {kind === 'listen' ? (
          <form
            className="practice__write"
            onSubmit={(e) => {
              e.preventDefault()
              if (typed.trim()) choose(typed)
            }}
          >
            <input
              ref={input}
              className={`dict__input ${answer ? (answer.correct ? 'is-correct' : 'is-wrong') : ''}`}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              disabled={!!answer}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              aria-label="Your answer"
            />
            {!answer && (
              <button type="submit" className="btn btn--primary">
                <Icon name="check" size={16} /> Check
              </button>
            )}
          </form>
        ) : (
          <div className="practice__options">
            {options.map((o) => {
              const right = kind === 'meaning' ? w.gloss[lang] : w.word
              const state = answer ? (o === right ? 'is-correct' : o === answer.given ? 'is-wrong' : '') : ''
              return (
                <button key={o} type="button" className={`opt practice__opt ${state}`} disabled={!!answer && !state} onClick={() => choose(o)}>
                  {kind === 'meaning' ? <Meaning text={o} lang={lang} /> : o}
                </button>
              )
            })}
          </div>
        )}

        {answer && (
          <div className={`practice__feedback ${answer.correct ? 'is-correct' : 'is-wrong'}`} role="status">
            <p className="practice__verdict">{answer.correct ? 'Right!' : 'Not this time.'}</p>
            <p className="practice__answer">
              <b>{w.word}</b> = <Meaning text={w.gloss[lang] ?? ''} lang={lang} />
            </p>
            {w.example && (
              <p className="practice__example">
                <PlayButton items={[{ key: `mine:${w.key}:e`, text: w.example, voice: w.exampleVoice }]} label="Listen to the example" />
                {w.example}
              </p>
            )}
            <button ref={next} type="button" className="btn btn--primary" onClick={goNext}>
              Next <Icon name="arrowRight" size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export function MyWordsPage() {
  const book = useWordbook()
  const { supportLang } = useSettings()
  const [pool, setPool] = useState<WordEntry[]>([])
  const [session, setSession] = useState<SavedWord[] | null>(null)

  useEffect(() => {
    loadAllWords().then(setPool)
  }, [])

  const list = Object.values(book).sort((a, b) => a.word.localeCompare(b.word, 'en'))
  const due = dueWords(book)
  const lang: Lang = supportLang === 'ar' ? 'ar' : 'tr'
  const nextDue = list.length ? Math.min(...list.map((w) => w.due)) : 0

  const start = (words: SavedWord[]) => setSession(seededShuffle(words, String(Date.now())).slice(0, 15))

  return (
    <div className="page refpage mywords">
      <header className="refhead">
        <h1 className="page__title">My words</h1>
        <p className="refhead__lead">
          Words you saved. Practice a little every day: a word you know comes back later, a word you forget comes back tomorrow.
        </p>
      </header>

      {session ? (
        <Practice words={session} pool={pool} onDone={() => setSession(null)} />
      ) : (
        <>
          <section className="mywords__start">
            {due.length > 0 ? (
              <>
                <p className="mywords__big">
                  <b>{Math.min(due.length, 15)}</b> {due.length === 1 ? 'word' : 'words'} to practice today
                </p>
                <button type="button" className="btn btn--primary btn--big" onClick={() => start(due)} disabled={!pool.length}>
                  Start practice <Icon name="arrowRight" size={18} />
                </button>
              </>
            ) : list.length > 0 ? (
              <>
                <p className="mywords__big">Nothing to practice today. Next practice: {nextDate(nextDue)}.</p>
                <button type="button" className="btn btn--ghost" onClick={() => start(list)} disabled={!pool.length}>
                  Practice anyway
                </button>
              </>
            ) : (
              <p className="mywords__big">
                No words yet. In a lesson, tap a word and press <b>Save word</b>, or save them in <Link to="/words">Words</Link>.
              </p>
            )}
          </section>

          {list.length > 0 && (
            <section aria-labelledby="mywords-list">
              <h2 id="mywords-list" className="mywords__h">
                Saved ({list.length})
              </h2>
              <ul className="mywords__list">
                {list.map((w) => (
                  <li key={w.key} className={`mywords__item ${w.level ? `lv-${w.level}` : ''}`}>
                    <PlayButton items={[spoken(w)]} label={`Listen: ${w.word}`} />
                    <span className="mywords__word">{w.word}</span>
                    <span className="mywords__gloss">{w.gloss[lang] && <Meaning text={w.gloss[lang]!} lang={lang} />}</span>
                    <span className="mywords__box" title={`Box ${w.box} of ${MAX_BOX}. Next: ${nextDate(w.due)}`}>
                      {Array.from({ length: MAX_BOX }, (_, k) => (
                        <i key={k} className={k < w.box ? 'is-on' : ''} />
                      ))}
                    </span>
                    <button type="button" className="iconbtn" onClick={() => wordbook.remove(w.key)} aria-label={`Remove ${w.word}`} title="Remove">
                      <Icon name="trash" size={18} />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}
    </div>
  )
}
