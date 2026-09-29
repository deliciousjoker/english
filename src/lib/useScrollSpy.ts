import { useEffect, useState } from 'react'

/** Sayfada o an okunan bölümün kimliği (yan menüde işaretlemek için). */
export function useScrollSpy(ids: string[]): string | null {
  const [current, setCurrent] = useState<string | null>(null)
  const key = ids.join('|')

  useEffect(() => {
    const els = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter((el): el is HTMLElement => !!el)
    if (!els.length || typeof IntersectionObserver === 'undefined') return
    const visible = new Map<string, number>()
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.boundingClientRect.top : Infinity)
        let best: string | null = null
        let bestTop = Infinity
        for (const [id, top] of visible) {
          if (top !== Infinity && Math.abs(top) < Math.abs(bestTop)) {
            best = id
            bestTop = top
          }
        }
        if (best) setCurrent(best)
      },
      { rootMargin: '-15% 0px -55% 0px' },
    )
    els.forEach((el) => obs.observe(el))
    return () => obs.disconnect()
  }, [key])

  return current
}
