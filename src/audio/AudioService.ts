import { useSyncExternalStore } from 'react'
import { getCharacter } from '../content/loader'
import type { Character } from '../content/schema'
import { audioKey, hashString } from './hash'
import { ttsVoice } from './engine'

/**
 * Tek bir yerden ses çalma:
 *  1. public/audio/<hash>.mp3 varsa (Azure ile üretilmiş) onu çalar,
 *  2. yoksa tarayıcının kendi sesiyle (speechSynthesis) okur.
 * Aynı anda tek bir şey çalar; hangi öğenin çaldığı `useNowPlaying` ile izlenir.
 */

export type SpeakItem = { key: string; text: string; voice?: string }

class AudioService {
  private manifestPromise: Promise<Set<string>> | null = null
  private el: HTMLAudioElement | null = null
  private generation = 0
  private playingKey: string | null = null
  private listeners = new Set<() => void>()
  rate = 1

  subscribe = (fn: () => void) => {
    this.listeners.add(fn)
    return () => {
      this.listeners.delete(fn)
    }
  }

  getSnapshot = () => this.playingKey

  private setPlaying(key: string | null) {
    this.playingKey = key
    this.listeners.forEach((fn) => fn())
  }

  loadManifest(): Promise<Set<string>> {
    this.manifestPromise ??= fetch(`${import.meta.env.BASE_URL}audio/manifest.json`)
      .then((r) => (r.ok ? r.json() : { files: [] }))
      .then((j: { files?: string[] }) => new Set(j.files ?? []))
      .catch(() => new Set<string>())
    return this.manifestPromise
  }

  stop() {
    this.generation++
    this.halt()
    this.setPlaying(null)
  }

  private halt() {
    if (this.el) this.el.pause()
    if (typeof speechSynthesis !== 'undefined') speechSynthesis.cancel()
  }

  /** Öğeleri sırayla çalar. Başka bir çalma başlarsa ya da stop() çağrılırsa yarıda kesilir. */
  async play(items: SpeakItem[]) {
    const gen = ++this.generation
    this.halt()
    for (const item of items) {
      if (gen !== this.generation) return
      this.setPlaying(item.key)
      await this.speakOne(item, gen)
    }
    if (gen === this.generation) this.setPlaying(null)
  }

  private async speakOne(item: SpeakItem, gen: number) {
    const character = getCharacter(item.voice)
    const key = audioKey(ttsVoice(character), item.text)
    const manifest = await this.loadManifest()
    if (gen !== this.generation) return
    if (manifest.has(key)) {
      try {
        await this.playFile(`${import.meta.env.BASE_URL}audio/${key}.mp3`)
        return
      } catch {
        // dosya açılamadıysa tarayıcı sesine düş
      }
    }
    await speakWithBrowser(item.text, character, this.rate)
  }

  private playFile(src: string): Promise<void> {
    // Tek bir <audio> öğesi tekrar kullanılır: iOS'ta ilk dokunuştan sonra sıradaki cümlelerin de çalabilmesi için.
    this.el ??= new Audio()
    const el = this.el
    return new Promise((resolve, reject) => {
      el.onended = () => resolve()
      el.onpause = () => resolve()
      el.onerror = () => reject(new Error('audio error'))
      el.src = src
      el.playbackRate = this.rate
      el.play().catch(reject)
    })
  }
}

export const audio = new AudioService()

export function useNowPlaying(): string | null {
  return useSyncExternalStore(audio.subscribe, audio.getSnapshot, () => null)
}

// ---- Tarayıcı sesi (yedek) ----

let voices: SpeechSynthesisVoice[] = []
const picked = new Map<string, SpeechSynthesisVoice | null>()

function refreshVoices() {
  voices = speechSynthesis.getVoices()
  picked.clear()
}

if (typeof speechSynthesis !== 'undefined') {
  refreshVoices()
  speechSynthesis.addEventListener?.('voiceschanged', refreshVoices)
}

const FEMALE =
  /female|woman|aria|jenny|emma|ava|michelle|sonia|libby|maisie|samantha|karen|moira|tessa|victoria|allison|susan|zira|hazel|serena|fiona|kate|catherine|google us english$/i
const MALE =
  /male|guy|andrew|brian|christopher|eric|roger|steffan|ryan|thomas|daniel|david|mark|george|alex|fred|arthur|oliver|aaron/i

function genderOf(v: SpeechSynthesisVoice): 'female' | 'male' | 'unknown' {
  if (FEMALE.test(v.name)) return 'female'
  if (MALE.test(v.name)) return 'male'
  return 'unknown'
}

/**
 * Ses kalitesi puanı. Edge'deki "Online (Natural)" sesler Azure'un sinir ağı sesleriyle aynıdır;
 * Chrome'daki "Google …" sesleri de iyidir. Windows'un eski masaüstü sesleri (David, Zira, Mark)
 * robotiktir, en sona kalır.
 */
function quality(v: SpeechSynthesisVoice): number {
  if (/\(natural\)|natural|neural/i.test(v.name)) return 30
  if (/^google/i.test(v.name)) return 20
  if (/premium|enhanced/i.test(v.name)) return 15
  if (/^microsoft (david|zira|mark|hazel|george|susan|james|linda|richard|catherine)\b/i.test(v.name)) return 0
  return 8
}

function pickVoice(c: Character): SpeechSynthesisVoice | null {
  if (picked.has(c.id)) return picked.get(c.id) ?? null
  const english = voices.filter((v) => v.lang.replace('_', '-').toLowerCase().startsWith('en'))
  if (!english.length) return null
  const lang = c.fallback.lang.toLowerCase()
  // Edge'de karakterin Azure sesi (ör. en-US-EmmaNeural → "Emma") birebir varsa onu seç
  const azureName = c.azureVoice.split('-')[2]?.replace(/Neural$/, '') ?? ''
  const scored = english
    .map((v) => {
      const g = genderOf(v)
      const q = quality(v)
      const score =
        q +
        (q >= 30 && azureName && new RegExp(`\\b${azureName}\\b`, 'i').test(v.name) ? 100 : 0) +
        (g === c.fallback.gender ? 8 : g === 'unknown' ? 2 : -20) +
        (v.lang.replace('_', '-').toLowerCase() === lang ? 4 : 0)
      return { v, score }
    })
    .sort((a, b) => b.score - a.score)
  const best = scored[0].score
  const candidates = scored.filter((s) => s.score >= best - 4)
  // Aynı cinsiyetteki karakterler mümkünse farklı sesler alsın
  const choice = candidates[hashString(c.id) % candidates.length].v
  picked.set(c.id, choice)
  return choice
}

function speakWithBrowser(text: string, c: Character, rate: number): Promise<void> {
  if (typeof speechSynthesis === 'undefined') return Promise.resolve()
  return new Promise((resolve) => {
    const u = new SpeechSynthesisUtterance(text)
    const voice = pickVoice(c)
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    } else {
      u.lang = c.fallback.lang
    }
    u.rate = rate * 0.95
    u.onend = () => resolve()
    u.onerror = () => resolve()
    speechSynthesis.speak(u)
  })
}
