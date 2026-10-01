import type {
  DictationExercise,
  ExerciseSection,
  GapFillExercise,
  Lesson,
  Level,
  McqExercise,
  Section,
  Support,
  WordOrderExercise,
} from '../../content/schema'
import { seededShuffle } from '../../lib/text'
import { TEST_PREFIX } from '../../state/progress'

/**
 * Ünite testi: ünitenin derslerindeki alıştırmalardan ve kelimelerden (tohuma göre) rastgele seçilir.
 * Sonuç bir "ders" gibi döner; böylece dersteki alıştırma bileşenleri aynen kullanılır.
 */

export const unitTestId = (level: Level, unit: number) => `${TEST_PREFIX}${level}-u${unit}`

const help = (tr: string, ar: string): Support => ({ tr, ar })

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** "I usually wear jeans." + "wear" → "I usually ___ jeans." (kelime cümlede aynen geçmiyorsa null) */
function blankOut(example: string, word: string): string | null {
  const re = new RegExp(`\\b${escape(word)}\\b`, 'i')
  return re.test(example) ? example.replace(re, '___') : null
}

export function buildUnitTest(lessons: Lesson[], level: Level, unit: number, unitTitle: string, seed: string): Lesson {
  const pick = <T,>(list: T[], n: number, salt: string) => seededShuffle(list, `${seed}:${salt}`).slice(0, n)
  const exercises = lessons.flatMap((l) => l.sections.filter((s): s is ExerciseSection => s.type === 'exercise'))
  const sections: Section[] = []

  // 1. Kelimeler: örnek cümlede boşluk, dört seçenek (aynı üniteden)
  const vocab = lessons.flatMap((l) => l.sections.flatMap((s) => (s.type === 'vocabulary' ? s.items : [])))
  const wordItems = vocab.flatMap((v) => {
    const prompt = v.example ? blankOut(v.example, v.word) : null
    if (!prompt) return []
    const others = vocab.filter((o) => o.word !== v.word && !o.word.includes(' ') === !v.word.includes(' '))
    const samePos = others.filter((o) => o.pos === v.pos)
    const distractors = pick(samePos.length >= 3 ? samePos : others, 3, `d:${v.word}`).map((o) => o.word)
    if (distractors.length < 3) return []
    const options = seededShuffle([v.word, ...distractors], `${seed}:o:${v.word}`)
    return [{ prompt, options, answer: options.indexOf(v.word) }]
  })
  if (wordItems.length)
    sections.push({
      type: 'exercise',
      kind: 'mcq',
      id: 'words',
      title: 'Words',
      instructions: 'Choose the missing word.',
      support: help('Eksik kelimeyi seç.', 'اختر الكلمة الناقصة.'),
      items: pick(wordItems, 8, 'words'),
    } satisfies McqExercise)

  // 2. Gramer: boşluk doldurma maddeleri (seçilen cevaplardan bir kelime bankası)
  const gaps = exercises.flatMap((e) => (e.kind === 'gapfill' ? e.items : []))
  if (gaps.length) {
    const items = pick(gaps, 6, 'gaps')
    const bank = [...new Set(items.flatMap((it) => [...it.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].split('|')[0].trim())))].sort((a, b) =>
      a.localeCompare(b, 'en'),
    )
    sections.push({
      type: 'exercise',
      kind: 'gapfill',
      id: 'grammar',
      title: 'Grammar',
      instructions: 'Complete the sentences.',
      support: help('Cümleleri tamamla.', 'أكمل الجمل.'),
      bank,
      items,
    } satisfies GapFillExercise)
  }

  // 3. Cümle kurma
  const orders = exercises.flatMap((e) => (e.kind === 'wordorder' ? e.items : []))
  if (orders.length)
    sections.push({
      type: 'exercise',
      kind: 'wordorder',
      id: 'sentences',
      title: 'Sentences',
      instructions: 'Put the words in order.',
      support: help('Kelimeleri doğru sıraya koy.', 'رتّب الكلمات.'),
      items: pick(orders, 3, 'order'),
    } satisfies WordOrderExercise)

  // 4. Dinleme: sesli çoktan seçmeli maddeler
  const listening = exercises.flatMap((e) => (e.kind === 'mcq' ? e.items.filter((it) => it.audio) : []))
  if (listening.length)
    sections.push({
      type: 'exercise',
      kind: 'mcq',
      id: 'listening',
      title: 'Listening',
      instructions: 'Listen and choose.',
      support: help('Dinle ve seç.', 'استمع واختر.'),
      items: pick(listening, 4, 'listen'),
    } satisfies McqExercise)

  // 5. Okuma: ünitedeki bir okuma metni ve hemen ardından gelen anlama sorusu
  const readings = lessons.flatMap((l) =>
    l.sections.flatMap((s, i) => {
      const next = l.sections[i + 1]
      const ok = s.type === 'reading' && next?.type === 'exercise' && (next.kind === 'truefalse' || (next.kind === 'mcq' && !next.items.some((it) => it.audio)))
      return ok ? [{ reading: s, check: next }] : []
    }),
  )
  const reading = pick(readings, 1, 'reading')[0]
  if (reading) {
    sections.push({ ...reading.reading, id: 'reading', title: 'Read' })
    sections.push({ ...reading.check, id: 'reading-check', title: 'Reading' } as ExerciseSection)
  }

  // 6. Dikte
  const dictation = exercises.flatMap((e) => (e.kind === 'dictation' ? e.items : []))
  if (dictation.length)
    sections.push({
      type: 'exercise',
      kind: 'dictation',
      id: 'dictation',
      title: 'Listen and write',
      instructions: 'Listen and write the sentence.',
      support: help('Dinle ve cümleyi yaz.', 'استمع واكتب الجملة.'),
      items: pick(dictation, 3, 'dict'),
    } satisfies DictationExercise)

  return {
    id: unitTestId(level, unit),
    level,
    unit,
    order: 0,
    title: `Unit ${unit} test`,
    subtitle: unitTitle,
    canDo: ['I can use the words and grammar of this unit.'],
    sections,
  }
}
