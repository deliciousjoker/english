import type { ReactNode } from 'react'
import type { Section, Support } from '../../content/schema'
import { SupportText } from '../support/SupportText'
import { Icon, type IconName } from '../ui/Icon'
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

/** Bölümün hangi beceriyi çalıştırdığı (ders kitaplarındaki küçük beceri etiketi gibi) */
const SKILL: Record<Section['type'], [string, IconName]> = {
  warmup: ['Speaking', 'chat'],
  vocabulary: ['Vocabulary', 'cards'],
  tiles: ['Listening', 'headphones'],
  reading: ['Reading', 'book'],
  dialogue: ['Listening', 'headphones'],
  grammar: ['Grammar', 'table'],
  exercise: ['Practice', 'tick'],
  writing: ['Writing', 'pencil'],
  wrapup: ['Review', 'flag'],
}

function skillOf(section: Section): [string, IconName] {
  if (section.type === 'exercise' && section.kind === 'dictation') return ['Listening', 'headphones']
  return SKILL[section.type]
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
  const [skill, icon] = skillOf(section)
  return (
    <section id={id} className={`sec sec--${kind}`} aria-labelledby={`${id}-title`}>
      <header className="sec__head">
        <span className="sec__num" aria-hidden="true">
          {index + 1}
        </span>
        <div className="sec__titles">
          <span className="sec__skill">
            <Icon name={icon} size={16} /> {skill}
          </span>
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
