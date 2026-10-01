import { useEffect, useRef, useState } from 'react'
import { audio, type SpeakItem } from '../../audio/AudioService'
import { Icon } from './Icon'

/**
 * Kendi sesini kaydet ve modelle karşılaştır. Kayıt sadece bu sayfada (bellekte) kalır, hiçbir yere gönderilmez.
 * Karşılaştır: model → sen → model.
 */

type State = 'idle' | 'asking' | 'recording' | 'done' | 'blocked'

const MAX_MS = 12000
const supported = () => typeof MediaRecorder !== 'undefined' && !!navigator.mediaDevices?.getUserMedia

export function RecordButton({ model, label }: { model: SpeakItem[]; label: string }) {
  const [state, setState] = useState<State>('idle')
  const [url, setUrl] = useState<string | null>(null)
  const recorder = useRef<MediaRecorder | null>(null)
  const stopTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const player = useRef<HTMLAudioElement | null>(null)

  useEffect(
    () => () => {
      if (url) URL.revokeObjectURL(url)
    },
    [url],
  )
  useEffect(
    () => () => {
      clearTimeout(stopTimer.current)
      if (recorder.current?.state === 'recording') recorder.current.stop()
    },
    [],
  )

  if (!supported()) return null

  const start = async () => {
    audio.stop()
    player.current?.pause()
    setState('asking')
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const r = new MediaRecorder(stream)
      const chunks: Blob[] = []
      r.ondataavailable = (e) => chunks.push(e.data)
      r.onstop = () => {
        stream.getTracks().forEach((t) => t.stop())
        setUrl(URL.createObjectURL(new Blob(chunks, { type: r.mimeType })))
        setState('done')
      }
      recorder.current = r
      r.start()
      setState('recording')
      stopTimer.current = setTimeout(() => r.state === 'recording' && r.stop(), MAX_MS)
    } catch {
      setState('blocked')
    }
  }
  const stop = () => {
    clearTimeout(stopTimer.current)
    if (recorder.current?.state === 'recording') recorder.current.stop()
  }
  const playMine = () =>
    new Promise<void>((resolve) => {
      if (!url) return resolve()
      audio.stop()
      player.current ??= new Audio()
      const el = player.current
      el.onended = () => resolve()
      el.onerror = () => resolve()
      el.src = url
      el.play().catch(() => resolve())
    })
  const compare = async () => {
    await audio.play(model)
    await playMine()
    await audio.play(model)
  }

  if (state === 'blocked')
    return (
      <span className="rec rec--blocked" role="status">
        <Icon name="mic" size={16} /> Microphone is blocked
      </span>
    )

  return (
    <span className="rec" role="group" aria-label={`Record: ${label}`}>
      {state === 'recording' ? (
        <button type="button" className="rec__btn rec__btn--stop" onClick={stop} aria-label="Stop recording" title="Stop recording">
          <Icon name="stop" size={14} /> Stop
        </button>
      ) : (
        <button
          type="button"
          className="rec__btn"
          onClick={start}
          disabled={state === 'asking'}
          aria-label={url ? 'Record again' : `Record yourself: ${label}`}
          title={url ? 'Record again' : 'Record yourself'}
        >
          <Icon name="mic" size={16} />
          {!url && <span>Say it</span>}
        </button>
      )}
      {url && state === 'done' && (
        <>
          <button type="button" className="rec__btn" onClick={() => void playMine()} title="Listen to yourself">
            <Icon name="play" size={12} /> You
          </button>
          <button type="button" className="rec__btn" onClick={() => void compare()} title="Model, you, model">
            <Icon name="compare" size={16} /> Compare
          </button>
        </>
      )}
    </span>
  )
}
