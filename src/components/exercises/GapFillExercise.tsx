import { useMemo, useRef, useState } from 'react'
import type { GapFillExercise } from '../../content/schema'
import { normalizeAnswer, parseGaps } from '../../lib/text'
import { ExerciseShell, useReport } from './ExerciseShell'

export function GapFillExerciseView({ section, id, index }: { section: GapFillExercise; id: string; index: number }) {
  const parsed = useMemo(() => section.items.map(parseGaps), [section.items])
  const gaps = parsed.map((parts) => parts.filter((p) => p.kind === 'gap'))
  const bankLongest = Math.max(0, ...(section.bank ?? []).map((w) => w.length))
  const empty = () => gaps.map((g) => g.map(() => ''))

  const [values, setValues] = useState<string[][]>(empty)
  const [checked, setChecked] = useState(false)
  const focused = useRef<{ item: number; gap: number } | null>(null)
  const inputs = useRef(new Map<string, HTMLInputElement>())
  const report = useReport(id)

  const isRight = (item: number, gap: number) =>
    gaps[item][gap].answers.some((a) => normalizeAnswer(a) === normalizeAnswer(values[item][gap] ?? ''))

  const total = gaps.reduce((n, g) => n + g.length, 0)
  const correct = gaps.reduce((n, g, i) => n + g.filter((_, j) => isRight(i, j)).length, 0)

  const setValue = (item: number, gap: number, v: string) => {
    setChecked(false)
    setValues((prev) => prev.map((row, i) => (i === item ? row.map((x, j) => (j === gap ? v : x)) : row)))
  }

  // Bankadaki kelimeye dokununca: odaktaki (yoksa ilk boş) boşluğa yazılır, sonraki boşluğa geçilir
  const fillFromBank = (word: string) => {
    let target = focused.current
    if (!target || values[target.item][target.gap]) {
      target = null
      for (let i = 0; i < gaps.length && !target; i++)
        for (let j = 0; j < gaps[i].length && !target; j++) if (!values[i][j]) target = { item: i, gap: j }
    }
    if (!target) return
    setValue(target.item, target.gap, word)
    // bir sonraki boşluğa odaklan
    const flat = gaps.flatMap((g, i) => g.map((_, j) => ({ item: i, gap: j })))
    const k = flat.findIndex((f) => f.item === target!.item && f.gap === target!.gap)
    const next = flat.slice(k + 1).find((f) => !values[f.item][f.gap])
    focused.current = next ?? null
    if (next) inputs.current.get(`${next.item}-${next.gap}`)?.focus({ preventScroll: true })
  }

  return (
    <ExerciseShell
      section={section}
      id={id}
      index={index}
      score={checked ? { correct, total } : null}
      onCheck={() => {
        setChecked(true)
        report(correct, total)
      }}
      onShow={() => {
        setValues(gaps.map((g) => g.map((gap) => gap.answers[0])))
        setChecked(true)
      }}
      onReset={() => {
        setValues(empty())
        setChecked(false)
      }}
    >
      {section.bank && (
        <div className="bank" aria-label="Word bank">
          {section.bank.map((w) => (
            <button key={w} type="button" className="chip" onMouseDown={(e) => e.preventDefault()} onClick={() => fillFromBank(w)}>
              {w}
            </button>
          ))}
        </div>
      )}
      <ol className="gaps">
        {parsed.map((parts, i) => (
          <li key={i} className="gaps__item">
            {parts.map((p, k) => {
              if (p.kind === 'text') return <span key={k}>{p.text}</span>
              // Bankalı alıştırmada kutu genişliği cevabı ele vermesin: hepsi en uzun kelime kadar
              const longest = Math.max(...p.answers.map((a) => a.length), bankLongest, 3)
              const state = checked ? (isRight(i, p.index) ? 'is-correct' : 'is-wrong') : ''
              return (
                <input
                  key={k}
                  ref={(el) => {
                    if (el) inputs.current.set(`${i}-${p.index}`, el)
                  }}
                  className={`gap ${state}`}
                  style={{ width: `${longest + 2}ch` }}
                  value={values[i][p.index]}
                  onFocus={() => (focused.current = { item: i, gap: p.index })}
                  onChange={(e) => setValue(i, p.index, e.target.value)}
                  autoCapitalize="off"
                  autoCorrect="off"
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={`Gap ${p.index + 1}`}
                />
              )
            })}
          </li>
        ))}
      </ol>
    </ExerciseShell>
  )
}
