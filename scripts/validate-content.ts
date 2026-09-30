/**
 * İçerik kontrolü:  npm run validate
 *
 * HATA (yayınlamayı engeller): şemaya uymayan ders, müfredatta olmayan ders, bilinmeyen konuşmacı…
 * UYARI (gözden geçir):        seviye üstü kelime, sözlükte anlamı olmayan kelime, eksik TR/AR destek,
 *                              seviyeye göre uzun metin.
 */
import { readFileSync, readdirSync, existsSync, writeFileSync } from 'node:fs'
import { join, relative, basename } from 'node:path'
import { Characters, Curriculum, Glossary, LEVELS, Lesson, supportPolicy, type Level, type Support } from '../src/content/schema.ts'
import { countWords, lemmaCandidates, tokenize, wordKey } from '../src/lib/text.ts'

const ROOT = join(import.meta.dirname, '..')
const CONTENT = join(ROOT, 'content')

const errors: string[] = []
const warnings = new Map<string, string[]>()
const warn = (where: string, msg: string) => warnings.set(where, [...(warnings.get(where) ?? []), msg])

const readJSON = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'))

function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.json') ? [join(dir, d.name)] : [],
  )
}

// ---- Ortak dosyalar ----
const curriculum = Curriculum.parse(readJSON(join(CONTENT, 'curriculum.json')))
const characters = Characters.parse(readJSON(join(CONTENT, 'characters.json')))
const characterIds = new Set(characters.map((c) => c.id))

const glossary: Glossary = {}
for (const f of walk(join(CONTENT, 'glossary')).filter((f) => !f.endsWith('.generated.json'))) {
  const parsed = Glossary.safeParse(readJSON(f))
  if (!parsed.success) errors.push(`${relative(ROOT, f)}: sözlük formatı hatalı`)
  else Object.assign(glossary, parsed.data)
}

function loadWordlist(level: Level): Set<string> {
  const upto = LEVELS.slice(0, Math.max(LEVELS.indexOf(level), LEVELS.indexOf('a1')) + 1)
  const words = new Set<string>()
  for (const lv of upto) {
    const f = join(ROOT, 'scripts', 'wordlists', `${lv}.txt`)
    if (!existsSync(f)) continue
    for (const line of readFileSync(f, 'utf8').split('\n')) {
      if (line.trim().startsWith('#')) continue
      for (const w of line.split(/\s+/)) if (w) words.add(wordKey(w))
    }
  }
  return words
}

// Müfredat sırası (önceki derslerin kelimeleri "bilinen" sayılır)
const order = curriculum.levels.flatMap((lv) =>
  lv.units.flatMap((u) => u.lessons.map((l, i) => ({ id: l.id, level: lv.id, unit: u.number, order: i + 1 }))),
)

// ---- Dersleri yükle ----
const files = walk(join(CONTENT, 'lessons'))
const lessons = new Map<string, Lesson>()
for (const f of files) {
  const rel = relative(ROOT, f)
  const parsed = Lesson.safeParse(readJSON(f))
  if (!parsed.success) {
    for (const i of parsed.error.issues) errors.push(`${rel}: ${i.path.join('.')} — ${i.message}`)
    continue
  }
  const lesson = parsed.data
  if (basename(f, '.json') !== lesson.id) errors.push(`${rel}: dosya adı ile id aynı olmalı ("${lesson.id}")`)
  const ref = order.find((o) => o.id === lesson.id)
  if (!ref) errors.push(`${rel}: curriculum.json içinde yok`)
  else {
    if (ref.level !== lesson.level) errors.push(`${rel}: seviye müfredatla uyuşmuyor (${lesson.level} ≠ ${ref.level})`)
    if (ref.unit !== lesson.unit || ref.order !== lesson.order)
      errors.push(`${rel}: unit/order müfredatla uyuşmuyor (müfredatta ${ref.unit}.${ref.order})`)
  }
  lessons.set(lesson.id, lesson)
}

// Özel isimler: cümle ortasında büyük harfle geçen kelimeler + karakter adları
const names = new Set<string>(characters.flatMap((c) => c.name.split(/\s+/).map(wordKey)))
const allSentences = (l: Lesson): string[] =>
  l.sections.flatMap((s) =>
    s.type === 'reading' ? s.paragraphs.flat() : s.type === 'dialogue' ? s.lines.map((x) => x.text) : [],
  )
for (const l of lessons.values())
  for (const sentence of allSentences(l)) {
    const words = tokenize(sentence).filter((t) => t.kind === 'word')
    words.forEach((t, i) => {
      if (i > 0 && /^\p{Lu}/u.test(t.text) && t.text !== 'I' && !/^I'/.test(t.text)) names.add(wordKey(t.text).replace(/'s$/, ''))
    })
  }

// Derslerin kelime listeleri otomatik olarak sözlüğe eklenir (content/glossary/vocab.generated.json).
// Böylece önceki derste öğrenilen bir kelimeye sonraki derste dokununca da anlamı çıkar.
const vocabGlossary: Glossary = {}
for (const l of lessons.values())
  for (const s of l.sections)
    if (s.type === 'vocabulary') for (const v of s.items) vocabGlossary[wordKey(v.word)] ??= { tr: v.gloss.tr, ar: v.gloss.ar }
{
  const f = join(CONTENT, 'glossary', 'vocab.generated.json')
  const next = JSON.stringify(Object.fromEntries(Object.entries(vocabGlossary).sort()), null, 1) + '\n'
  if (!existsSync(f) || readFileSync(f, 'utf8') !== next) writeFileSync(f, next)
}
for (const [k, v] of Object.entries(vocabGlossary)) glossary[k] ??= v

const hasArabic = (s: string) => /[؀-ۿ]/.test(s)

function checkSupport(where: string, what: string, s: Support | undefined) {
  if (!s?.tr) warn(where, `${what}: Türkçe destek yok`)
  if (!s?.ar) warn(where, `${what}: Arapça destek yok`)
  else if (!hasArabic(s.ar)) warn(where, `${what}: Arapça alanda Arapça harf yok`)
}

const READING_MAX: Record<Level, number> = { starter: 80, a1: 150, a2: 250, b1: 400, b2: 600, c1: 900 }

function known(word: string, allowed: Set<string>): boolean {
  const w = wordKey(word)
  if (/^\d/.test(w)) return true
  const cands = new Set(lemmaCandidates(w))
  const contr = w.match(/^(.+?)'(s|m|re|ve|ll|d)$/)
  if (contr) cands.add(contr[1])
  if (w.endsWith("n't")) cands.add(w.slice(0, -3))
  for (const part of w.split('-')) cands.add(part)
  return [...cands].some((c) => allowed.has(c) || names.has(c))
}

function glossed(word: string, vocab: Set<string>): boolean {
  return lemmaCandidates(word).some((c) => glossary[c] || vocab.has(c))
}

// ---- Ders ders kontrol ----
const learned = new Set<string>()
for (const ref of order) {
  const lesson = lessons.get(ref.id)
  if (!lesson) continue
  const where = `${lesson.id}`
  const allowed = new Set([...loadWordlist(lesson.level), ...learned])
  const vocabHere = new Set<string>()
  // A2'den itibaren talimat çevirisi gösterilmiyor; B1'den itibaren gramer özeti de (bkz. supportPolicy)
  const policy = supportPolicy(lesson.level)

  lesson.sections.forEach((s, i) => {
    const at = `bölüm ${i + 1} (${s.type}${s.type === 'exercise' ? '/' + s.kind : ''})`
    switch (s.type) {
      case 'vocabulary':
        for (const v of s.items) {
          wordKey(v.word).split(/\s+/).forEach((w) => vocabHere.add(w))
          vocabHere.add(wordKey(v.word))
          if (!v.gloss.tr || !v.gloss.ar) warn(where, `${at}: "${v.word}" için TR/AR anlam eksik`)
        }
        if (s.instructions && policy.instructions) checkSupport(where, at, s.support)
        break
      case 'tiles':
        s.items.forEach((t) => t.small && t.small.split(/\s+/).forEach((w) => vocabHere.add(wordKey(w))))
        break
      case 'dialogue':
        for (const line of s.lines) if (!characterIds.has(line.speaker)) errors.push(`${where}: ${at}: bilinmeyen konuşmacı "${line.speaker}"`)
        break
      case 'reading': {
        const n = countWords(s.paragraphs.flat().join(' '))
        if (n > READING_MAX[lesson.level]) warn(where, `${at}: metin ${n} kelime (${lesson.level} için önerilen en fazla ${READING_MAX[lesson.level]})`)
        if (s.voice && !characterIds.has(s.voice)) errors.push(`${where}: ${at}: bilinmeyen ses "${s.voice}"`)
        break
      }
      case 'grammar':
        if (policy.grammar) checkSupport(where, at, s.support)
        if (policy.glosses && (!s.watchOut?.tr || !s.watchOut?.ar)) warn(where, `${at}: "Watch out" kutusu TR veya AR eksik`)
        for (const lang of ['tr', 'ar'] as const) {
          const w = s.watchOut?.[lang]
          if (w && w.wrong.length !== w.right.length) warn(where, `${at}: watchOut.${lang} yanlış/doğru sayıları farklı`)
        }
        break
      case 'exercise':
        if (policy.instructions) checkSupport(where, at, s.support)
        if (s.kind === 'mcq')
          s.items.forEach((it, k) => {
            if (it.answer >= it.options.length) errors.push(`${where}: ${at}: soru ${k + 1} cevap numarası seçeneklerin dışında`)
            if (it.voice && !characterIds.has(it.voice)) errors.push(`${where}: ${at}: bilinmeyen ses "${it.voice}"`)
          })
        if (s.kind === 'gapfill' && s.bank && new Set(s.bank).size !== s.bank.length)
          errors.push(`${where}: ${at}: kelime bankasında aynı kelime iki kez var (her kelimeyi bir kez yaz)`)
        if (s.kind === 'gapfill')
          s.items.forEach((it, k) => {
            if (!it.includes('{')) errors.push(`${where}: ${at}: madde ${k + 1} içinde {boşluk} yok`)
            if (s.bank) {
              const answers = [...it.matchAll(/\{([^}]+)\}/g)].map((m) => m[1].split('|')[0].trim().toLowerCase())
              for (const a of answers) if (!s.bank.some((b) => b.toLowerCase() === a)) warn(where, `${at}: "${a}" kelime bankasında yok`)
            }
          })
        if (s.kind === 'dictation') s.items.forEach((it) => it.voice && !characterIds.has(it.voice) && errors.push(`${where}: ${at}: bilinmeyen ses "${it.voice}"`))
        break
      case 'writing':
        if (policy.instructions) checkSupport(where, at, s.support)
        break
    }
  })

  for (const w of vocabHere) allowed.add(w)

  // Seviye üstü ve sözlükte olmayan kelimeler (okuma + diyalog)
  const above = new Set<string>()
  const noGloss = new Set<string>()
  for (const sentence of allSentences(lesson)) {
    const words = tokenize(sentence).filter((t) => t.kind === 'word')
    words.forEach((t, i) => {
      const k = wordKey(t.text)
      const isName = names.has(k.replace(/'s$/, '')) && (i > 0 || !allowed.has(k))
      // Harf harf söylenen tek harfler (ör. "H, A, double D") atlanır
      if (isName || /^\d/.test(k) || (k.length === 1 && k !== 'a' && k !== 'i')) return
      if (!known(t.text, allowed)) above.add(k)
      if (!glossed(t.text, vocabHere)) noGloss.add(k)
    })
  }
  if (above.size) warn(where, `Seviye listesinde olmayan kelimeler (${lesson.level}): ${[...above].sort().join(', ')}`)
  if (noGloss.size) warn(where, `Sözlükte anlamı olmayan kelimeler: ${[...noGloss].sort().join(', ')}`)

  for (const w of vocabHere) learned.add(w)
}

// ---- Rapor ----
const red = (s: string) => `\x1b[31m${s}\x1b[0m`
const yellow = (s: string) => `\x1b[33m${s}\x1b[0m`
const green = (s: string) => `\x1b[32m${s}\x1b[0m`

console.log(`\n${lessons.size} ders, ${Object.keys(glossary).length} sözlük maddesi kontrol edildi.\n`)
for (const [where, list] of warnings) {
  console.log(yellow(`▲ ${where}`))
  for (const w of list) console.log(`   ${w}`)
}
if (errors.length) {
  console.log(red(`\n✗ ${errors.length} hata:`))
  for (const e of errors) console.log(red(`   ${e}`))
  process.exit(1)
}
console.log(green(`\n✓ Hata yok.`) + (warnings.size ? yellow(` (${[...warnings.values()].flat().length} uyarı — gözden geçir)`) : ''))
