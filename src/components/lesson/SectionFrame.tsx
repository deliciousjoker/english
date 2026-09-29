import type { ReactNode } from 'react'
import type { Section, Support } from '../../content/schema'
import { SupportText } from '../support/SupportText'
import { useLesson } from './LessonContext'

const DEFAULT_TITLES: Record<Section['type'], string> = {
  warmup: 'Warm-up',
  vocabulary: 'Words',
  tiles: 'Listen and repeat',
  reading: 'Read',
  dialogue: 'Listen and read',
  grammar: 'Grammar',
  exercise: 'Practice',
  writing: 'Write',
  wrapup: 'Can you do it?',
}

export function sectionTitle(section: Section): string {
  return section.title ?? DEFAULT_TITLES[section.type]
}

type Props = {
  section: Section
  id: string
  index: number
  instructions?: string
  support?: Support
  tools?: ReactNode
  children: ReactNode
}

/** Her bölümün ortak çerçevesi: numara, başlık, talimat (+ ana dil desteği). */
export function SectionFrame({ section, id, index, instructions, support, tools, children }: Props) {
  const { policy } = useLesson()
  const kind = section.type === 'exercise' ? `exercise sec--${section.kind}` : section.type
  return (
    <section id={id} className={`sec sec--${kind}`} aria-labelledby={`${id}-title`}>
      <header className="sec__head">
        <span className="sec__num" aria-hidden="true">
          {String(index + 1).padStart(2, '0')}
        </span>
        <div className="sec__titles">
          <h2 id={`${id}-title`} className="sec__title">
            {sectionTitle(section)}
          </h2>
          {instructions && (
            <p className="sec__instructions">
              {instructions}
              {policy.instructions && <SupportText as="span" support={support} className="sec__support" />}
            </p>
          )}
        </div>
        {tools && <div className="sec__tools">{tools}</div>}
      </header>
      <div className="sec__body">{children}</div>
    </section>
  )
}
