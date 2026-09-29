import { useEffect } from 'react'
import { useSettings } from '../../state/settings'
import { PlayButton } from '../ui/PlayButton'
import { Icon } from '../ui/Icon'
import { BidiText } from '../support/BidiText'
import { spokenWord } from '../../content/speakables'
import { lookupWord, useLesson } from '../lesson/LessonContext'

/** Metinde bir kelimeye dokununca alttan açılan kart: ses, anlam, cümleyi dinle. */
export function WordCard() {
  const { selection, selectWord, vocab, glossary, policy } = useLesson()
  const { supportLang } = useSettings()

  useEffect(() => {
    if (!selection) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && selectWord(null)
    const onClick = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('.wordcard')) selectWord(null)
    }
    window.addEventListener('keydown', onKey)
    window.addEventListener('click', onClick)
    return () => {
      window.removeEventListener('keydown', onKey)
      window.removeEventListener('click', onClick)
    }
  }, [selection, selectWord])

  if (!selection) return null
  const result = lookupWord(selection.word, vocab, glossary)
  const meaning = supportLang !== 'none' && policy.glosses ? result[supportLang] : undefined
  const spoken = spokenWord(selection.word, (w) => {
    const r = lookupWord(w, vocab, glossary)
    return r.inLesson || !!(r.tr || r.ar)
  })

  return (
    <div className="wordcard" role="dialog" aria-label={`Word: ${selection.word}`}>
      <div className="wordcard__top">
        <PlayButton items={[{ key: 'word:' + selection.word, text: spoken }]} label={`Listen: ${selection.word}`} />
        <span className="wordcard__word">{selection.word}</span>
        {result.inLesson && <span className="wordcard__tag">new word</span>}
        <button type="button" className="iconbtn wordcard__close" onClick={() => selectWord(null)} aria-label="Close">
          <Icon name="close" size={18} />
        </button>
      </div>
      {meaning ? (
        <p className={`wordcard__meaning support--${supportLang}`} lang={supportLang} dir={supportLang === 'ar' ? 'rtl' : 'ltr'}>
          <BidiText text={meaning} lang={supportLang} />
        </p>
      ) : supportLang === 'none' ? (
        <p className="wordcard__hint">Choose TR or AR at the top to see the meaning.</p>
      ) : /^\p{Lu}/u.test(selection.word) && selection.word !== 'I' ? (
        <p className="wordcard__hint">A name.</p>
      ) : null}
      <PlayButton
        variant="pill"
        text="Listen to the sentence"
        items={[{ key: selection.sentenceKey, text: selection.sentence, voice: selection.voice }]}
        label="Listen to the sentence"
      />
    </div>
  )
}
