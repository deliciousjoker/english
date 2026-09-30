import { useState, type ReactNode } from 'react'
import type { ExerciseSection } from '../../content/schema'
import { progress, useLessonProgress } from '../../state/progress'
import { Icon } from '../ui/Icon'
import { SectionFrame } from '../lesson/SectionFrame'
import { useLesson } from '../lesson/LessonContext'

export type Score = { correct: number; total: number } | null

type Props = {
  section: ExerciseSection
  id: string
  index: number
  score: Score
  onCheck?: () => void
  onShow?: () => void
  onReset: () => void
  children: ReactNode
}

/** Alıştırmaların ortak çerçevesi: talimat, Check / Show answers / Try again ve puan. */
export function ExerciseShell({ section, id, index, score, onCheck, onShow, onReset, children }: Props) {
  const { lesson } = useLesson()
  const last = useLessonProgress(lesson.id).exercises[id]
  // Cevaplar gösterildiyse puan yerine bunu söyle (öğrenci kendi bulmadı)
  const [shown, setShown] = useState(false)

  return (
    <SectionFrame section={section} id={id} index={index} instructions={section.instructions} support={section.support}>
      <div className="ex">{children}</div>
      <div className="ex__bar">
        {onCheck && (
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => {
              setShown(false)
              onCheck()
            }}
          >
            <Icon name="check" size={16} /> Check
          </button>
        )}
        {onShow && (
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => {
              setShown(true)
              onShow()
            }}
          >
            <Icon name="eye" size={16} /> Show answers
          </button>
        )}
        <button
          type="button"
          className="btn btn--ghost"
          onClick={() => {
            setShown(false)
            onReset()
          }}
        >
          <Icon name="reset" size={16} /> Try again
        </button>
        {shown ? (
          <span className="score score--last" role="status">
            Answers shown
          </span>
        ) : score ? (
          <span className={`score ${score.correct === score.total ? 'score--full' : ''}`} role="status">
            {score.correct} / {score.total}
            {score.correct === score.total ? '. Well done!' : ''}
          </span>
        ) : last ? (
          <span className="score score--last">
            Last time: {last.correct} / {last.total}
          </span>
        ) : null}
      </div>
    </SectionFrame>
  )
}

export function useReport(id: string) {
  const { lesson } = useLesson()
  return (correct: number, total: number) => progress.recordExercise(lesson.id, id, correct, total)
}
