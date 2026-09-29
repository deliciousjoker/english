/** Metin yardımcıları: cevap karşılaştırma, kelimelere bölme, boşluk ayrıştırma, sabit karıştırma. */

import { hashString } from '../audio/hash'

/** Cevap karşılaştırması için: küçük harf, tipografik kesme işareti → ', fazla boşluk ve sondaki noktalama yok. */
export function normalizeAnswer(s: string): string {
  return s
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[.!?,;:"]+$/g, '')
    .trim()
}

/** Dikte karşılaştırması için kelime listesi (noktalama ve büyük/küçük harf yok sayılır). */
export function answerWords(s: string): string[] {
  return normalizeAnswer(s)
    .replace(/[.!?,;:"()]/g, ' ')
    .split(' ')
    .filter(Boolean)
}

export type Token = { kind: 'word'; text: string } | { kind: 'space' | 'punct'; text: string }

/** Cümleyi tıklanabilir kelimelere ve aradaki boşluk/noktalamaya böler. "I'm", "Harbor's", "twenty-one" tek kelimedir. */
export function tokenize(sentence: string): Token[] {
  const tokens: Token[] = []
  // \p{L}: her dildeki harf (Ayşe, São, Çağla …)
  const re = /([\p{L}\p{N}]+(?:['’-][\p{L}\p{N}]+)*)|(\s+)|([^\p{L}\p{N}\s]+)/gu
  let m: RegExpExecArray | null
  while ((m = re.exec(sentence))) {
    if (m[1]) tokens.push({ kind: 'word', text: m[1] })
    else if (m[2]) tokens.push({ kind: 'space', text: m[2] })
    else tokens.push({ kind: 'punct', text: m[3] })
  }
  return tokens
}

export function wordsOf(text: string): string[] {
  return tokenize(text)
    .filter((t) => t.kind === 'word')
    .map((t) => t.text)
}

export function countWords(text: string): number {
  return wordsOf(text).length
}

/** Sözlükte arama anahtarı: küçük harf + düz kesme işareti. */
export function wordKey(word: string): string {
  return word.toLowerCase().replace(/[’‘]/g, "'")
}

const IRREGULAR: Record<string, string> = {
  am: 'be', is: 'be', are: 'be', was: 'be', were: 'be', been: 'be',
  has: 'have', had: 'have', does: 'do', did: 'do', done: 'do',
  went: 'go', goes: 'go', gone: 'go', men: 'man', women: 'woman',
  children: 'child', people: 'person', feet: 'foot', teeth: 'tooth',
  got: 'get', made: 'make', said: 'say', saw: 'see', came: 'come',
  took: 'take', ate: 'eat', drank: 'drink', wrote: 'write', read: 'read',
  bought: 'buy', thought: 'think', knew: 'know', told: 'tell', gave: 'give',
  found: 'find', left: 'leave', felt: 'feel', met: 'meet', sat: 'sit',
  stood: 'stand', ran: 'run', began: 'begin', slept: 'sleep', spoke: 'speak',
  better: 'good', best: 'good', worse: 'bad', worst: 'bad',
}

/** Bir kelimenin sözlükte bulunabilecek olası kök hâlleri (kaba ama hızlı). */
export function lemmaCandidates(word: string): string[] {
  const w = wordKey(word)
  const out = [w]
  if (IRREGULAR[w]) out.push(IRREGULAR[w])
  if (w.endsWith("'s")) out.push(w.slice(0, -2))
  if (w.endsWith("s'")) out.push(w.slice(0, -1))
  if (w.endsWith('ies')) out.push(w.slice(0, -3) + 'y')
  if (w.endsWith('es')) out.push(w.slice(0, -2))
  if (w.endsWith('s')) out.push(w.slice(0, -1))
  if (w.endsWith('ied')) out.push(w.slice(0, -3) + 'y')
  if (w.endsWith('ed')) out.push(w.slice(0, -2), w.slice(0, -1))
  if (w.endsWith('ing')) out.push(w.slice(0, -3), w.slice(0, -3) + 'e')
  if (/(.)\1(ed|ing)$/.test(w)) out.push(w.replace(/(.)\1(ed|ing)$/, '$1'))
  if (w.endsWith('er')) out.push(w.slice(0, -2))
  if (w.endsWith('est')) out.push(w.slice(0, -3))
  if (w.endsWith('ly')) out.push(w.slice(0, -2))
  return [...new Set(out)]
}

export type GapPart = { kind: 'text'; text: string } | { kind: 'gap'; answers: string[]; index: number }

/** "I {am|'m} Elif." → metin ve boşluk parçaları. */
export function parseGaps(source: string): GapPart[] {
  const parts: GapPart[] = []
  const re = /\{([^}]+)\}/g
  let last = 0
  let index = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(source))) {
    if (m.index > last) parts.push({ kind: 'text', text: source.slice(last, m.index) })
    parts.push({ kind: 'gap', answers: m[1].split('|').map((a) => a.trim()), index: index++ })
    last = m.index + m[0].length
  }
  if (last < source.length) parts.push({ kind: 'text', text: source.slice(last) })
  return parts
}

/** Boşlukları doğru cevapla doldurulmuş hâli. */
export function fillGaps(source: string): string {
  return source.replace(/\{([^}]+)\}/g, (_, a: string) => a.split('|')[0].trim())
}

/**
 * Tohumlu karıştırma: aynı içerik her açılışta aynı sırada karışır (sunum ve ödev tutarlı olsun).
 * Karışık hâl doğru sırayla aynı çıkarsa kaydırılır.
 */
export function seededShuffle<T>(items: readonly T[], seed: string): T[] {
  const arr = [...items]
  let s = hashString(seed)
  const rand = () => {
    s = (s * 1664525 + 1013904223) % 4294967296
    return s / 4294967296
  }
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  if (arr.length > 1 && arr.every((v, i) => v === items[i])) arr.push(arr.shift() as T)
  return arr
}

/** "**I'm** Maya." → vurgulu ve düz parçalar. */
export function parseBold(s: string): { text: string; bold: boolean }[] {
  return s
    .split(/(\*\*[^*]+\*\*)/g)
    .filter(Boolean)
    .map((p) => (p.startsWith('**') ? { text: p.slice(2, -2), bold: true } : { text: p, bold: false }))
}
