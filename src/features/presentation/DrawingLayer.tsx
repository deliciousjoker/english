import { useCallback, useEffect, useRef, useState } from 'react'

/** Sunumda slaytın üstüne çizim: kalem, fosforlu kalem, silgi ve yazı. Çizimler içerikle birlikte kayar. */

export type Tool = 'red' | 'blue' | 'marker' | 'eraser' | 'text'
export type Ink = 'red' | 'blue'

type Stroke = { tool: Exclude<Tool, 'text'>; points: [number, number][] }
type TextMark = { tool: 'text'; id: number; x: number; y: number; text: string; ink: Ink }
type Mark = Stroke | TextMark
type Editing = { id: number; x: number; y: number; ink: Ink; slide: string }

const INK: Record<Ink, string> = { red: '#cf3326', blue: '#2152c4' }
const STYLE: Record<'red' | 'blue' | 'marker', { width: number; color: string; alpha: number }> = {
  red: { width: 3.5, color: INK.red, alpha: 1 },
  blue: { width: 3.5, color: INK.blue, alpha: 1 },
  marker: { width: 24, color: '#ffd500', alpha: 0.4 },
}

/** Yazı: tuvalde ve yazarken açılan kutuda aynı ölçüler. (x, y) = ilk harfin solu, satırın ortası */
const TEXT_SIZE = 30
const PAD = 6
const BORDER = 2
const BOX_H = Math.round(TEXT_SIZE * 1.35) + 2 * BORDER
const TEXT_FONT = `600 ${TEXT_SIZE}px "Atkinson Hyperlegible Next", "Noto Naskh Arabic", system-ui, sans-serif`

function drawMark(ctx: CanvasRenderingContext2D, s: Mark, paper: string) {
  ctx.save()
  if (s.tool === 'text') {
    ctx.font = TEXT_FONT
    ctx.textBaseline = 'middle'
    // Arapçayla başlayan yazı sağdan sola (yazarkenki kutuyla aynı görünsün)
    ctx.direction = /^[^\p{L}]*[؀-ۿ]/u.test(s.text) ? 'rtl' : 'ltr'
    ctx.textAlign = 'left'
    // Altındaki baskıyla karışmasın: yarı saydam kâğıt zemin
    const w = ctx.measureText(s.text).width
    ctx.fillStyle = paper
    ctx.globalAlpha = 0.85
    ctx.fillRect(s.x - 4, s.y - BOX_H / 2 + BORDER, w + 8, BOX_H - 2 * BORDER)
    ctx.globalAlpha = 1
    ctx.fillStyle = INK[s.ink]
    ctx.fillText(s.text, s.x, s.y)
  } else if (s.points.length) {
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
  }
  ctx.restore()
}

export function DrawingLayer({ tool, ink, clearKey, undoKey }: { tool: Tool | null; ink: Ink; clearKey: string; undoKey: number }) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const marks = useRef<Mark[]>([])
  const drawing = useRef<Stroke | null>(null)
  const nextId = useRef(1)
  // Yazılmakta olan yazı tuvale değil, üstündeki kutuya yazılır; bitince tuvale geçer
  const [editing, setEditing] = useState<Editing | null>(null)
  const [draft, setDraft] = useState('')
  const input = useRef<HTMLInputElement>(null)

  const redraw = useCallback(() => {
    const c = canvas.current
    const ctx = c?.getContext('2d')
    if (!c || !ctx) return
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, c.width, c.height)
    const dpr = window.devicePixelRatio || 1
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    const paper = getComputedStyle(c).getPropertyValue('--bg').trim() || '#fff'
    for (const s of marks.current) drawMark(ctx, s, paper)
    if (drawing.current) drawMark(ctx, drawing.current, paper)
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
    marks.current = []
    drawing.current = null
    redraw()
  }, [clearKey, redraw])

  // Geri al (Ctrl+Z): son çizgi ya da yazı gider
  useEffect(() => {
    if (undoKey === 0) return
    marks.current.pop()
    redraw()
  }, [undoKey, redraw])

  useEffect(() => {
    if (editing) input.current?.focus()
  }, [editing])

  const point = (e: React.PointerEvent): [number, number] => {
    const r = canvas.current!.getBoundingClientRect()
    return [e.clientX - r.left, e.clientY - r.top]
  }

  // Yazıyı tuvale geçir (bir kez; boşsa hiçbir şey)
  const finish = (ed: Editing, text: string) => {
    const done = marks.current.some((m) => m.tool === 'text' && m.id === ed.id)
    if (!done && text.trim() && ed.slide === clearKey) {
      marks.current.push({ tool: 'text', id: ed.id, x: ed.x, y: ed.y, text, ink: ed.ink })
      redraw()
    }
    setEditing((cur) => (cur?.id === ed.id ? null : cur))
  }

  const open = editing && editing.slide === clearKey ? editing : null

  return (
    <>
      <canvas
        ref={canvas}
        className={`drawlayer ${tool ? `is-on drawlayer--${tool}` : ''}`}
        onMouseDown={(e) => tool === 'text' && e.preventDefault()}
        onPointerDown={(e) => {
          if (!tool) return
          if (tool === 'text') {
            e.preventDefault()
            if (open) finish(open, draft)
            const [x, y] = point(e)
            setDraft('')
            setEditing({ id: nextId.current++, x, y, ink, slide: clearKey })
            return
          }
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
          if (drawing.current) marks.current.push(drawing.current)
          drawing.current = null
        }}
        onPointerCancel={() => {
          drawing.current = null
          redraw()
        }}
        aria-hidden="true"
      />
      {open && (
        <input
          key={open.id}
          ref={input}
          className="drawtext"
          style={{
            left: open.x - PAD - BORDER,
            top: open.y - BOX_H / 2,
            height: BOX_H,
            width: `calc(${Math.max(3, draft.length + 1)}ch + ${2 * (PAD + BORDER)}px)`,
            padding: `0 ${PAD}px`,
            borderWidth: BORDER,
            color: INK[open.ink],
            font: TEXT_FONT,
          }}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') finish(open, draft)
            else if (e.key === 'Escape') finish(open, '')
            else return
            e.preventDefault()
            e.stopPropagation()
          }}
          onBlur={() => finish(open, draft)}
          dir="auto"
          autoComplete="off"
          spellCheck={false}
          aria-label="Text on the slide"
        />
      )}
    </>
  )
}
