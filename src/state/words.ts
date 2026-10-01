import { useSyncExternalStore } from 'react'
import type { Level, Support } from '../content/schema'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Kelime defteri: öğrencinin kaydettiği kelimeler ve tekrar zamanları (Leitner kutuları).
 * Doğru bilinen kelime bir üst kutuya çıkar ve daha geç tekrar gelir; yanlışsa 1. kutuya döner.
 * Aşama 1'de sadece bu tarayıcıda (localStorage) tutulur.
 */

export type SavedWord = {
  key: string
  word: string
  /** Seslendirilecek metin farklıysa */
  say?: string
  gloss: Support
  /** Kelimenin geçtiği cümle ve onu okuyan ses (tekrar kartında dinlenir) */
  example?: string
  exampleVoice?: string
  level?: Level
  lessonId?: string
  box: number
  due: number
  added: number
}

export type NewWord = Omit<SavedWord, 'box' | 'due' | 'added'>

type WordbookState = Record<string, SavedWord>

/** Kutuya göre bir sonraki tekrar (gün) */
const INTERVAL_DAYS = [0, 1, 2, 4, 8, 16]
export const MAX_BOX = 5
const DAY = 24 * 60 * 60 * 1000

let state: WordbookState = readJSON<WordbookState>('words', {})
const listeners = new Set<() => void>()

function commit(next: WordbookState) {
  state = next
  writeJSON('words', state)
  listeners.forEach((fn) => fn())
}

export const wordbook = {
  has: (key: string) => key in state,
  save(w: NewWord) {
    if (state[w.key]) return
    const now = Date.now()
    commit({ ...state, [w.key]: { ...w, box: 1, due: now, added: now } })
  },
  saveMany(list: NewWord[]) {
    const now = Date.now()
    const next = { ...state }
    for (const w of list) next[w.key] ??= { ...w, box: 1, due: now, added: now }
    commit(next)
  },
  remove(key: string) {
    const next = { ...state }
    delete next[key]
    commit(next)
  },
  toggle(w: NewWord) {
    if (state[w.key]) this.remove(w.key)
    else this.save(w)
  },
  /** Tekrar sonucu: doğruysa bir üst kutu, yanlışsa 1. kutu (yarın tekrar). */
  grade(key: string, correct: boolean) {
    const w = state[key]
    if (!w) return
    const box = correct ? Math.min(MAX_BOX, w.box + 1) : 1
    const days = correct ? INTERVAL_DAYS[box] : 1
    commit({ ...state, [key]: { ...w, box, due: Date.now() + days * DAY } })
  },
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

export function useWordbook(): WordbookState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

/** Tekrarı gelmiş kelimeler (en eski önce). */
export function dueWords(book: WordbookState, now = Date.now()): SavedWord[] {
  return Object.values(book)
    .filter((w) => w.due <= now)
    .sort((a, b) => a.due - b.due)
}
