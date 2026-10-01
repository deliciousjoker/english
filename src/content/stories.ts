import type { Lesson, Story } from './schema'

/** Hikâye ilerlemesi "story:" önekiyle kaydedilir (derslerle karışmasın). */
export const STORY_PREFIX = 'story:'

/** Hikâye, dersteki bileşenlerle gösterilebilsin ve seslendirilebilsin diye ders biçimine çevrilir. */
export function storyToLesson(s: Story): Lesson {
  return {
    id: STORY_PREFIX + s.id,
    level: s.level,
    unit: 0,
    order: 0,
    title: s.title,
    subtitle: s.summary,
    canDo: [s.summary],
    sections: s.sections,
  }
}
