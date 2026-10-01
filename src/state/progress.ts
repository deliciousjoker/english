import { useCallback, useSyncExternalStore } from 'react'
import { readJSON, writeJSON } from '../lib/storage'

/**
 * Öğrenci ilerlemesi. Aşama 1'de sadece bu tarayıcıda (localStorage) tutulur;
 * Aşama 2'de giriş yapan öğrenci için Firestore'a eşitlenecek — değişecek tek yer bu dosya.
 */

export type ExerciseResult = { correct: number; total: number; at: number }
export type CanDoRating = 0 | 1 | 2 // not yet / almost / yes

export type LessonProgress = {
  exercises: Record<string, ExerciseResult>
  canDo: Record<string, CanDoRating>
  writing: Record<string, string>
  totalExercises?: number
  updatedAt: number
}

type ProgressState = { lessons: Record<string, LessonProgress>; lastLesson?: string }

const EMPTY_LESSON: LessonProgress = { exercises: {}, canDo: {}, writing: {}, updatedAt: 0 }

let state: ProgressState = readJSON<ProgressState>('progress', { lessons: {} })
const listeners = new Set<() => void>()

function commit(next: ProgressState) {
  state = next
  writeJSON('progress', state)
  listeners.forEach((fn) => fn())
}

function subscribe(fn: () => void) {
  listeners.add(fn)
  return () => {
    listeners.delete(fn)
  }
}

/** Ünite testleri "test:", hikâyeler "story:" önekiyle kaydedilir; "Continue" için son ders sayılmazlar. */
export const TEST_PREFIX = 'test:'

function updateLesson(id: string, fn: (p: LessonProgress) => LessonProgress) {
  const current = state.lessons[id] ?? EMPTY_LESSON
  const lastLesson = id.includes(':') ? state.lastLesson : id
  commit({ ...state, lastLesson, lessons: { ...state.lessons, [id]: { ...fn(current), updatedAt: Date.now() } } })
}

export const progress = {
  recordExercise(lessonId: string, sectionId: string, correct: number, total: number) {
    updateLesson(lessonId, (p) => ({ ...p, exercises: { ...p.exercises, [sectionId]: { correct, total, at: Date.now() } } }))
  },
  clearExercise(lessonId: string, sectionId: string) {
    updateLesson(lessonId, (p) => {
      const exercises = { ...p.exercises }
      delete exercises[sectionId]
      return { ...p, exercises }
    })
  },
  rateCanDo(lessonId: string, index: number, rating: CanDoRating) {
    updateLesson(lessonId, (p) => ({ ...p, canDo: { ...p.canDo, [index]: rating } }))
  },
  saveWriting(lessonId: string, sectionId: string, text: string) {
    updateLesson(lessonId, (p) => ({ ...p, writing: { ...p.writing, [sectionId]: text } }))
  },
  opened(lessonId: string, totalExercises: number) {
    const p = state.lessons[lessonId]
    if (p?.totalExercises === totalExercises && state.lastLesson === lessonId) return
    updateLesson(lessonId, (p) => ({ ...p, totalExercises }))
  },
}

export function useProgress(): ProgressState {
  return useSyncExternalStore(subscribe, () => state, () => state)
}

export function useLessonProgress(lessonId: string): LessonProgress {
  const get = useCallback(() => state.lessons[lessonId] ?? EMPTY_LESSON, [lessonId])
  return useSyncExternalStore(subscribe, get, get)
}

/** 0–1 arası: yapılmış alıştırma bölümü / toplam alıştırma bölümü. */
export function completion(p: LessonProgress | undefined): number {
  if (!p?.totalExercises) return 0
  return Math.min(1, Object.keys(p.exercises).length / p.totalExercises)
}
