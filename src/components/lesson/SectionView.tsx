import type { Section } from '../../content/schema'
import { McqExerciseView, TrueFalseExerciseView } from '../exercises/ChoiceExercises'
import { DictationExerciseView } from '../exercises/DictationExercise'
import { GapFillExerciseView } from '../exercises/GapFillExercise'
import { MatchingExerciseView } from '../exercises/MatchingExercise'
import { OrderingExerciseView } from '../exercises/OrderingExercise'
import { WordOrderExerciseView } from '../exercises/WordOrderExercise'
import { GrammarSection } from '../grammar/GrammarSection'
import { DialogueSection } from '../reader/DialogueSection'
import { ReadingSection } from '../reader/ReadingSection'
import { TilesSection } from './TilesSection'
import { VocabularySection } from './VocabularySection'
import { WarmupSection } from './WarmupSection'
import { WritingSection } from './WritingSection'
import { WrapupSection } from './WrapupSection'

/** Bölüm türüne göre doğru bileşeni seçer. Yeni bir bölüm türü eklenince buraya da eklenir. */
export function SectionView({ section, id, index }: { section: Section; id: string; index: number }) {
  const p = { id, index }
  switch (section.type) {
    case 'warmup':
      return <WarmupSection section={section} {...p} />
    case 'vocabulary':
      return <VocabularySection section={section} {...p} />
    case 'tiles':
      return <TilesSection section={section} {...p} />
    case 'reading':
      return <ReadingSection section={section} {...p} />
    case 'dialogue':
      return <DialogueSection section={section} {...p} />
    case 'grammar':
      return <GrammarSection section={section} {...p} />
    case 'writing':
      return <WritingSection section={section} {...p} />
    case 'wrapup':
      return <WrapupSection section={section} {...p} />
    case 'exercise':
      switch (section.kind) {
        case 'mcq':
          return <McqExerciseView section={section} {...p} />
        case 'truefalse':
          return <TrueFalseExerciseView section={section} {...p} />
        case 'gapfill':
          return <GapFillExerciseView section={section} {...p} />
        case 'wordorder':
          return <WordOrderExerciseView section={section} {...p} />
        case 'matching':
          return <MatchingExerciseView section={section} {...p} />
        case 'ordering':
          return <OrderingExerciseView section={section} {...p} />
        case 'dictation':
          return <DictationExerciseView section={section} {...p} />
      }
  }
}
