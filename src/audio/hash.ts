/**
 * Hem tarayıcıda hem ses üretme betiğinde aynı sonucu veren hash (cyrb53).
 * Ses dosyasının adı = hash(sesAdı + metin); içerik değişince dosya adı da değişir.
 */
function cyrb53(str: string, seed = 0): number {
  let h1 = 0xdeadbeef ^ seed
  let h2 = 0x41c6ce57 ^ seed
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i)
    h1 = Math.imul(h1 ^ ch, 2654435761)
    h2 = Math.imul(h2 ^ ch, 1597334677)
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
  return 4294967296 * (2097151 & h2) + (h1 >>> 0)
}

/** 32 bitlik pozitif tamsayı (karıştırma tohumu için). */
export function hashString(str: string): number {
  return cyrb53(str) >>> 0
}

/** 14 haneli hex; çakışma riski binlerce dosya için ihmal edilebilir. */
export function audioKey(voice: string, text: string): string {
  return cyrb53(`${voice}|${text.trim()}`).toString(16).padStart(14, '0')
}
