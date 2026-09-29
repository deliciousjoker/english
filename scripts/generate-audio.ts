/**
 * Ses dosyalarını üretir:  npm run audio
 * Motor src/audio/engine.ts içinde seçilir: kokoro (ücretsiz, bilgisayarda) veya azure.
 *
 *   npm run audio -- --dry            Kaç dosya üretileceğini gösterir, istek atmaz
 *   npm run audio -- --lesson a1-u1-l1 Sadece bir ders (virgülle birden fazla ders)
 *   npm run audio -- --no-words       Metindeki tek tek kelimeleri atla (sadece cümleler, kelime listesi…)
 *   npm run audio -- --limit 50       En fazla 50 dosya üret
 *   npm run audio -- --prune          Artık kullanılmayan mp3'leri sil
 *   npm run audio -- --shard 0/2      İşi paralel işlemlere böl (diğer pencerede --shard 1/2)
 *
 * Azure için .env içinde AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION gerekir (.env.example'a bak).
 * Var olan dosyalar atlanır; yarıda kesilirse tekrar çalıştırmak kaldığı yerden devam eder.
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { audioKey } from '../src/audio/hash.ts'
import { TTS_ENGINE } from '../src/audio/engine.ts'
import { Characters, Glossary, Lesson } from '../src/content/schema.ts'
import { collectSpeakables, type Speakable } from '../src/content/speakables.ts'
import { lemmaCandidates, wordKey } from '../src/lib/text.ts'

const ROOT = join(import.meta.dirname, '..')
const OUT = join(ROOT, 'public', 'audio')
const args = process.argv.slice(2)
const flag = (name: string) => args.includes(name)
const option = (name: string) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}

if (existsSync(join(ROOT, '.env'))) process.loadEnvFile(join(ROOT, '.env'))
const KEY = process.env.AZURE_SPEECH_KEY
const REGION = process.env.AZURE_SPEECH_REGION
const DELAY = Number(process.env.TTS_DELAY_MS ?? 3200)

const readJSON = (p: string): unknown => JSON.parse(readFileSync(p, 'utf8'))
function walk(dir: string): string[] {
  if (!existsSync(dir)) return []
  return readdirSync(dir, { withFileTypes: true }).flatMap((d) =>
    d.isDirectory() ? walk(join(dir, d.name)) : d.name.endsWith('.json') ? [join(dir, d.name)] : [],
  )
}

const characters = Characters.parse(readJSON(join(ROOT, 'content', 'characters.json')))
const characterMap = new Map(characters.map((c) => [c.id, c]))
const glossary: Glossary = {}
for (const f of walk(join(ROOT, 'content', 'glossary'))) Object.assign(glossary, Glossary.parse(readJSON(f)))

// ---- Seslendirilecek her şeyi topla ----
// --lesson a1-u1-l1 ya da virgülle birden fazla: --lesson a1-u4-l1,a1-u4-l2
const onlyLessons = option('--lesson')?.split(',').map((s) => s.trim())
const all = new Map<string, Speakable>()
for (const f of walk(join(ROOT, 'content', 'lessons'))) {
  const lesson = Lesson.parse(readJSON(f))
  // Tarayıcıdaki kelime kartıyla aynı kural: dersin kelimeleri + sözlük
  const vocab = new Set(lesson.sections.flatMap((s) => (s.type === 'vocabulary' ? s.items.map((i) => wordKey(i.word)) : [])))
  const isKnown = (w: string) => lemmaCandidates(w).some((c) => vocab.has(c) || !!(glossary[c]?.tr || glossary[c]?.ar))
  for (const s of collectSpeakables(lesson, characterMap, isKnown)) {
    const key = audioKey(s.voice, s.text)
    const existing = all.get(key)
    // Aynı metin hem cümle hem kelime olarak geçiyorsa öncelik cümlede
    if (!existing || (existing.priority === 'word' && s.priority === 'main')) {
      if (!onlyLessons || onlyLessons.includes(lesson.id)) all.set(key, s)
    }
  }
}

mkdirSync(OUT, { recursive: true })

function writeManifest() {
  const files = readdirSync(OUT)
    .filter((f) => f.endsWith('.mp3'))
    .map((f) => f.slice(0, -4))
    .sort()
  writeFileSync(join(OUT, 'manifest.json'), JSON.stringify({ files }) + '\n')
  return files.length
}

if (flag('--prune')) {
  if (onlyLessons) {
    console.log('--prune tek dersle kullanılamaz.')
    process.exit(1)
  }
  let removed = 0
  for (const f of readdirSync(OUT))
    if (f.endsWith('.mp3') && !all.has(f.slice(0, -4))) {
      unlinkSync(join(OUT, f))
      removed++
    }
  console.log(`${removed} kullanılmayan dosya silindi. Manifest: ${writeManifest()} dosya.`)
  process.exit(0)
}

let todo = [...all.entries()].filter(([key]) => !existsSync(join(OUT, `${key}.mp3`)))
if (flag('--no-words')) todo = todo.filter(([, s]) => s.priority === 'main')
todo.sort((a, b) => (a[1].priority === b[1].priority ? 0 : a[1].priority === 'main' ? -1 : 1))
const ready = all.size - todo.length
// --shard 0/2 ve --shard 1/2: işi iki paralel işleme böler (aynı dosyayı iki kez üretmezler)
const shard = option('--shard')?.split('/').map(Number)
if (shard) todo = todo.filter((_, i) => i % shard[1] === shard[0])
const limit = Number(option('--limit') ?? Infinity)
todo = todo.slice(0, limit)

const chars = todo.reduce((n, [, s]) => n + s.text.length, 0)
// Kokoro saniyede ~1,5 sn ses üretir; Azure'da ücretsiz katman beklemesi var
const mins = Math.ceil(TTS_ENGINE === 'azure' ? (todo.length * DELAY) / 60000 : chars / 900)
console.log(
  `Motor: ${TTS_ENGINE}. Toplam ${all.size} ses; ${ready} tanesi hazır. Üretilecek: ${todo.length} dosya, ${chars} karakter (~${mins} dk).`,
)

if (flag('--dry') || todo.length === 0) {
  console.log(`Manifest: ${writeManifest()} dosya.`)
  process.exit(0)
}

if (TTS_ENGINE === 'azure' && (!KEY || !REGION)) {
  console.error('\n.env içinde AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION yok. .env.example dosyasına bak.')
  process.exit(1)
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

// ---- Kokoro (ücretsiz, bilgisayarda) ----
// Paketler isteğe bağlı (optionalDependencies); tipleri burada küçükçe tanımlı ki derleme onlara bağlı olmasın.
type KokoroModel = { generate(text: string, o: { voice: string }): Promise<{ audio: Float32Array; sampling_rate: number }> }
type Mp3EncoderCtor = new (ch: number, rate: number, kbps: number) => {
  encodeBuffer(left: Int16Array): Uint8Array
  flush(): Uint8Array
}
let kokoro: KokoroModel | null = null
let Mp3Encoder: Mp3EncoderCtor | null = null

async function synthKokoro(voice: string, text: string): Promise<Buffer> {
  if (!kokoro) {
    console.log('  Kokoro modeli yükleniyor (ilk seferde ~90 MB indirilir)…')
    // Modül adı değişkende: derleyici bu isteğe bağlı paketleri aramasın (GitHub'da kurulmuyorlar)
    const kokoroPkg = 'kokoro-js'
    const lamePkg = '@breezystack/lamejs'
    const mod = (await import(kokoroPkg)) as unknown as {
      KokoroTTS: { from_pretrained(id: string, o: object): Promise<KokoroModel> }
    }
    kokoro = await mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype: 'q8', device: 'cpu' })
    Mp3Encoder = ((await import(lamePkg)) as unknown as { Mp3Encoder: Mp3EncoderCtor }).Mp3Encoder
  }
  const out = await kokoro.generate(text, { voice })
  // Float32 → 16 bit → mp3 (tek kanal, 64 kbps)
  const pcm = new Int16Array(out.audio.length)
  for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-1, Math.min(1, out.audio[i])) * 0x7fff
  const enc = new Mp3Encoder!(1, out.sampling_rate, 64)
  const chunks: Buffer[] = []
  const add = (a: Uint8Array) => chunks.push(Buffer.from(a.buffer, a.byteOffset, a.byteLength))
  for (let i = 0; i < pcm.length; i += 1152) add(enc.encodeBuffer(pcm.subarray(i, i + 1152)))
  add(enc.flush())
  return Buffer.concat(chunks)
}

// ---- Azure ----
const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')

async function synthesize(s: Speakable): Promise<Buffer> {
  if (s.voice.startsWith('kokoro:')) return synthKokoro(s.voice.slice('kokoro:'.length), s.text)
  const lang = s.voice.split('-').slice(0, 2).join('-')
  const ssml = `<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="${lang}"><voice name="${s.voice}">${escapeXml(s.text)}</voice></speak>`
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(`https://${REGION}.tts.speech.microsoft.com/cognitiveservices/v1`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': KEY!,
        'Content-Type': 'application/ssml+xml',
        'X-Microsoft-OutputFormat': 'audio-24khz-48kbitrate-mono-mp3',
        'User-Agent': 'folio-audio',
      },
      body: ssml,
    })
    if (res.ok) return Buffer.from(await res.arrayBuffer())
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Azure anahtarı reddedildi (${res.status}). AZURE_SPEECH_KEY ve AZURE_SPEECH_REGION değerlerini kontrol et.`)
    }
    if ((res.status === 429 || res.status >= 500) && attempt < 6) {
      const wait = Number(res.headers.get('retry-after') ?? 0) * 1000 || 10000 * attempt
      console.log(`  … sınır aşıldı (${res.status}), ${Math.round(wait / 1000)} sn bekleniyor`)
      await sleep(wait)
      continue
    }
    throw new Error(`Azure hatası ${res.status}: ${await res.text()}`)
  }
}

let done = 0
try {
  for (const [key, s] of todo) {
    const mp3 = await synthesize(s)
    writeFileSync(join(OUT, `${key}.mp3`), mp3)
    done++
    console.log(`  ${done}/${todo.length}  ${s.voice.padEnd(20)} ${s.text.slice(0, 60)}`)
    if (done % 20 === 0) writeManifest()
    if (TTS_ENGINE === 'azure' && done < todo.length) await sleep(DELAY)
  }
} catch (e) {
  console.error(`\n${(e as Error).message}`)
} finally {
  console.log(`\n${done} dosya üretildi. Manifest: ${writeManifest()} dosya.`)
}
