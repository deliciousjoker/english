import { useEffect, useState } from 'react'
import { Icon } from '../../components/ui/Icon'

/** Sunumda geri sayım (1 / 3 / 5 dakika). Süre bitince kısa bir ses çıkar. */

function beep() {
  try {
    const ctx = new AudioContext()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.2, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.8)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.8)
  } catch {
    // ses çıkmazsa sorun değil
  }
}

/** end: sürenin biteceği an (ms) ya da null (sayaç kapalı). Sunum ekranı tutar ki T tuşu da başlatabilsin. */
export function PresentTimer({ end, setEnd }: { end: number | null; setEnd: (end: number | null) => void }) {
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (end == null) return
    const tick = () => {
      const t = Date.now()
      setNow(t)
      if (t >= end) {
        clearInterval(id)
        beep()
      }
    }
    // İlk değer hemen gelsin (yoksa eski saat bir an görünür)
    const first = setTimeout(tick, 0)
    const id = setInterval(tick, 250)
    return () => {
      clearTimeout(first)
      clearInterval(id)
    }
  }, [end])

  if (end == null)
    return (
      <span className="ptimer" role="group" aria-label="Timer">
        <Icon name="slow" size={18} />
        {[1, 3, 5].map((m) => (
          <button key={m} type="button" className="ptimer__opt" onClick={() => setEnd(Date.now() + m * 60000)} title={`${m} minute timer`}>
            {m}
          </button>
        ))}
      </span>
    )

  const left = Math.max(0, Math.ceil((end - now) / 1000))
  const mm = Math.floor(left / 60)
  const ss = String(left % 60).padStart(2, '0')
  return (
    <button type="button" className={`ptimer ptimer--run ${left === 0 ? 'is-over' : ''}`} onClick={() => setEnd(null)} title="Stop the timer">
      <Icon name="slow" size={18} />
      <span className="ptimer__time">{left === 0 ? "Time's up!" : `${mm}:${ss}`}</span>
      <Icon name="close" size={14} />
    </button>
  )
}
