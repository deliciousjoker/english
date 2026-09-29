import curriculumJson from '../../content/curriculum.json'
import charactersJson from '../../content/characters.json'
import { Characters, Curriculum, Glossary, LEVELS, Lesson, type Character, type Level } from './schema'

export const curriculum = Curriculum.parse(curriculumJson)
export const characters = Characters.parse(charactersJson)

const characterMap = new Map(characters.map((c) => [c.id, c]))
const narrator = characterMap.get('narrator') as Character

export function getCharacter(id: string | undefined): Character {
  return (id && characterMap.get(id)) || narrator
}

// Dosya adı = ders kimliği (ör. content/lessons/a1/a1-u1-l1.json → "a1-u1-l1")
const lessonModules = import.meta.glob<{ default: unknown }>('/content/lessons/**/*.json')
const lessonLoaders = new Map(
  Object.entries(lessonModules).map(([path, load]) => [path.split('/').pop()!.replace(/\.json$/, ''), load]),
)

export function lessonExists(id: string): boolean {
  return lessonLoaders.has(id)
}

export class ContentError extends Error {}

export async function loadLesson(id: string): Promise<Lesson> {
  const load = lessonLoaders.get(id)
  if (!load) throw new ContentError(`Lesson "${id}" not found.`)
  const mod = await load()
  const result = Lesson.safeParse(mod.default)
  if (!result.success) {
    const issues = result.error.issues.map((i) => `• ${i.path.join('.')}: ${i.message}`).join('\n')
    throw new ContentError(`Lesson "${id}" has content errors:\n${issues}`)
  }
  return result.data
}

const glossaryModules = import.meta.glob<{ default: unknown }>('/content/glossary/*.json')

/** Dersin seviyesine kadar olan tüm sözlükleri birleştirir (A1 dersinde starter + a1). */
export async function loadGlossary(level: Level): Promise<Glossary> {
  // Starter dersleri de A1 sözlüğünü kullanır
  const upto = LEVELS.slice(0, Math.max(LEVELS.indexOf(level), LEVELS.indexOf('a1')) + 1)
  const merged: Glossary = {}
  // Önce derslerin kelime listelerinden üretilen sözlük, sonra elle yazılanlar (bunlar önceliklidir)
  for (const lv of ['vocab.generated', ...upto]) {
    const load = glossaryModules[`/content/glossary/${lv}.json`]
    if (!load) continue
    const parsed = Glossary.safeParse((await load()).default)
    if (parsed.success) Object.assign(merged, parsed.data)
  }
  return merged
}

export type LessonRef = {
  id: string
  title: string
  level: Level
  levelTitle: string
  unitNumber: number
  unitTitle: string
  available: boolean
}

/** Müfredattaki tüm dersler, sırayla. */
export const allLessons: LessonRef[] = curriculum.levels.flatMap((lv) =>
  lv.units.flatMap((u) =>
    u.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      level: lv.id,
      levelTitle: lv.title,
      unitNumber: u.number,
      unitTitle: u.title,
      available: lessonExists(l.id),
    })),
  ),
)

export function lessonRef(id: string): LessonRef | undefined {
  return allLessons.find((l) => l.id === id)
}

export function neighbours(id: string): { prev?: LessonRef; next?: LessonRef } {
  const i = allLessons.findIndex((l) => l.id === id)
  if (i < 0) return {}
  return { prev: allLessons[i - 1], next: allLessons[i + 1] }
}

export function getLevel(id: string) {
  return curriculum.levels.find((l) => l.id === id)
}
