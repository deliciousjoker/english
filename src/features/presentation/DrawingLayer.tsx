import { useCallback, useEffect, useRef } from 'react'

/** Sunumda slaytın üstüne çizim: kalem, fosforlu kalem, silgi. Çizimler içerikle birlikte kayar. */

export type Tool = 'red' | 'blue' | 'marker' | 'eraser'

type Stroke = { tool: Tool; points: [number, number][] }

const STYLE: Record<Exclude<Tool, 'eraser'>, { width: number; color: string; alpha: number }> = {
  red: { width: 3.5, color: '#cf3326', alpha: 1 },
  blue: { width: 3.5, color: '#2152c4', alpha: 1 },
  marker: { width: 24, color: '#ffd500', alpha: 0.4 },
}

function drawStroke(ctx: CanvasRenderingContext2D, s: Stroke) {
  if (s.points.length === 0) return
  ctx.save()
  ctx.lineCap = 'round'
  ctx.lineJoin = 'round'
  if (s.tool === 'eraser') {
    ctx.globalCompositeOperation = 'destination-out'
    ctx.lineWidth = 34
    ctx.strokeStyle = '#000'
  } else {
    const st = STYLE[s.tool]
    ctx.globalAlpha = st.alpha
    ctx.lineWidth = st.width
    ctx.strokeStyle = st.color
    if (s.tool === 'marker') ctx.globalCompositeOperation = 'multiply'
  }
  ctx.beginPath()
  const [x0, y0] = s.points[0]
  ctx.moveTo(x0, y0)
  if (s.points.length === 1) ctx.lineTo(x0 + 0.1, y0)
  // Yumuşak çizgi: noktalar arasının ortasından eğri
  for (let i = 1; i < s.points.length - 1; i++) {
    const [x, y] = s.points[i]
    const [nx, ny] = s.points[i + 1]
    ctx.quadraticCurveTo(x, y, (x + nx) / 2, (y + ny) / 2)
  }
  if (s.points.length > 1) ctx.lineTo(...s.points[s.points.length - 1])
  ctx.stroke()
  ctx.restore()
}

export function DrawingLayer({ tool, clearKey }: { tool: Tool | null; clearKey: string }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const strokes = useRef<Stroke[]>([])
  const drawing = useRef<Stroke | null>(null)

  const redraw = useCallback(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    for (const s of strokes.current) drawStroke(ctx, s)
    if (drawing.current) drawStroke(ctx, drawing.current)
  }, [])

  // Tuval, kayan içeriğin tamamını kaplar; içerik boyutu değişince yeniden ölçülür
  useEffect(() => {
    const c = canvas.current
    const host = c?.parentElement
    if (!c || !host) return
    const fit = () => {
      const dpr = window.devicePixelRatio || 1
      const w = host.scrollWidth
      const h = host.scrollHeight
      c.style.width = `${w}px`
      c.style.height = `${h}px`
      c.width = Math.round(w * dpr)
      c.height = Math.round(h * dpr)
      redraw()
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(host)
    if (host.firstElementChild) ro.observe(host.firstElementChild)
    return () => ro.disconnect()
  }, [redraw, clearKey])

  // Slayt değişince ya da "temizle" deyince çizimler silinir
  useEffect(() => {
    strokes.current = []
    drawing.current = null
    redraw()
  }, [clearKey, redraw])

  const point = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  return (
    <canvas
      ref={canvas}
      className={`drawlayer ${tool ? `is-on drawlayer--${tool}` : ''}`}
      onPointerDown={(e) => {
        if (!tool) return
        e.currentTarget.setPointerCapture(e.pointerId)
        drawing.current = { tool, points: [point(e)] }
        redraw()
      }}
      onPointerMove={(e) => {
        if (!drawing.current) return
        drawing.current.points.push(point(e))
        redraw()
      }}
      onPointerUp={() => {
        if (drawing.current) strokes.current.push(drawing.current)
        drawing.current = null
      }}
      onPointerCancel={() => {
        drawing.current = null
        redraw()
      }}
      aria-hidden="true"
    />
  )
}
