import { useState, type CSSProperties } from 'react'
import type { DialogueSection as DialogueData } from '../../content/schema'
import { getCharacter } from '../../content/loader'
import { useNowPlaying } from '../../audio/AudioService'
import { PlayButton } from '../ui/PlayButton'
import { Icon } from '../ui/Icon'
import { SectionFrame } from '../lesson/SectionFrame'
import { TokenizedText } from './TokenizedText'
import { RecordButton } from '../ui/RecordButton'

export function DialogueSection({ section, id, index }: { section: DialogueData; id: string; index: number }) {
  const now = useNowPlaying()
  // "Önce dinle": metin gizlenir, sadece konuşmacılar ve ses kalır
  const [hidden, setHidden] = useState(false)
  // "Say it": her repliğin yanında kendi sesini kaydetme düğmesi
  const [speak, setSpeak] = useState(false)
  const lines = section.lines.map((l, i) => ({ key: `${id}:l${i}`, text: l.text, voice: l.speaker }))

  return (
    <SectionFrame
      section={section}
      id={id}
      index={index}
      tools={
        <>
          <button type="button" className={`toggle ${hidden ? 'is-on' : ''}`} onClick={() => setHidden((h) => !h)} aria-pressed={hidden}>
            <Icon name={hidden ? 'eye' : 'eyeOff'} size={16} />
            <span>{hidden ? 'Show text' : 'Hide text'}</span>
          </button>
          <button type="button" className={`toggle ${speak ? 'is-on' : ''}`} onClick={() => setSpeak((s) => !s)} aria-pressed={speak}>
            <Icon name="mic" size={16} />
            <span>Say it</span>
          </button>
          <PlayButton variant="pill" text="Listen" items={lines} label="Listen to the whole dialogue" />
        </>
      }
    >
      <div className={`dialogue ${hidden ? 'is-hidden' : ''} ${speak ? 'is-speaking' : ''}`}>
        {section.heading && <h3 className="dialogue__heading">{section.heading}</h3>}
        {section.scene && <p className="dialogue__scene">{section.scene}</p>}
        <ol className="dialogue__lines">
          {section.lines.map((line, i) => {
            const c = getCharacter(line.speaker)
            const item = lines[i]
            const prev = section.lines[i - 1]
            return (
              <li
                key={item.key}
                className={`line ${now === item.key ? 'is-playing' : ''} ${prev?.speaker === line.speaker ? 'line--cont' : ''}`}
                style={{ '--who': c.color } as CSSProperties}
              >
                <span className="line__who">
                  <span className="line__avatar" aria-hidden="true">
                    {c.name.replace('Mrs. ', '')[0]}
                  </span>
                  <span className="line__name">{c.name}</span>
                </span>
                <span className="line__text">
                  {hidden ? (
                    <span className="line__mask" aria-label="Text hidden">
                      {line.text.replace(/\S/g, '•')}
                    </span>
                  ) : (
                    <TokenizedText text={line.text} sentenceKey={item.key} voice={line.speaker} />
                  )}
                </span>
                <PlayButton items={[item]} label={`Listen: ${c.name}`} className="line__play" />
                {speak && (
                  <span className="line__rec">
                    <RecordButton model={[item]} label={line.text} />
                  </span>
                )}
              </li>
            )
          })}
        </ol>
      </div>
    </SectionFrame>
  )
}
