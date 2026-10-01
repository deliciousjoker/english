import { tokenize } from '../lib/text'
import type { Character, Lesson, Placement, Sounds } from './schema'
import { ttsVoice } from '../audio/engine'

/**
 * Bir derste seslendirilen her şey. Arayüzdeki çalma düğmeleri ile ses üretme betiği
 * AYNI metin + ses çiftini kullanmalı; yoksa üretilen mp3 bulunamaz. Bu yüzden kurallar tek yerde.
 */

export type Speakable = { text: string; voice: string; priority: 'main' | 'word' }

/** Uyarı sesi olarak çalınan varsayılan ses kimlikleri */
export const VOICE = { narrator: 'narrator', warmup: 'maya' } as const

/** Metinde tıklanan kelime nasıl okunur: bilinen kelimeler küçük harfle, özel isimler olduğu gibi. */
export function spokenWord(word: string, isKnown: (lower: string) => boolean): string {
  if (/^I($|['’])/.test(word)) return word
  const lower = word.toLowerCase()
  return word !== lower && !isKnown(lower) ? word : lower
}

export function collectSpeakables(
  lesson: Lesson,
  characters: Map<string, Character>,
  isKnown: (lower: string) => boolean,
): Speakable[] {
  const narrator = characters.get(VOICE.narrator)!
  const v = (id?: string) => (id && characters.get(id)) || narrator
  const out: Speakable[] = []
  const main = (text: string, id?: string) => out.push({ text, voice: ttsVoice(v(id)), priority: 'main' })
  const words = (text: string) => {
    // Rakamlar metinde tıklanamaz (TokenizedText), onlar için ayrı ses gerekmez
    for (const t of tokenize(text))
      if (t.kind === 'word' && !/^\d+$/.test(t.text))
        out.push({ text: spokenWord(t.text, isKnown), voice: ttsVoice(narrator), priority: 'word' })
  }

  for (const s of lesson.sections) {
    switch (s.type) {
      case 'warmup':
        s.prompts.forEach((p) => main(p, VOICE.warmup))
        break
      case 'vocabulary':
        for (const item of s.items) {
          main(item.say ?? item.word)
          if (item.example) main(item.example)
        }
        break
      case 'tiles':
        s.items.forEach((t) => main(t.say))
        break
      case 'reading':
        for (const p of s.paragraphs)
          for (const sentence of p) {
            main(sentence, s.voice)
            words(sentence)
          }
        break
      case 'dialogue':
        for (const line of s.lines) {
          main(line.text, line.speaker)
          words(line.text)
        }
        break
      case 'grammar':
        s.examples?.forEach((e) => main(e))
        break
      case 'exercise':
        if (s.kind === 'mcq') s.items.forEach((it) => it.audio && main(it.audio, it.voice))
        if (s.kind === 'dictation') s.items.forEach((it) => main(it.say ?? it.text, it.voice))
        break
    }
  }
  return out
}

/** Sounds sayfasındaki ses çiftleri (anlatıcı sesi, kelime kelime). */
export function collectSoundSpeakables(sounds: Sounds, characters: Map<string, Character>): Speakable[] {
  const narrator = characters.get(VOICE.narrator)!
  return sounds.sets
    .flatMap((s) => s.pairs.flat())
    .map((text) => ({ text, voice: ttsVoice(narrator), priority: 'main' as const }))
}

/** Seviye sınavındaki dinleme soruları. */
export function collectPlacementSpeakables(placement: Placement, characters: Map<string, Character>): Speakable[] {
  const narrator = characters.get(VOICE.narrator)!
  return placement.sections.flatMap((s) =>
    s.items.flatMap((it) =>
      it.audio ? [{ text: it.audio, voice: ttsVoice(characters.get(it.voice ?? '') ?? narrator), priority: 'main' as const }] : [],
    ),
  )
}
