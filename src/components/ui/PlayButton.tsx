import { audio, useNowPlaying, type SpeakItem } from '../../audio/AudioService'
import { Icon } from './Icon'

type Props = {
  /** Çalınacak öğeler; tek cümle ya da sıralı bir liste. */
  items: SpeakItem[]
  label: string
  variant?: 'icon' | 'pill'
  text?: string
  className?: string
}

/** Çal/durdur düğmesi. Listedeki öğelerden biri çalıyorsa "durdur" olur. */
export function PlayButton({ items, label, variant = 'icon', text, className = '' }: Props) {
  const now = useNowPlaying()
  const active = now != null && items.some((i) => i.key === now)
  const onClick = () => (active ? audio.stop() : audio.play(items))
  return (
    <button
      type="button"
      className={`play play--${variant} ${active ? 'is-active' : ''} ${className}`}
      onClick={onClick}
      aria-label={active ? `Stop: ${label}` : label}
      title={active ? 'Stop' : label}
    >
      <Icon name={active ? 'stop' : variant === 'icon' ? 'speaker' : 'play'} size={variant === 'icon' ? 18 : 16} />
      {variant === 'pill' && <span>{active ? 'Stop' : (text ?? 'Play')}</span>}
    </button>
  )
}
