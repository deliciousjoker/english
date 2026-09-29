import type { ReadingSection as ReadingData } from '../../content/schema'
import { useNowPlaying } from '../../audio/AudioService'
import { PlayButton } from '../ui/PlayButton'
import { SectionFrame } from '../lesson/SectionFrame'
import { TokenizedText } from './TokenizedText'

export function ReadingSection({ section, id, index }: { section: ReadingData; id: string; index: number }) {
  const now = useNowPlaying()
  const sentences = section.paragraphs.map((p, pi) =>
    p.map((text, si) => ({ key: `${id}:p${pi}:s${si}`, text, voice: section.voice })),
  )
  const all = sentences.flat()

  return (
    <SectionFrame
      section={section}
      id={id}
      index={index}
      tools={<PlayButton variant="pill" text="Listen" items={all} label="Listen to the whole text" />}
    >
      <article className="reading">
        {section.heading && <h3 className="reading__heading">{section.heading}</h3>}
        {section.intro && <p className="reading__intro">{section.intro}</p>}
        {sentences.map((para, pi) => (
          <div className="reading__para" key={pi}>
            <PlayButton items={para} label={`Listen to paragraph ${pi + 1}`} className="reading__paraplay" />
            <p>
              {para.map((s, si) => (
                <span key={s.key} className={`sent ${now === s.key ? 'is-playing' : ''}`}>
                  <TokenizedText text={s.text} sentenceKey={s.key} voice={s.voice} />
                  {si < para.length - 1 ? ' ' : ''}
                </span>
              ))}
            </p>
          </div>
        ))}
      </article>
    </SectionFrame>
  )
}
