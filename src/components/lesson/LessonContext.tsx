import { createContext, useContext } from 'react'
import { supportPolicy, type Glossary, type Lesson, type Section, type VocabItem } from '../../content/schema'
import { lemmaCandidates, wordKey } from '../../lib/text'

export type WordSelection = { word: string; sentence: string; sentenceKey: string; voice?: string }

export type LessonCtx = {
  lesson: Lesson
  glossary: Glossary
  vocab: Map<string, VocabItem>
  policy: ReturnType<typeof supportPolicy>
  selectWord: (sel: WordSelection | null) => void
  selection: WordSelection | null
}

export const LessonContext = createContext<LessonCtx | null>(null)

export function useLesson(): LessonCtx {
  const ctx = useContext(LessonContext)
  if (!ctx) throw new Error('useLesson must be used inside a lesson')
  return ctx
}

export function sectionId(section: Section, index: number): string {
  return section.id ?? `s${index + 1}`
}

export function buildVocabMap(lesson: Lesson): Map<string, VocabItem> {
  const map = new Map<string, VocabItem>()
  for (const s of lesson.sections) {
    if (s.type === 'vocabulary') for (const item of s.items) map.set(wordKey(item.word), item)
  }
  return map
}

export type LookupResult = { headword: string; tr?: string; ar?: string; inLesson: boolean }

/** Tıklanan kelimenin anlamını önce dersin kelime listesinde, sonra sözlükte arar. */
export function lookupWord(word: string, vocab: Map<string, VocabItem>, glossary: Glossary): LookupResult {
  const candidates = lemmaCandidates(word)
  for (const c of candidates) {
    const v = vocab.get(c)
    if (v) return { headword: v.word, ...v.gloss, inLesson: true }
  }
  for (const c of candidates) {
    const g = glossary[c]
    if (g) return { headword: c, ...g, inLesson: false }
  }
  return { headword: word, inLesson: false }
}
