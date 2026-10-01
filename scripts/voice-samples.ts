/**
 * Ses deneme sayfası için örnekler üretir:  npx tsx scripts/voice-samples.ts
 * Her karakterin kendi cümlelerinden 3 tanesi; sitede şu an çalan ses, aynı ses fp32 ve 2 alternatif ses.
 * Çıktı: public/voice-lab/ (git'e girmez). Sayfa: npm run dev → /voice-lab
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { audioKey } from '../src/audio/hash.ts'
import { ttsVoice } from '../src/audio/engine.ts'
import { Characters, Lesson } from '../src/content/schema.ts'
import { createKokoro } from './tts-kokoro.ts'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'public', 'voice-lab')
const readJSON = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'))
const walk = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.json') ? [join(dir, d.name)] : [],
  )

const characters = Characters.parse(readJSON(join(ROOT, 'content', 'characters.json')))
const lessons = walk(join(ROOT, 'content', 'lessons'))
  .sort()
  .map((f) => Lesson.parse(readJSON(f)))

// Aynı cinsiyet ve aksanda denenecek en iyi notlu Kokoro sesleri (VOICES.md notları: A, A-, B-, C+ …)
const POOL: Record<string, string[]> = {
  'en-US female': ['af_heart', 'af_bella', 'af_nicole', 'af_sarah', 'af_aoede', 'af_kore'],
  'en-US male': ['am_michael', 'am_puck', 'am_fenrir'],
  'en-GB female': ['bf_emma', 'bf_isabella'],
  'en-GB male': ['bm_george', 'bm_fable'],
}

/** Karakterin dersteki cümlelerinden 3 tane: orta uzunlukta, farklı derslerden. */
function sentencesFor(id: string): string[] {
  const all: string[] = []
  for (const l of lessons)
    for (const s of l.sections) {
      if (s.type === 'dialogue') all.push(...s.lines.filter((x) => x.speaker === id).map((x) => x.text))
      if (s.type === 'reading' && (s.voice ?? 'narrator') === id) all.push(...s.paragraphs.flat())
    }
  const good = all.filter((t) => t.length >= 35 && t.length <= 110)
  const pool = good.length >= 3 ? good : all
  if (pool.length <= 3) return pool
  return [0, Math.floor(pool.length / 2), pool.length - 1].map((i) => pool[i])
}

type Option = { label: string; voice: string; files: (string | null)[] }
type Entry = { id: string; name: string; current: string; sentences: string[]; options: Option[] }

mkdirSync(OUT, { recursive: true })
const synth = await createKokoro('fp32', 96)
const entries: Entry[] = []

for (const c of characters) {
  const sentences = sentencesFor(c.id)
  if (!sentences.length) continue
  const pool = POOL[`${c.fallback.lang} ${c.fallback.gender}`] ?? []
  const alternatives = pool.filter((v) => v !== c.kokoroVoice).slice(0, 2)
  const options: Option[] = [
    {
      label: `Now: ${ttsVoice(c)}`,
      voice: c.kokoroVoice,
      files: sentences.map((t) => {
        const key = audioKey(ttsVoice(c), t)
        return existsSync(join(ROOT, 'public', 'audio', `${key}.mp3`)) ? `audio/${key}.mp3` : null
      }),
    },
  ]
  for (const voice of [c.kokoroVoice, ...alternatives]) {
    const files: string[] = []
    for (const [i, text] of sentences.entries()) {
      const name = `${c.id}-${voice}-${i}.mp3`
      if (!existsSync(join(OUT, name))) writeFileSync(join(OUT, name), await synth(voice, text))
      files.push(`voice-lab/${name}`)
      console.log(`  ${c.id.padEnd(8)} ${voice.padEnd(12)} ${text.slice(0, 50)}`)
    }
    options.push({ label: `${voice} (fp32)`, voice, files })
  }
  entries.push({ id: c.id, name: c.name, current: c.kokoroVoice, sentences, options })
}

writeFileSync(join(OUT, 'index.json'), JSON.stringify({ characters: entries }, null, 1) + '\n')
console.log(`\n${entries.length} karakter hazır. Sayfa: npm run dev → http://localhost:5173/voice-lab`)
