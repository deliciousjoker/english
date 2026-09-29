import { Fragment } from 'react'
import type { VocabularySection as VocabData } from '../../content/schema'
import { PlayButton } from '../ui/PlayButton'
import { SupportText } from '../support/SupportText'
import { SectionFrame } from './SectionFrame'
import { useLesson } from './LessonContext'

/** Örnek cümlede kelimenin geçtiği yeri kalın gösterir. */
function Highlight({ text, word }: { text: string; word: string }) {
  const re = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'i')
  const parts = text.split(re)
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <mark key={i}>{p}</mark> : <Fragment key={i}>{p}</Fragment>))}
    </>
  )
}

export function VocabularySection({ section, id, index }: { section: VocabData; id: string; index: number }) {
  const { policy } = useLesson()
  const words = section.items.map((v, i) => ({ key: `${id}:w${i}`, text: v.say ?? v.word }))

  return (
    <SectionFrame
      section={section}
      id={id}
      index={index}
      instructions={section.instructions}
      support={section.support}
      tools={<PlayButton variant="pill" text="Listen to all" items={words} label="Listen to all the words" />}
    >
      <ul className="vocab">
        {section.items.map((v, i) => (
          <li key={v.word} className="vocab__item">
            <div className="vocab__top">
              <span className="vocab__word">{v.word}</span>
              <PlayButton items={[words[i]]} label={`Listen: ${v.word}`} />
            </div>
            {v.pos && <span className="vocab__pos">{v.pos}</span>}
            {policy.glosses && <SupportText support={v.gloss} className="vocab__gloss" />}
            {v.example && (
              <p className="vocab__example">
                <span>
                  <Highlight text={v.example} word={v.word} />
                </span>
                <PlayButton items={[{ key: `${id}:e${i}`, text: v.example }]} label="Listen to the example" className="vocab__explay" />
              </p>
            )}
          </li>
        ))}
      </ul>
    </SectionFrame>
  )
}
