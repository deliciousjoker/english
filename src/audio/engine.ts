import type { Character } from '../content/schema'

/**
 * Hazır ses dosyalarını hangi motor üretiyor:
 *  - kokoro: ücretsiz, açık kaynak (Apache 2.0), bilgisayarda çalışır, hesap gerekmez
 *  - azure:  Azure Text-to-Speech (hesap + anahtar gerekir)
 * Motor değişince dosya adları da değişir; `npm run audio` yeni dosyaları üretir.
 */
export const TTS_ENGINE: 'kokoro' | 'azure' = 'kokoro'

/**
 * Kokoro model hassasiyeti. fp32 daha doğal (Ekim 2026'da ses deneme sayfasında dinlenip seçildi), q8 daha hızlı.
 * Dosya adının parçasıdır: değişirse bütün sesler yeniden üretilir.
 */
export const KOKORO_DTYPE = 'fp32'

/** Ses dosyası adının (hash) parçası olan ses kimliği. */
export function ttsVoice(c: Character): string {
  return TTS_ENGINE === 'kokoro' ? `kokoro-${KOKORO_DTYPE}:${c.kokoroVoice}` : c.azureVoice
}
