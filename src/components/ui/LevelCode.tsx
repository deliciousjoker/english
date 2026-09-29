import type { Level } from '../../content/schema'
import { LEVEL_LABEL } from '../../config'

/**
 * Seviye kodu (A1, B2 …). Bazı yazı tiplerinde "1" ile "I" karışıyor ("A1" → "AI"),
 * bu yüzden kodlar her zaman rakamı net olan yazı tipiyle gösterilir.
 */
export function LevelCode({ level, className = '' }: { level: Level; className?: string }) {
  return <span className={`lvcode ${className}`}>{LEVEL_LABEL[level]}</span>
}
