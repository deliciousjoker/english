/**
 * Cümle kurma maddeleri: "I'm flying to Amman tomorrow.|Tomorrow I'm flying to Amman."
 * İlk biçim ekranda ve cevap anahtarında görünür; "|" sonrası da doğru kabul edilen sıralardır.
 */

const strip = (s: string) => s.trim().match(/^(.*?)([.!?]*)$/)!

export function sentenceForms(item: string): string[] {
  return item
    .split('|')
    .map((s) => s.trim())
    .filter(Boolean)
}

/** "Where are you from?" → kelimeler ["Where","are","you","from"], son noktalama "?" ve kabul edilen cevaplar */
export function splitSentence(item: string) {
  const forms = sentenceForms(item)
  const [, body, end] = strip(forms[0])
  const words = body.split(/\s+/).filter(Boolean)
  const others = forms.slice(1).map((f) => strip(f)[1].split(/\s+/).filter(Boolean))
  // Başka sırada baştaki kelime cümle içinde geçiyorsa oradaki yazılışı al ("He" → "he", "Lina" kalır)
  if (others.length) {
    const inside = others.flatMap((o) => o.slice(1))
    const mid = inside.find((w) => w.toLowerCase() === words[0].toLowerCase())
    if (mid) words[0] = mid
  }
  const answers = [words.join(' '), ...others.map((o) => o.join(' '))].map((s) => s.toLowerCase())
  return { words, end, answers }
}

/** Seçilen kelimeler doğru sıralardan birini veriyor mu? (büyük/küçük harf önemsiz) */
export function isRightOrder(chosen: string[], answers: string[]): boolean {
  const s = chosen.join(' ').toLowerCase()
  return answers.includes(s)
}

/** Öğrencinin kurduğu cümlede ilk kelime büyük harfle başlasın. */
export const capitalize = (w: string) => w.charAt(0).toUpperCase() + w.slice(1)
