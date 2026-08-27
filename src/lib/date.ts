export function toDate(value: string) {
  const [year, month, day] = value.split('-').map(Number)
  return new Date(year, month - 1, day)
}

export function formatDate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function addDays(date: Date, amount: number) {
  const next = new Date(date)
  next.setDate(next.getDate() + amount)
  return next
}

export function diffDays(start: Date, end: Date) {
  const dayMs = 24 * 60 * 60 * 1000
  const utcStart = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate())
  const utcEnd = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate())
  return Math.round((utcEnd - utcStart) / dayMs)
}

export function today() {
  return formatDate(new Date())
}

export function daysAgo(amount: number) {
  return formatDate(addDays(new Date(), -amount))
}

export function startOfYear() {
  const now = new Date()
  return formatDate(new Date(now.getFullYear(), 0, 1))
}

/** The machine's own UTC offset, formatted the way Git wants it. */
export function localTimezoneOffset() {
  const minutes = -new Date().getTimezoneOffset()
  const sign = minutes < 0 ? '-' : '+'
  const absolute = Math.abs(minutes)
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0')
  const rest = String(absolute % 60).padStart(2, '0')
  return `${sign}${hours}:${rest}`
}

export const TIMEZONES = [
  '-11:00', '-10:00', '-09:00', '-08:00', '-07:00', '-06:00', '-05:00', '-04:00',
  '-03:00', '-02:00', '-01:00', '+00:00', '+01:00', '+02:00', '+03:00', '+03:30',
  '+04:00', '+05:00', '+05:30', '+06:00', '+07:00', '+08:00', '+09:00', '+09:30',
  '+10:00', '+11:00', '+12:00', '+13:00',
]
