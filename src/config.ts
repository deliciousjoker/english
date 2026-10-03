import type { Level } from './content/schema'

/** Site adı tek yerden değişir. */
export const SITE_NAME = 'Folio'
/** Telif satırı: sitenin altında ve çalışma kâğıtlarında */
export const COPYRIGHT = `© 2026 ${SITE_NAME}. All rights reserved.`

export const LEVEL_LABEL: Record<Level, string> = {
  starter: 'Starter',
  a1: 'A1',
  a2: 'A2',
  b1: 'B1',
  b2: 'B2',
  c1: 'C1',
}

export const LEVEL_NAME: Record<Level, string> = {
  starter: 'Starter',
  a1: 'Beginner',
  a2: 'Elementary',
  b1: 'Intermediate',
  b2: 'Upper-intermediate',
  c1: 'Advanced',
}

/** Raftaki kitap sırtlarına sığan kısa adlar. */
export const SPINE_NAME: Record<Level, string> = { ...LEVEL_NAME, b2: 'Upper-Int.' }
