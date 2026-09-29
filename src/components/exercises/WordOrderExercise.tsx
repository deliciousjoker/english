import { useMemo, useState } from 'react'
import type { WordOrderExercise } from '../../content/schema'
import { seededShuffle } from '../../lib/text'
import { ExerciseShell, useReport } from './ExerciseShell'

/** "Where are you from?" → kelimeler ["Where","are","you","from"] ve son noktalama "?" */
function splitSentence(s: string) {
  const m = s.trim().match(/^(.*?)([.!?]*)$/)!
  return { words: m[1].split(/\s+/).filter(Boolean), end: m[2] }
}

export function WordOrderExerciseView({ section, id, index }: { section: WordOrderExercise; id: string; index: number }) {
  const items = useMemo(
    () =>
      section.items.map((s, i) => {
        const { words, end } = splitSentence(s)
        return { words, end, pool: seededShuffle(words.map((_, k) => k), `${id}:${i}:${s}`) }
      }),
    [section.items, id],
  )
  const [picked, setPicked] = useState<number[][]>(() => items.map(() => []))
  const [checked, setChecked] = useState(false)
  const report = useReport(id)

  const isRight = (i: number) =>
    picked[i].length === items[i].words.length && picked[i].map((k) => items[i].words[k]).join(' ') === items[i].words.join(' ')
  const correct = items.filter((_, i) => isRight(i)).length

  const toggle = (i: number, k: number) => {
    setChecked(false)
    setPicked((prev) =>
      prev.map((row, r) => (r !== i ? row : row.includes(k) ? row.filter((x) => x !== k) : [...row, k])),
    )
  }

  return (
    <ExerciseShell
      section={section}
      id={id}
      index={index}
      score={checked ? { correct, total: items.length } : null}
      onCheck={() => {
        setChecked(true)
        report(correct, items.length)
      }}
      onShow={() => {
        setPicked(items.map((it) => it.words.map((_, k) => k)))
        setChecked(true)
      }}
      onReset={() => {
        setPicked(items.map(() => []))
        setChecked(false)
      }}
    >
      <ol className="order">
        {items.map((it, i) => (
          <li key={i} className={`order__item ${checked ? (isRight(i) ? 'is-correct' : 'is-wrong') : ''}`}>
            <div className="order__line" aria-label="Your sentence">
              {picked[i].map((k) => (
                <button key={k} type="button" className="chip chip--placed" onClick={() => toggle(i, k)}>
                  {it.words[k]}
                </button>
              ))}
              {picked[i].length === it.words.length && <span className="order__end">{it.end}</span>}
              {picked[i].length === 0 && <span className="order__placeholder">Tap the words below</span>}
            </div>
            <div className="order__pool">
              {it.pool.map((k) =>
                picked[i].includes(k) ? (
                  <span key={k} className="chip chip--ghost" aria-hidden="true">
                    {it.words[k]}
                  </span>
                ) : (
                  <button key={k} type="button" className="chip" onClick={() => toggle(i, k)}>
                    {it.words[k]}
                  </button>
                ),
              )}
            </div>
          </li>
        ))}
      </ol>
    </ExerciseShell>
  )
}
