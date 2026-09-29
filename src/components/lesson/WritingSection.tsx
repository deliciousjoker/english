import { useEffect, useState } from 'react'
import type { WritingSection as WritingData } from '../../content/schema'
import { countWords } from '../../lib/text'
import { progress, useLessonProgress } from '../../state/progress'
import { Icon } from '../ui/Icon'
import { SectionFrame } from './SectionFrame'
import { useLesson } from './LessonContext'

function Frame({ line }: { line: string }) {
  const parts = line.split('___')
  return (
    <>
      {parts.map((p, i) => (
        <span key={i}>
          {p}
          {i < parts.length - 1 && <span className="blank" aria-label="blank" />}
        </span>
      ))}
    </>
  )
}

export function WritingSection({ section, id, index }: { section: WritingData; id: string; index: number }) {
  const { lesson } = useLesson()
  const saved = useLessonProgress(lesson.id).writing[id] ?? ''
  const [text, setText] = useState(saved)
  const [copied, setCopied] = useState(false)
  const [checked, setChecked] = useState<boolean[]>([])
  const words = countWords(text)

  // Yazı her değişiklikten kısa süre sonra bu tarayıcıya kaydedilir
  useEffect(() => {
    if (text === saved) return
    const t = setTimeout(() => progress.saveWriting(lesson.id, id, text), 500)
    return () => clearTimeout(t)
  }, [text, saved, lesson.id, id])

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setCopied(false)
    }
  }

  return (
    <SectionFrame section={section} id={id} index={index} instructions={section.prompt} support={section.support}>
      <div className="writing">
        {section.model && (
          <figure className="writing__model">
            <figcaption>Example{section.model.heading ? ` · ${section.model.heading}` : ''}</figcaption>
            <p>{section.model.text.join(' ')}</p>
          </figure>
        )}
        {section.frame && (
          <div className="writing__frame">
            <span className="writing__label">Use these sentences</span>
            <ul>
              {section.frame.map((f, i) => (
                <li key={i}>
                  <Frame line={f} />
                </li>
              ))}
            </ul>
          </div>
        )}
        <label className="writing__paper">
          <span className="sr-only">Your text</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={6}
            spellCheck={false}
            placeholder="Write here…"
          />
        </label>
        <div className="writing__bar">
          <span className={`writing__count ${section.minWords && words >= section.minWords ? 'is-done' : ''}`}>
            {words} {words === 1 ? 'word' : 'words'}
            {section.minWords ? ` / ${section.minWords}` : ''}
          </span>
          <button type="button" className="btn btn--ghost" onClick={copy} disabled={!text.trim()}>
            <Icon name="copy" size={16} />
            {copied ? 'Copied!' : 'Copy my text'}
          </button>
        </div>
        {section.checklist && (
          <ul className="writing__checklist">
            {section.checklist.map((c, i) => (
              <li key={i}>
                <label>
                  <input
                    type="checkbox"
                    checked={!!checked[i]}
                    onChange={(e) => setChecked((prev) => Object.assign([...prev], { [i]: e.target.checked }))}
                  />
                  <span>{c}</span>
                </label>
              </li>
            ))}
          </ul>
        )}
      </div>
    </SectionFrame>
  )
}
