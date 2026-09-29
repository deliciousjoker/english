import { Fragment, useMemo } from 'react'
import { tokenize, wordKey } from '../../lib/text'
import { useLesson } from '../lesson/LessonContext'

/**
 * Cümleyi tıklanabilir kelimelere çevirir. Dersin kelime listesindeki kelimeler
 * (çok kelimeli olanlar dahil, ör. "thank you") fosforlu kalemle işaretlenir.
 */
export function TokenizedText({ text, sentenceKey, voice }: { text: string; sentenceKey: string; voice?: string }) {
  const { vocab, selectWord, selection } = useLesson()
  const tokens = useMemo(() => tokenize(text), [text])

  // Her kelime token'ı için: hangi sözcük/ifadeye ait (vurgulama ve arama için)
  const phraseOf = useMemo(() => {
    const result = new Map<number, string>()
    const wordIdx = tokens.flatMap((t, i) => (t.kind === 'word' ? [i] : []))
    const phrases = [...vocab.keys()].filter((k) => k.includes(' ')).map((k) => k.split(' '))
    for (let w = 0; w < wordIdx.length; w++) {
      for (const parts of phrases) {
        const match = parts.every((p, j) => {
          const t = tokens[wordIdx[w + j]]
          return t && wordKey(t.text) === p
        })
        if (match) parts.forEach((_, j) => result.set(wordIdx[w + j], parts.join(' ')))
      }
    }
    return result
  }, [tokens, vocab])

  return (
    <>
      {tokens.map((t, i) => {
        // Rakamlar (7:00, $24.49) tıklanabilir kelime değil
        if (t.kind !== 'word' || /^\d+$/.test(t.text)) return <Fragment key={i}>{t.text}</Fragment>
        const phrase = phraseOf.get(i)
        const lookup = phrase ?? t.text
        const isVocab = phrase != null || vocab.has(wordKey(t.text))
        const selected = selection?.sentenceKey === sentenceKey && selection.word === lookup
        return (
          <button
            key={i}
            type="button"
            className={`w ${isVocab ? 'w--vocab' : ''} ${selected ? 'is-selected' : ''}`}
            onClick={(e) => {
              e.stopPropagation()
              selectWord(selected ? null : { word: lookup, sentence: text, sentenceKey, voice })
            }}
          >
            {t.text}
          </button>
        )
      })}
    </>
  )
}
