import { z } from 'zod'

/**
 * Ders içeriğinin formatı. AI'a ders ürettirirken bu şema verilir;
 * `npm run validate` her ders dosyasını bununla kontrol eder.
 */

export const LEVELS = ['starter', 'a1', 'a2', 'b1', 'b2', 'c1'] as const
export const Level = z.enum(LEVELS)
export type Level = z.infer<typeof Level>

/** Ana dil desteği: öğrenci sadece kendi seçtiği dili görür. */
export const Support = z.object({
  tr: z.string().optional(),
  ar: z.string().optional(),
})
export type Support = z.infer<typeof Support>

const sectionBase = {
  /** İlerleme kaydı için sabit kimlik. Verilmezse sıra numarası kullanılır. */
  id: z.string().optional(),
  title: z.string().optional(),
}

export const VocabItem = z.object({
  word: z.string(),
  /** Seslendirilecek metin farklıysa (ör. kısaltmalar). Verilmezse word okunur. */
  say: z.string().optional(),
  /** noun, verb, adjective, phrase … */
  pos: z.string().optional(),
  example: z.string().optional(),
  gloss: Support,
})
export type VocabItem = z.infer<typeof VocabItem>

export const WarmupSection = z.object({
  ...sectionBase,
  type: z.literal('warmup'),
  prompts: z.array(z.string()).min(1),
})

export const VocabularySection = z.object({
  ...sectionBase,
  type: z.literal('vocabulary'),
  instructions: z.string().optional(),
  support: Support.optional(),
  items: z.array(VocabItem).min(1),
})

/** Büyük kutucuklar: alfabe, sayılar gibi. Dokununca `say` okunur. */
export const TilesSection = z.object({
  ...sectionBase,
  type: z.literal('tiles'),
  instructions: z.string().optional(),
  support: Support.optional(),
  items: z
    .array(
      z.object({
        big: z.string(),
        small: z.string().optional(),
        say: z.string(),
        /** Ana dilde okunuş / karşılık ipucu */
        hint: Support.optional(),
      }),
    )
    .min(1),
})

export const ReadingSection = z.object({
  ...sectionBase,
  type: z.literal('reading'),
  /** Metnin kendi başlığı (ör. "Elif's notebook"). */
  heading: z.string().optional(),
  intro: z.string().optional(),
  /** Paragraflar → cümleler. Her cümle ayrı dinlenebilir. */
  paragraphs: z.array(z.array(z.string()).min(1)).min(1),
  voice: z.string().optional(),
})

export const DialogueSection = z.object({
  ...sectionBase,
  type: z.literal('dialogue'),
  heading: z.string().optional(),
  scene: z.string().optional(),
  lines: z.array(z.object({ speaker: z.string(), text: z.string() })).min(1),
})

export const WatchOut = z.object({
  note: z.string(),
  wrong: z.array(z.string()).default([]),
  right: z.array(z.string()).default([]),
})
export type WatchOut = z.infer<typeof WatchOut>

export const GrammarSection = z.object({
  ...sectionBase,
  type: z.literal('grammar'),
  /** Metinden alınmış örnekler; **kalın** kısım kalıbı gösterir. */
  look: z.array(z.string()).optional(),
  table: z
    .object({
      head: z.array(z.string()).optional(),
      rows: z.array(z.array(z.string())).min(1),
    })
    .optional(),
  rules: z.array(z.string()).default([]),
  examples: z.array(z.string()).optional(),
  support: Support.optional(),
  watchOut: z.object({ tr: WatchOut.optional(), ar: WatchOut.optional() }).optional(),
})

const exerciseBase = {
  ...sectionBase,
  type: z.literal('exercise'),
  instructions: z.string(),
  support: Support.optional(),
}

export const McqItem = z.object({
  /** Varsa önce bu metin seslendirilir (dinleme sorusu); ekranda yazmaz. */
  audio: z.string().optional(),
  voice: z.string().optional(),
  prompt: z.string(),
  options: z.array(z.string()).min(2),
  answer: z.number().int().min(0),
})

export const McqExercise = z.object({
  ...exerciseBase,
  kind: z.literal('mcq'),
  items: z.array(McqItem).min(1),
})

export const TrueFalseExercise = z.object({
  ...exerciseBase,
  kind: z.literal('truefalse'),
  items: z.array(z.object({ statement: z.string(), answer: z.boolean() })).min(1),
})

export const GapFillExercise = z.object({
  ...exerciseBase,
  kind: z.literal('gapfill'),
  /** Varsa öğrenci kelimeyi yazmak yerine bankadan seçer. */
  bank: z.array(z.string()).optional(),
  /** Boşluklar {cevap} veya {cevap|alternatif} ile işaretlenir: "I {am|'m} Elif." */
  items: z.array(z.string()).min(1),
})

export const WordOrderExercise = z.object({
  ...exerciseBase,
  kind: z.literal('wordorder'),
  items: z.array(z.string()).min(1),
})

export const MatchingExercise = z.object({
  ...exerciseBase,
  kind: z.literal('matching'),
  pairs: z.array(z.tuple([z.string(), z.string()])).min(2),
})

export const OrderingExercise = z.object({
  ...exerciseBase,
  kind: z.literal('ordering'),
  /** Doğru sırayla yazılır; ekranda karıştırılır. */
  items: z.array(z.string()).min(2),
})

export const DictationExercise = z.object({
  ...exerciseBase,
  kind: z.literal('dictation'),
  /** text = beklenen cevap; say verilirse o seslendirilir (ör. "S, A, M." → "Sam"). */
  items: z.array(z.object({ text: z.string(), say: z.string().optional(), voice: z.string().optional() })).min(1),
})

export const ExerciseSection = z.discriminatedUnion('kind', [
  McqExercise,
  TrueFalseExercise,
  GapFillExercise,
  WordOrderExercise,
  MatchingExercise,
  OrderingExercise,
  DictationExercise,
])

export const WritingSection = z.object({
  ...sectionBase,
  type: z.literal('writing'),
  model: z.object({ heading: z.string().optional(), text: z.array(z.string()) }).optional(),
  /** Kalıp; boşluklar ___ ile gösterilir. */
  frame: z.array(z.string()).optional(),
  prompt: z.string(),
  support: Support.optional(),
  minWords: z.number().int().optional(),
  checklist: z.array(z.string()).optional(),
})

export const WrapupSection = z.object({
  ...sectionBase,
  type: z.literal('wrapup'),
})

export const Section = z.union([
  WarmupSection,
  VocabularySection,
  TilesSection,
  ReadingSection,
  DialogueSection,
  GrammarSection,
  ExerciseSection,
  WritingSection,
  WrapupSection,
])

export const Lesson = z.object({
  id: z.string(),
  level: Level,
  unit: z.number().int(),
  order: z.number().int(),
  title: z.string(),
  subtitle: z.string().optional(),
  canDo: z.array(z.string()).min(1),
  /** Sadece öğretmen görünümünde çıkar; sunum modunda gizlidir. */
  teacherNotes: z.array(z.string()).optional(),
  sections: z.array(Section).min(1),
})

export type Lesson = z.infer<typeof Lesson>
export type Section = z.infer<typeof Section>
export type SectionType = Section['type']
export type ExerciseSection = z.infer<typeof ExerciseSection>
export type WarmupSection = z.infer<typeof WarmupSection>
export type VocabularySection = z.infer<typeof VocabularySection>
export type TilesSection = z.infer<typeof TilesSection>
export type ReadingSection = z.infer<typeof ReadingSection>
export type DialogueSection = z.infer<typeof DialogueSection>
export type GrammarSection = z.infer<typeof GrammarSection>
export type WritingSection = z.infer<typeof WritingSection>
export type McqExercise = z.infer<typeof McqExercise>
export type TrueFalseExercise = z.infer<typeof TrueFalseExercise>
export type GapFillExercise = z.infer<typeof GapFillExercise>
export type WordOrderExercise = z.infer<typeof WordOrderExercise>
export type MatchingExercise = z.infer<typeof MatchingExercise>
export type OrderingExercise = z.infer<typeof OrderingExercise>
export type DictationExercise = z.infer<typeof DictationExercise>

export const Character = z.object({
  id: z.string(),
  name: z.string(),
  /** Azure neural ses adı, ör. en-US-JennyNeural */
  azureVoice: z.string(),
  /** Kokoro ses adı (ör. af_heart): dosyaları bilgisayarda ücretsiz üretmek için */
  kokoroVoice: z.string(),
  /** Azure sesi yoksa tarayıcı sesi seçimi için */
  fallback: z.object({ lang: z.string(), gender: z.enum(['female', 'male']) }),
  color: z.string(),
})
export const Characters = z.array(Character)
export type Character = z.infer<typeof Character>

export const Curriculum = z.object({
  levels: z.array(
    z.object({
      id: Level,
      title: z.string(),
      description: z.string(),
      units: z.array(
        z.object({
          number: z.number().int(),
          title: z.string(),
          /** Henüz yazılmamış dersler de listelenir; dosyası yoksa "coming soon" görünür. */
          lessons: z.array(z.object({ id: z.string(), title: z.string() })),
        }),
      ),
    }),
  ),
})
export type Curriculum = z.infer<typeof Curriculum>

export const GlossaryEntry = z.object({ tr: z.string().optional(), ar: z.string().optional() })
export const Glossary = z.record(z.string(), GlossaryEntry)
export type Glossary = z.infer<typeof Glossary>

/** Hangi destek türünün hangi seviyede gösterileceği (destek seviye arttıkça azalır). */
export function supportPolicy(level: Level) {
  switch (level) {
    case 'starter':
    case 'a1':
      return { glosses: true, grammar: true, instructions: true }
    case 'a2':
      return { glosses: true, grammar: true, instructions: false }
    case 'b1':
      return { glosses: true, grammar: false, instructions: false }
    default:
      return { glosses: false, grammar: false, instructions: false }
  }
}

/** Ses çiftleri (Sounds sayfası): Türk ve Arap öğrencilerin karıştırdığı sesler. */
export const SoundSet = z.object({
  id: z.string(),
  title: z.string(),
  sounds: z.array(z.string()).length(2),
  /** Kimler için özellikle zor (tr, ar) */
  for: z.array(z.enum(['tr', 'ar'])).min(1),
  tip: Support,
  pairs: z.array(z.tuple([z.string(), z.string()])).min(3),
})
export type SoundSet = z.infer<typeof SoundSet>
export const Sounds = z.object({ sets: z.array(SoundSet).min(1) })
export type Sounds = z.infer<typeof Sounds>

/** Seviye belirleme sınavı: her seviyeden birkaç soru; geçme sınırının altında kalınca durur. */
export const Placement = z.object({
  /** Bir bölümü geçmek için gereken doğru sayısı */
  pass: z.number().int().min(1),
  sections: z.array(z.object({ level: Level, items: z.array(McqItem).min(4) })).min(2),
})
export type Placement = z.infer<typeof Placement>

/**
 * Okuma kütüphanesi hikâyesi: content/stories/<seviye>/<id>.json
 * Küçük bir ders gibidir (kelimeler, metin, sorular); aynı bölüm türlerini kullanır.
 */
export const Story = z.object({
  id: z.string(),
  level: Level,
  title: z.string(),
  summary: z.string(),
  minutes: z.number().int().min(1),
  /** Hikâyedeki karakterler (kapakta gösterilir) */
  characters: z.array(z.string()).default([]),
  sections: z.array(Section).min(1),
})
export type Story = z.infer<typeof Story>
