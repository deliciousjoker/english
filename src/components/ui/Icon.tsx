/** Elle çizilmiş küçük ikon seti — hazır ikon kütüphanesi kullanılmıyor. */

const PATHS = {
  play: 'M7 4.5v15l12.5-7.5z',
  stop: 'M6.5 6.5h11v11h-11z',
  speaker: 'M4 9.5h3.5L12 5.5v13l-4.5-4H4zM15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11',
  check: 'M4.5 12.5l5 5 10-11',
  cross: 'M6 6l12 12M18 6L6 18',
  arrowRight: 'M4.5 12h14M13 6.5l5.5 5.5-5.5 5.5',
  arrowLeft: 'M19.5 12h-14M11 6.5L5.5 12l5.5 5.5',
  up: 'M12 19V5.5M6.5 11L12 5.5l5.5 5.5',
  down: 'M12 5v13.5M6.5 13l5.5 5.5 5.5-5.5',
  eye: 'M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12zM12 9.2a2.8 2.8 0 1 0 0 5.6 2.8 2.8 0 0 0 0-5.6z',
  eyeOff: 'M3 3l18 18M10.6 5.6A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a17 17 0 0 1-2.9 3.7M6.3 6.9C3.9 8.6 2.5 12 2.5 12s3.5 6.5 9.5 6.5a9 9 0 0 0 4.3-1.1',
  reset: 'M4.5 12a7.5 7.5 0 1 0 2.2-5.3M4.5 4.5v4h4',
  screen: 'M3.5 5h17v11h-17zM8.5 20h7M12 16v4',
  gear: 'M4 7h8M16 7h4M4 17h3M11 17h9M14 4.5v5M9 14.5v5',
  book: 'M4 5.5c2.5-1.3 5.5-1.3 8 .5 2.5-1.8 5.5-1.8 8-.5v13c-2.5-1.3-5.5-1.3-8 .5-2.5-1.8-5.5-1.8-8-.5zM12 6v13',
  pencil: 'M15.5 4.5l4 4L8.5 19.5H4.5v-4zM13 7l4 4',
  close: 'M6 6l12 12M18 6L6 18',
  slow: 'M12 6.5v5.5l3.5 2M12 3.5a8.5 8.5 0 1 0 0 17 8.5 8.5 0 0 0 0-17z',
  copy: 'M8.5 8.5h11v11h-11zM15.5 8.5v-4h-11v11h4',
  expand: 'M4 9.5V4h5.5M20 9.5V4h-5.5M4 14.5V20h5.5M20 14.5V20h-5.5',
  note: 'M5 3.5h10l4 4v13H5zM14.5 3.5v4.5H19M8.5 12h7M8.5 15.5h7',
  headphones: 'M4.5 17v-4.5a7.5 7.5 0 0 1 15 0V17M4.5 14.5h3v5h-3zM16.5 14.5h3v5h-3z',
  chat: 'M4.5 5.5h15v10h-8l-4.5 4v-4h-2.5z',
  table: 'M4 5h16v14H4zM4 10h16M10 10v9',
  tick: 'M4.5 4.5h15v15h-15zM8.5 12.5l2.5 2.5 4.5-5.5',
  cards: 'M8 8h11.5v11.5H8zM4.5 16V4.5H16',
  flag: 'M6 20.5V4M6 4.5h11.5l-2.5 4 2.5 4H6',
} as const

export type IconName = keyof typeof PATHS

export function Icon({ name, size = 20, className }: { name: IconName; size?: number; className?: string }) {
  const filled = name === 'play' || name === 'stop'
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      aria-hidden="true"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth={filled ? 0 : 1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={PATHS[name]} />
    </svg>
  )
}
