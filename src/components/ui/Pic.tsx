import { PICS } from '../../illustrations/pics'

/** Ders kitabı çizimi (bkz. illustrations/pics.ts). Renk, içinde bulunduğu seviyenin rengidir. */
export function Pic({ name, className = '', decorative = false }: { name: string; className?: string; decorative?: boolean }) {
  const def = PICS[name]
  if (!def) return null
  return (
    <svg
      className={`pic ${className}`}
      viewBox="0 0 100 100"
      role={decorative ? undefined : 'img'}
      aria-label={decorative ? undefined : def.alt}
      aria-hidden={decorative || undefined}
    >
      {def.objs.map((o, i) => (
        <g key={i} transform={o.at}>
          {o.fill && <path className="pic__paper" d={o.fill} />}
          {o.fill && o.spot !== false && <path className="pic__spot" d={o.fill} transform="translate(2.4 2.2)" />}
          {o.ink && <path className="pic__ink" d={o.ink} vectorEffect="non-scaling-stroke" />}
          {o.dots && <path className="pic__dots" d={o.dots} />}
        </g>
      ))}
    </svg>
  )
}
