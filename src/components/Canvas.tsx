import { useMemo, useRef, useState } from 'react'
import type { CSSProperties, PointerEvent as ReactPointerEvent } from 'react'
import type { Copy } from '../i18n'
import type { Grid, Heatmap, Level } from '../lib/heatmap'
import { LEVEL_COLORS, levelToCount } from '../lib/heatmap'

interface Props {
  copy: Copy
  grid: Grid
  map: Heatmap
  minCommits: number
  maxCommits: number
  theme: 'light' | 'dark'
  brush: Level
  onStrokeStart: () => void
  onPaint: (date: string, level: Level) => void
}

interface Tip {
  date: string
  x: number
  y: number
}

export function Canvas({
  copy, grid, map, minCommits, maxCommits, theme, brush, onStrokeStart, onPaint,
}: Props) {
  const [tip, setTip] = useState<Tip | null>(null)
  const painting = useRef(false)
  const stageRef = useRef<HTMLDivElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const colors = LEVEL_COLORS[theme]

  // Drop month labels that would collide with the previous one.
  const monthLabels = useMemo(
    () => grid.monthMarks.filter((mark, index) =>
      index === 0 || mark.weekIndex > grid.monthMarks[index - 1].weekIndex + 2),
    [grid.monthMarks],
  )

  /**
   * Hit-test rather than relying on per-cell enter events: once a pointer is
   * captured, every move reports the grid as its target, and touch captures
   * implicitly. Coordinates are the only thing that stays truthful.
   */
  const dateAt = (clientX: number, clientY: number) => {
    const element = document.elementFromPoint(clientX, clientY) as HTMLElement | null
    const date = element?.dataset?.date
    return date && element?.dataset.inrange === 'true' ? date : null
  }

  const showTip = (date: string | null, clientX: number, clientY: number) => {
    if (!date) { setTip(null); return }
    const bounds = stageRef.current?.getBoundingClientRect()
    if (bounds) setTip({ date, x: clientX - bounds.left, y: clientY - bounds.top })
  }

  const handlePointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    const date = dateAt(event.clientX, event.clientY)
    if (!date) return
    event.preventDefault()
    painting.current = true
    onStrokeStart()
    onPaint(date, event.altKey ? 0 : brush)
    showTip(date, event.clientX, event.clientY)
    // Capture keeps the stroke alive past the grid's edges; losing it is survivable.
    try {
      gridRef.current?.setPointerCapture(event.pointerId)
    } catch {
      // The pointer is already gone — the stroke simply ends at the boundary.
    }
  }

  const handlePointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    const date = dateAt(event.clientX, event.clientY)
    showTip(date, event.clientX, event.clientY)
    if (painting.current && date) onPaint(date, event.altKey ? 0 : brush)
  }

  const stopPainting = (event: ReactPointerEvent<HTMLDivElement>) => {
    painting.current = false
    try {
      if (gridRef.current?.hasPointerCapture(event.pointerId)) {
        gridRef.current.releasePointerCapture(event.pointerId)
      }
    } catch {
      // Already released.
    }
  }

  const tipLevel = tip ? map[tip.date] ?? 0 : 0
  const tipCount = levelToCount(tipLevel, minCommits, maxCommits)

  return (
    <div className="canvas-stage" ref={stageRef}>
      <div className="canvas-scroll">
        <div className="canvas-inner" style={{ '--weeks': grid.weeks } as CSSProperties}>
          <div className="month-row" aria-hidden="true">
            {monthLabels.map((mark) => (
              <span key={`${mark.year}-${mark.month}`} style={{ gridColumnStart: mark.weekIndex + 1 }}>
                {copy.monthShort[mark.month]}
              </span>
            ))}
          </div>

          <div className="weekday-column" aria-hidden="true">
            {[1, 3, 5].map((day) => (
              <span key={day} style={{ gridRowStart: day + 1 }}>{copy.weekdayShort[day]}</span>
            ))}
          </div>

          <div
            className="cell-grid"
            ref={gridRef}
            role="grid"
            aria-label={copy.stepDraw}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={stopPainting}
            onPointerCancel={stopPainting}
            onPointerLeave={() => setTip(null)}
          >
            {grid.cells.map((cell) => {
              const level = map[cell.date] ?? 0
              return (
                <div
                  key={cell.date}
                  role="gridcell"
                  data-date={cell.date}
                  data-inrange={cell.inRange}
                  className={`cell${cell.inRange ? '' : ' outside'}${tip?.date === cell.date ? ' focused' : ''}`}
                  style={{
                    gridColumn: cell.weekIndex + 1,
                    gridRow: cell.dayIndex + 1,
                    background: cell.inRange ? colors[level] : 'transparent',
                  }}
                  aria-label={cell.inRange
                    ? `${cell.date}, ${copy.levelLabels[level]}, ${copy.commitsOnDate(levelToCount(level, minCommits, maxCommits))}`
                    : undefined}
                />
              )
            })}
          </div>
        </div>
      </div>

      {tip && (
        <div className="cell-tip" style={{ left: tip.x, top: tip.y }} role="status">
          <strong>{tipLevel ? copy.commitsOnDate(tipCount) : copy.noCommitsOnDate}</strong>
          <span>{tip.date}</span>
        </div>
      )}

      <div className="legend">
        <span>{copy.less}</span>
        {colors.map((color, level) => (
          <i key={color} style={{ background: color }} title={copy.levelLabels[level]} />
        ))}
        <span>{copy.more}</span>
      </div>
    </div>
  )
}
