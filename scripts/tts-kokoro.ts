/**
 * Kokoro ile metinden mp3 üretir (generate-audio.ts ve voice-samples.ts ortak kullanır).
 * Paketler isteğe bağlı (optionalDependencies); tipleri burada küçükçe tanımlı ki derleme onlara bağlı olmasın.
 */

type KokoroModel = { generate(text: string, o: { voice: string; speed?: number }): Promise<{ audio: Float32Array; sampling_rate: number }> }
type Mp3EncoderCtor = new (ch: number, rate: number, kbps: number) => {
  encodeBuffer(left: Int16Array): Uint8Array
  flush(): Uint8Array
}

export type KokoroDtype = 'fp32' | 'fp16' | 'q8' | 'q4'

export type KokoroSynth = (voice: string, text: string) => Promise<Buffer>

/** Modeli bir kez yükler, sonra her çağrıda bir mp3 döndürür. */
export async function createKokoro(dtype: KokoroDtype, kbps = 64): Promise<KokoroSynth> {
  // Modül adı değişkende: derleyici bu isteğe bağlı paketleri aramasın (GitHub'da kurulmuyorlar)
  const kokoroPkg = 'kokoro-js'
  const lamePkg = '@breezystack/lamejs'
  const mod = (await import(kokoroPkg)) as unknown as {
    KokoroTTS: { from_pretrained(id: string, o: object): Promise<KokoroModel> }
  }
  const model = await mod.KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', { dtype, device: 'cpu' })
  const { Mp3Encoder } = (await import(lamePkg)) as unknown as { Mp3Encoder: Mp3EncoderCtor }

  return async (voice, text) => {
    const out = await model.generate(text, { voice })
    // Float32 → 16 bit → mp3 (tek kanal)
    const pcm = new Int16Array(out.audio.length)
    for (let i = 0; i < pcm.length; i++) pcm[i] = Math.max(-1, Math.min(1, out.audio[i])) * 0x7fff
    const enc = new Mp3Encoder(1, out.sampling_rate, kbps)
    const chunks: Buffer[] = []
    const add = (a: Uint8Array) => chunks.push(Buffer.from(a.buffer, a.byteOffset, a.byteLength))
    for (let i = 0; i < pcm.length; i += 1152) add(enc.encodeBuffer(pcm.subarray(i, i + 1152)))
    add(enc.flush())
    return Buffer.concat(chunks)
  }
}
