// Helpers to compute the "Mes en Curso" period given a configurable start day (1-31).
// Period spans from `startDay` of one month to the day before `startDay` of the next month.
// If a target month doesn't have `startDay` (e.g. 31 in February), it clamps to that month's last day.

const clampDay = (year: number, monthIndex: number, day: number): number => {
  const lastDay = new Date(year, monthIndex + 1, 0).getDate()
  return Math.min(day, lastDay)
}

const ymd = (d: Date): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

export interface PeriodRange {
  start: Date
  end: Date
  startStr: string // YYYY-MM-DD inclusive
  endStr: string   // YYYY-MM-DD inclusive
  label: string
}

/**
 * Given a reference date (defaults to today) and a configured start day,
 * returns the current "Mes en Curso" period.
 */
export function getMesEnCursoPeriod(startDay: number, ref: Date = new Date()): PeriodRange {
  const safeStartDay = Math.min(31, Math.max(1, Math.floor(startDay) || 1))
  const refY = ref.getFullYear()
  const refM = ref.getMonth()
  const refD = ref.getDate()

  // Determine the start date: most recent occurrence of safeStartDay that is <= today
  let startY = refY
  let startM = refM
  let startD = clampDay(startY, startM, safeStartDay)
  if (refD < startD) {
    // Period started in the previous month
    startM -= 1
    if (startM < 0) {
      startM = 11
      startY -= 1
    }
    startD = clampDay(startY, startM, safeStartDay)
  }

  // End date: day before the start day of the following month
  let nextY = startY
  let nextM = startM + 1
  if (nextM > 11) {
    nextM = 0
    nextY += 1
  }
  const nextStartD = clampDay(nextY, nextM, safeStartDay)
  // End is the day before next start
  const end = new Date(nextY, nextM, nextStartD)
  end.setDate(end.getDate() - 1)
  end.setHours(23, 59, 59, 999)

  const start = new Date(startY, startM, startD, 0, 0, 0, 0)

  const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()
  const label = sameMonth
    ? `${monthNames[start.getMonth()]} ${start.getFullYear()}`
    : `${start.getDate()} ${monthNames[start.getMonth()]} – ${end.getDate()} ${monthNames[end.getMonth()]} ${end.getFullYear()}`

  return {
    start,
    end,
    startStr: ymd(start),
    endStr: ymd(end),
    label,
  }
}

export const isDateInRange = (dateStr: string, range: PeriodRange): boolean => {
  // dateStr in YYYY-MM-DD; range.startStr / endStr inclusive
  return dateStr >= range.startStr && dateStr <= range.endStr
}
