import type { Section } from '../../content/schema'
import { progress, useLessonProgress, type CanDoRating } from '../../state/progress'
import { SectionFrame } from './SectionFrame'
import { useLesson } from './LessonContext'

const RATINGS: { value: CanDoRating; label: string }[] = [
  { value: 0, label: 'Not yet' },
  { value: 1, label: 'Almost' },
  { value: 2, label: 'Yes!' },
]

export function WrapupSection({ section, id, index }: { section: Section; id: string; index: number }) {
  const { lesson } = useLesson()
  const ratings = useLessonProgress(lesson.id).canDo

  return (
    <SectionFrame section={section} id={id} index={index} instructions="Read and choose. Be honest!">
      <ul className="cando">
        {lesson.canDo.map((c, i) => (
          <li key={i} className="cando__item">
            <span className="cando__text">{c}</span>
            <span className="cando__choices" role="radiogroup" aria-label={c}>
              {RATINGS.map((r) => (
                <button
                  key={r.value}
                  type="button"
                  role="radio"
                  aria-checked={ratings[i] === r.value}
                  className={`chip chip--r${r.value} ${ratings[i] === r.value ? 'is-on' : ''}`}
                  onClick={() => progress.rateCanDo(lesson.id, i, r.value)}
                >
                  {r.label}
                </button>
              ))}
            </span>
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
