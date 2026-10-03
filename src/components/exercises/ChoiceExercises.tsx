import { useState } from 'react'
import type { McqExercise, Support, TrueFalseExercise } from '../../content/schema'
import { SupportText } from '../support/SupportText'
import { Pic } from '../ui/Pic'
import { PlayButton } from '../ui/PlayButton'
import { ExerciseShell, useReport } from './ExerciseShell'

type Choice = { prompt: string; options: string[]; answer: number; audio?: string; voice?: string; hint?: Support; image?: string }

/** Tıklayınca hemen geri bildirim veren seçmeli sorular (çoktan seçmeli ve doğru/yanlış ortak). */
function ChoiceList({
  section,
  id,
  index,
  items,
  inline,
}: {
  section: McqExercise | TrueFalseExercise
  id: string
  index: number
  items: Choice[]
  inline?: boolean
}) {
  const [answers, setAnswers] = useState<(number | null)[]>(() => items.map(() => null))
  const [revealed, setRevealed] = useState(false)
  const report = useReport(id)

  const correct = answers.filter((a, i) => a === items[i].answer).length
  const done = answers.every((a) => a != null)

  const choose = (i: number, o: number) => {
    if (answers[i] != null || revealed) return
    const next = answers.map((a, j) => (j === i ? o : a))
    setAnswers(next)
    if (next.every((a) => a != null)) {
      report(
        next.filter((a, j) => a === items[j].answer).length,
        items.length,
      )
    }
  }

  return (
    <ExerciseShell
      section={section}
      id={id}
      index={index}
      score={done ? { correct, total: items.length } : null}
      onShow={() => setRevealed(true)}
      onReset={() => {
        setAnswers(items.map(() => null))
        setRevealed(false)
      }}
    >
      <ol className={`choices ${inline ? 'choices--inline' : ''}`}>
        {items.map((item, i) => (
          <li key={i} className={`choices__item ${item.image ? 'has-pic' : ''}`}>
            {item.image && <Pic name={item.image} className="choices__pic" />}
            <div className="choices__prompt">
              {item.audio && (
                <PlayButton
                  variant="pill"
                  text="Listen"
                  items={[{ key: `${id}:a${i}`, text: item.audio, voice: item.voice }]}
                  label="Listen"
                />
              )}
              <span>{item.prompt}</span>
              <SupportText support={item.hint} as="span" className="choices__hint" />
            </div>
            <div className="choices__options">
              {item.options.map((opt, o) => {
                const chosen = answers[i] === o
                const isAnswer = o === item.answer
                const show = answers[i] != null || revealed
                const state = show && isAnswer ? 'is-correct' : chosen && !isAnswer ? 'is-wrong' : ''
                return (
                  <button
                    key={o}
                    type="button"
                    className={`opt ${state} ${chosen ? 'is-chosen' : ''}`}
                    onClick={() => choose(i, o)}
                    disabled={show && !chosen && !isAnswer}
                    aria-pressed={chosen}
                  >
                    {opt}
                  </button>
                )
              })}
            </div>
          </li>
        ))}
      </ol>
    </ExerciseShell>
  )
}

export function McqExerciseView({ section, id, index }: { section: McqExercise; id: string; index: number }) {
  return <ChoiceList section={section} id={id} index={index} items={section.items} />
}

export function TrueFalseExerciseView({ section, id, index }: { section: TrueFalseExercise; id: string; index: number }) {
  const items = section.items.map((it) => ({ prompt: it.statement, options: ['True', 'False'], answer: it.answer ? 0 : 1 }))
  return <ChoiceList section={section} id={id} index={index} items={items} inline />
}
