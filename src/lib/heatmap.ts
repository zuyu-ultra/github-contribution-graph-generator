import { addDays, diffDays, formatDate, toDate } from './date'
import { textPixels, textWidthInWeeks } from './font'

export type Level = 0 | 1 | 2 | 3 | 4
export type Heatmap = Record<string, Level>
export type Pattern = 'natural' | 'dense' | 'weekday' | 'wave' | 'ramp' | 'clear'

export interface DayCell {
  date: string
  dayIndex: number
  weekIndex: number
  inRange: boolean
}

export interface Grid {
  cells: DayCell[]
  weeks: number
  /** weekIndex -> month number, only for the week a month starts in. */
  monthMarks: Array<{ weekIndex: number; month: number; year: number }>
}

export const MAX_DAYS = 366

export const LEVEL_COLORS = {
  light: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
  dark: ['#20262c', '#0e4429', '#006d32', '#26a641', '#39d353'],
} as const

function hashDate(value: string) {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return Math.abs(hash >>> 0)
}

function levelForPattern(pattern: Pattern, date: Date, index: number, total: number): Level {
  const weekday = date.getDay()
  const noise = hashDate(formatDate(date))

  switch (pattern) {
    case 'clear':
      return 0
    case 'dense':
      return (noise % 9 === 0 ? 2 : 3 + (noise % 2)) as Level
    case 'weekday': {
      if (weekday === 0 || weekday === 6) return 0
      const roll = noise % 100
      if (roll < 12) return 0
      if (roll < 45) return 1
      if (roll < 76) return 2
      if (roll < 93) return 3
      return 4
    }
    case 'wave': {
      const wave = Math.sin(index / 7.2) + Math.sin(index / 19)
      return Math.max(0, Math.min(4, Math.round(2.2 + wave * 1.2))) as Level
    }
    case 'ramp': {
      const progress = total > 0 ? index / total : 0
      const target = progress * 4.4 + (noise % 100) / 100 - 0.5
      return Math.max(0, Math.min(4, Math.round(target))) as Level
    }
    case 'natural':
    default: {
      // Mostly quiet weekends, a scattering of days off, and few heavy days:
      // the shape a real year tends to have.
      if (weekday === 0 || weekday === 6) return (noise % 5 === 0 ? 1 : 0) as Level
      const roll = noise % 100
      if (roll < 28) return 0
      if (roll < 62) return 1
      if (roll < 84) return 2
      if (roll < 96) return 3
      return 4
    }
  }
}

export function buildPattern(pattern: Pattern, start: string, end: string): Heatmap {
  const result: Heatmap = {}
  const startDate = toDate(start)
  const total = Math.max(0, diffDays(startDate, toDate(end)))
  for (let index = 0; index <= total; index += 1) {
    const date = addDays(startDate, index)
    result[formatDate(date)] = levelForPattern(pattern, date, index, total)
  }
  return result
}

/**
 * The days the date range currently covers. The stored map is never trimmed —
 * narrowing the range and widening it again has to give the drawing back.
 */
export function clip(map: Heatmap, start: string, end: string): Heatmap {
  const result: Heatmap = {}
  const startDate = toDate(start)
  const total = Math.max(0, diffDays(startDate, toDate(end)))
  for (let index = 0; index <= total; index += 1) {
    const key = formatDate(addDays(startDate, index))
    result[key] = map[key] ?? 0
  }
  return result
}

export function buildGrid(start: string, end: string): Grid {
  const startDate = toDate(start)
  const endDate = toDate(end)
  const gridStart = addDays(startDate, -startDate.getDay())
  const gridEnd = addDays(endDate, 6 - endDate.getDay())
  const cells: DayCell[] = []
  const monthMarks: Grid['monthMarks'] = []
  const total = diffDays(gridStart, gridEnd)

  for (let index = 0; index <= total; index += 1) {
    const current = addDays(gridStart, index)
    const weekIndex = Math.floor(index / 7)
    cells.push({
      date: formatDate(current),
      dayIndex: current.getDay(),
      weekIndex,
      inRange: current >= startDate && current <= endDate,
    })
    // A month label belongs to the week containing its first days.
    if (current.getDate() <= 7 && current.getDay() === 0) {
      const last = monthMarks[monthMarks.length - 1]
      if (!last || last.month !== current.getMonth()) {
        monthMarks.push({ weekIndex, month: current.getMonth(), year: current.getFullYear() })
      }
    }
  }

  return { cells, weeks: Math.floor(total / 7) + 1, monthMarks }
}

export function levelToCount(level: Level, min: number, max: number) {
  if (level === 0) return 0
  if (max <= min) return Math.max(1, min)
  return Math.round(min + ((level - 1) / 3) * (max - min))
}

export function countPerLevel(min: number, max: number) {
  return ([1, 2, 3, 4] as Level[]).map((level) => levelToCount(level, min, max))
}

export function summarize(map: Heatmap, min: number, max: number) {
  let activeDays = 0
  let commits = 0
  Object.values(map).forEach((level) => {
    if (!level) return
    activeDays += 1
    commits += levelToCount(level, min, max)
  })
  return { activeDays, commits, days: Object.keys(map).length }
}

export function maxTextLength(weeks: number) {
  return Math.max(0, Math.floor((weeks + 1) / 6))
}

/**
 * Paints text onto a copy of the map. `offset` is the starting week column.
 * The letters' bounding box is cleared first — text over an existing pattern
 * is unreadable, which is the one thing this tool exists to avoid.
 */
export function stampText(
  map: Heatmap,
  grid: Grid,
  text: string,
  level: Level,
  offset: number,
): Heatmap {
  if (!text.length) return map
  const byPosition = new Map<string, DayCell>()
  grid.cells.forEach((cell) => byPosition.set(`${cell.weekIndex}:${cell.dayIndex}`, cell))

  const next = { ...map }
  const width = textWidthInWeeks(text)
  for (let column = offset; column < offset + width; column += 1) {
    for (let row = 0; row < 7; row += 1) {
      const cell = byPosition.get(`${column}:${row}`)
      if (cell?.inRange) next[cell.date] = 0
    }
  }
  textPixels(text).forEach(([column, row]) => {
    const cell = byPosition.get(`${column + offset}:${row}`)
    if (cell?.inRange) next[cell.date] = level
  })
  return next
}

export function centerOffset(text: string, weeks: number) {
  return Math.max(0, Math.round((weeks - textWidthInWeeks(text)) / 2))
}

/** Samples an image down to the grid and converts luminance into levels. */
export function sampleImage(
  image: HTMLImageElement,
  map: Heatmap,
  grid: Grid,
  options: { invert: boolean; threshold: number },
): Heatmap {
  const canvas = document.createElement('canvas')
  canvas.width = grid.weeks
  canvas.height = 7
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) return map

  context.fillStyle = '#ffffff'
  context.fillRect(0, 0, canvas.width, canvas.height)
  const scale = Math.min(canvas.width / image.width, canvas.height / image.height)
  const width = image.width * scale
  const height = image.height * scale
  context.drawImage(image, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
  const next = { ...map }
  grid.cells.forEach((cell) => {
    if (!cell.inRange) return
    const pixelIndex = (cell.dayIndex * canvas.width + cell.weekIndex) * 4
    const red = pixels[pixelIndex]
    const green = pixels[pixelIndex + 1]
    const blue = pixels[pixelIndex + 2]
    const alpha = pixels[pixelIndex + 3] / 255
    const luminance = (0.2126 * red + 0.7152 * green + 0.0722 * blue) / 255
    const raw = options.invert ? luminance : 1 - luminance
    const strength = raw * alpha
    next[cell.date] = strength < options.threshold
      ? 0
      : (Math.max(1, Math.min(4, Math.ceil(strength * 4))) as Level)
  })
  return next
}

/** Compact form for localStorage: one digit per day from the start date. */
export function encodeMap(map: Heatmap, start: string, end: string) {
  const startDate = toDate(start)
  const total = Math.max(0, diffDays(startDate, toDate(end)))
  let out = ''
  for (let index = 0; index <= total; index += 1) {
    out += String(map[formatDate(addDays(startDate, index))] ?? 0)
  }
  return out
}

export function decodeMap(encoded: string, start: string): Heatmap {
  const startDate = toDate(start)
  const map: Heatmap = {}
  Array.from(encoded).forEach((digit, index) => {
    const level = Number(digit)
    if (Number.isNaN(level) || level < 0 || level > 4) return
    map[formatDate(addDays(startDate, index))] = level as Level
  })
  return map
}

/**
 * A one-off random year. Unlike the presets, which hash the date and so always
 * produce the same picture, this rolls fresh every time. A slow random walk
 * gives it busy stretches and quiet ones instead of uniform static.
 */
export function buildRandom(start: string, end: string): Heatmap {
  const result: Heatmap = {}
  const startDate = toDate(start)
  const total = Math.max(0, diffDays(startDate, toDate(end)))

  // Each roll gets its own personality.
  const baseActivity = 0.3 + Math.random() * 0.45
  const weekendDrop = 0.25 + Math.random() * 0.65
  const heavyShare = 0.1 + Math.random() * 0.35
  let momentum = Math.random()

  for (let index = 0; index <= total; index += 1) {
    const date = addDays(startDate, index)
    const weekday = date.getDay()
    const isWeekend = weekday === 0 || weekday === 6

    momentum = Math.min(1, Math.max(0, momentum + (Math.random() - 0.5) * 0.22))
    const chance = baseActivity * (0.45 + momentum) * (isWeekend ? 1 - weekendDrop : 1)

    let level: Level = 0
    if (Math.random() < chance) {
      level = Math.random() < heavyShare
        ? ((3 + Math.round(Math.random())) as Level)
        : ((1 + Math.round(Math.random())) as Level)
    }
    result[formatDate(date)] = level
  }

  return result
}

/** What a first-time visitor sees: a plausible year with the name written into it. */
export function buildDefaultDrawing(start: string, end: string, word: string): Heatmap {
  const grid = buildGrid(start, end)
  const base = buildPattern('natural', start, end)
  return stampText(base, grid, word, 4, centerOffset(word, grid.weeks))
}
