import { useState } from 'react'
import type { DictationExercise } from '../../content/schema'
import { answerWords } from '../../lib/text'
import { PlayButton } from '../ui/PlayButton'
import { ExerciseShell, useReport } from './ExerciseShell'

/** Beklenen kelimelerden hangileri yazılmış? (en uzun ortak alt dizi ile hizalama) */
function diffWords(expected: string[], typed: string[]): boolean[] {
  const m = expected.length
  const n = typed.length
  const dp = Array.from({ length: m + 1 }, () => Array<number>(n + 1).fill(0))
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = expected[i] === typed[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1])
  const ok = Array<boolean>(m).fill(false)
  let i = 0
  let j = 0
  while (i < m && j < n) {
    if (expected[i] === typed[j]) {
      ok[i] = true
      i++
      j++
    } else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return ok
}

export function DictationExerciseView({ section, id, index }: { section: DictationExercise; id: string; index: number }) {
  const n = section.items.length
  const [values, setValues] = useState<string[]>(() => Array(n).fill(''))
  const [checked, setChecked] = useState(false)
  const [revealed, setRevealed] = useState(false)
  const report = useReport(id)

  const results = section.items.map((it, i) => {
    const expected = answerWords(it.text)
    const typed = answerWords(values[i])
    return { ok: expected.join(' ') === typed.join(' '), marks: diffWords(expected, typed) }
  })
  const correct = results.filter((r) => r.ok).length

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
        setRevealed(true)
        setChecked(true)
      }}
      onReset={() => {
        setValues(Array(n).fill(''))
        setChecked(false)
        setRevealed(false)
      }}
    >
      <ol className="dict">
        {section.items.map((it, i) => {
          const r = results[i]
          const words = it.text.split(/\s+/)
          return (
            <li key={i} className={`dict__item ${checked ? (r.ok ? 'is-correct' : 'is-wrong') : ''}`}>
              <PlayButton items={[{ key: `${id}:d${i}`, text: it.say ?? it.text, voice: it.voice }]} label={`Listen to sentence ${i + 1}`} />
              <input
                className="dict__input"
                value={values[i]}
                onChange={(e) => {
                  setChecked(false)
                  setValues((prev) => prev.map((v, k) => (k === i ? e.target.value : v)))
                }}
                placeholder="Write what you hear"
                autoCapitalize="sentences"
                autoCorrect="off"
                autoComplete="off"
                spellCheck={false}
                aria-label={`Sentence ${i + 1}`}
              />
              {checked && (!r.ok || revealed) && (
                <p className="dict__answer">
                  {words.map((w, k) => (
                    <span key={k} className={r.marks[k] ? 'dict__ok' : 'dict__miss'}>
                      {w}{' '}
                    </span>
                  ))}
                </p>
              )}
            </li>
          )
        })}
      </ol>
    </ExerciseShell>
  )
}
