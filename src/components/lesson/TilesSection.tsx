import type { TilesSection as TilesData } from '../../content/schema'
import { audio, useNowPlaying } from '../../audio/AudioService'
import { SupportText } from '../support/SupportText'
import { PlayButton } from '../ui/PlayButton'
import { SectionFrame } from './SectionFrame'
import { useLesson } from './LessonContext'

/** Alfabe ve sayılar için büyük kutucuklar: dokununca okunur. */
export function TilesSection({ section, id, index }: { section: TilesData; id: string; index: number }) {
  const now = useNowPlaying()
  const { policy } = useLesson()
  const items = section.items.map((t, i) => ({ key: `${id}:t${i}`, text: t.say }))

  return (
    <SectionFrame
      section={section}
      id={id}
      index={index}
      instructions={section.instructions}
      support={section.support}
      tools={<PlayButton variant="pill" text="Listen to all" items={items} label="Listen to all" />}
    >
      <ul className="tiles">
        {section.items.map((t, i) => (
          <li key={items[i].key}>
            <button
              type="button"
              className={`tile ${now === items[i].key ? 'is-playing' : ''}`}
              onClick={() => audio.play([items[i]])}
              aria-label={`Listen: ${t.say}`}
            >
              <span className="tile__big">{t.big}</span>
              {t.small && <span className="tile__small">{t.small}</span>}
              {policy.glosses && <SupportText as="span" support={t.hint} className="tile__hint" />}
            </button>
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
