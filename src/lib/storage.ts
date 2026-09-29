/** localStorage erişimi gizli pencerede veya engelli çerezlerde hata verebilir; hepsi güvenli sarmalanır. */

const PREFIX = 'folio:'

export function readJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    return raw == null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

export function writeJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value))
  } catch {
    // depolama yoksa sessizce geç
  }
}

export function removeKey(key: string): void {
  try {
    localStorage.removeItem(PREFIX + key)
  } catch {
    // yok say
  }
}
