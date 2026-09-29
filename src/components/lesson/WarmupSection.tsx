import type { WarmupSection as WarmupData } from '../../content/schema'
import { PlayButton } from '../ui/PlayButton'
import { VOICE } from '../../content/speakables'
import { SectionFrame } from './SectionFrame'

export function WarmupSection({ section, id, index }: { section: WarmupData; id: string; index: number }) {
  return (
    <SectionFrame section={section} id={id} index={index}>
      <ul className="warmup">
        {section.prompts.map((p, i) => (
          <li key={i} className="warmup__item">
            <span className="warmup__q">{p}</span>
            <PlayButton items={[{ key: `${id}:q${i}`, text: p, voice: VOICE.warmup }]} label="Listen" />
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
