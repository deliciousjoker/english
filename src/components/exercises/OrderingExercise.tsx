import { useMemo, useState } from 'react'
import type { OrderingExercise } from '../../content/schema'
import { seededShuffle } from '../../lib/text'
import { Icon } from '../ui/Icon'
import { ExerciseShell, useReport } from './ExerciseShell'

/** Satırları yukarı/aşağı okla doğru sıraya getir (dokunmatik ekranda sürüklemekten daha kolay). */
export function OrderingExerciseView({ section, id, index }: { section: OrderingExercise; id: string; index: number }) {
  const n = section.items.length
  const initial = useMemo(() => seededShuffle([...Array(n).keys()], id + section.items.join()), [n, id, section.items])
  const [order, setOrder] = useState<number[]>(initial)
  const [checked, setChecked] = useState(false)
  const report = useReport(id)

  const correct = order.filter((k, pos) => k === pos).length

  const move = (pos: number, dir: -1 | 1) => {
    const to = pos + dir
    if (to < 0 || to >= n) return
    setChecked(false)
    setOrder((prev) => {
      const next = [...prev]
      ;[next[pos], next[to]] = [next[to], next[pos]]
      return next
    })
  }

  return (
    <ExerciseShell
      section={section}
      id={id}
      index={index}
      score={checked ? { correct, total: n } : null}
      onCheck={() => {
        setChecked(true)
        report(correct, n)
      }}
      onShow={() => {
        setOrder([...Array(n).keys()])
        setChecked(true)
      }}
      onReset={() => {
        setOrder(initial)
        setChecked(false)
      }}
    >
      <ol className="sortable">
        {order.map((k, pos) => (
          <li key={k} className={`sortable__row ${checked ? (k === pos ? 'is-correct' : 'is-wrong') : ''}`}>
            <span className="sortable__pos">{pos + 1}</span>
            <span className="sortable__text">{section.items[k]}</span>
            <span className="sortable__moves">
              <button type="button" className="iconbtn" onClick={() => move(pos, -1)} disabled={pos === 0} aria-label="Move up">
                <Icon name="up" size={18} />
              </button>
              <button type="button" className="iconbtn" onClick={() => move(pos, 1)} disabled={pos === n - 1} aria-label="Move down">
                <Icon name="down" size={18} />
              </button>
            </span>
          </li>
        ))}
      </ol>
    </ExerciseShell>
  )
}
