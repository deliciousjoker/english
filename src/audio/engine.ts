import type { Character } from '../content/schema'

/**
 * Hazır ses dosyalarını hangi motor üretiyor:
 *  - kokoro: ücretsiz, açık kaynak (Apache 2.0), bilgisayarda çalışır, hesap gerekmez
 *  - azure:  Azure Text-to-Speech (hesap + anahtar gerekir)
 * Motor değişince dosya adları da değişir; `npm run audio` yeni dosyaları üretir.
 */
export const TTS_ENGINE: 'kokoro' | 'azure' = 'kokoro'

/** Ses dosyası adının (hash) parçası olan ses kimliği. */
export function ttsVoice(c: Character): string {
  return TTS_ENGINE === 'kokoro' ? `kokoro:${c.kokoroVoice}` : c.azureVoice
}
