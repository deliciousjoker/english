import { useMemo, useState } from 'react'
import type { MatchingExercise } from '../../content/schema'
import { seededShuffle } from '../../lib/text'
import { ExerciseShell, useReport } from './ExerciseShell'

type Active = { side: 'left' | 'right'; idx: number } | null

/** Soldan bir öğeye, sonra sağdan eşine dokun. Eşleşen çiftler aynı numarayı alır. */
export function MatchingExerciseView({ section, id, index }: { section: MatchingExercise; id: string; index: number }) {
  const n = section.pairs.length
  const rightOrder = useMemo(() => seededShuffle([...Array(n).keys()], id + section.pairs.join()), [n, id, section.pairs])
  const [match, setMatch] = useState<(number | null)[]>(() => Array(n).fill(null))
  const [active, setActive] = useState<Active>(null)
  const [checked, setChecked] = useState(false)
  const report = useReport(id)

  const correct = match.filter((m, i) => m === i).length

  const pair = (left: number, right: number) => {
    setChecked(false)
    setMatch((prev) => prev.map((m, i) => (i === left ? right : m === right ? null : m)))
    setActive(null)
  }

  const clickLeft = (i: number) => {
    if (active?.side === 'right') pair(i, active.idx)
    else setActive(active?.side === 'left' && active.idx === i ? null : { side: 'left', idx: i })
  }
  const clickRight = (j: number) => {
    if (active?.side === 'left') pair(active.idx, j)
    else setActive(active?.side === 'right' && active.idx === j ? null : { side: 'right', idx: j })
  }

  const leftOf = (j: number) => match.findIndex((m) => m === j)

  return (
    <ExerciseShell
      section={section}
      id={id}
      index={index}
      score={checked ? { correct, total: n } : null}
      onCheck={() => {
        setChecked(true)
        report(correct, n)
      }}
      onShow={() => {
        setMatch([...Array(n).keys()])
        setChecked(true)
      }}
      onReset={() => {
        setMatch(Array(n).fill(null))
        setActive(null)
        setChecked(false)
      }}
    >
      <div className="match">
        <ul className="match__col">
          {section.pairs.map(([l], i) => {
            const state = checked && match[i] != null ? (match[i] === i ? 'is-correct' : 'is-wrong') : ''
            return (
              <li key={i}>
                <button
                  type="button"
                  className={`match__card ${active?.side === 'left' && active.idx === i ? 'is-active' : ''} ${match[i] != null ? 'is-paired' : ''} ${state}`}
                  onClick={() => clickLeft(i)}
                >
                  <span className="match__badge">{match[i] != null ? i + 1 : ''}</span>
                  {l}
                </button>
              </li>
            )
          })}
        </ul>
        <ul className="match__col">
          {rightOrder.map((j) => {
            const li = leftOf(j)
            const state = checked && li >= 0 ? (li === j ? 'is-correct' : 'is-wrong') : ''
            return (
              <li key={j}>
                <button
                  type="button"
                  className={`match__card ${active?.side === 'right' && active.idx === j ? 'is-active' : ''} ${li >= 0 ? 'is-paired' : ''} ${state}`}
                  onClick={() => clickRight(j)}
                >
                  <span className="match__badge">{li >= 0 ? li + 1 : ''}</span>
                  {section.pairs[j][1]}
                </button>
              </li>
            )
          })}
        </ul>
      </div>
    </ExerciseShell>
  )
}
