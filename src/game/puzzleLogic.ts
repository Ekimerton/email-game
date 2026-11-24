import { PUZZLES, type DailyPuzzle } from './puzzles'

export { PUZZLES, type DailyPuzzle }

export function getTodayDateString(timeZone: string = 'America/New_York'): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  })
  return formatter.format(new Date())
}

/**
 * Parses minute and hour from standard 5-field cron expression (e.g. '0 15 * * *').
 * Defaults to 0 minute and 15 hour (15:00 UTC) if unparseable.
 */
export function parseCronTime(cronStr: string = '0 15 * * *'): { minute: number; hour: number } {
  const parts = cronStr.trim().split(/\s+/)
  const minute = parseInt(parts[0], 10)
  const hour = parseInt(parts[1], 10)
  return {
    minute: isNaN(minute) ? 0 : minute,
    hour: isNaN(hour) ? 15 : hour,
  }
}

export const LAUNCH_DATE = '2026-09-28'
export const WEEKDAY_SCHEDULE_START_DATE = '2026-11-28'
export const WEEKDAY_LAST_DAILY_DATE = '2026-11-27'
export const WEEKDAY_LAST_DAILY_INDEX = 60
export const DEV_PUZZLE_OFFSET = 42

export function isWeekendDateString(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 || day === 6
}

/**
 * Starting on WEEKDAY_SCHEDULE_START_DATE (Sat 2026-11-28), Inboxed switched to weekdays only (Mon-Fri).
 * Weekend dates on or after that date roll back to Friday's active puzzle date.
 */
export function rollBackToWeekday(dateStr: string): string {
  if (!dateStr || dateStr < WEEKDAY_SCHEDULE_START_DATE || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return dateStr
  }
  const [y, m, d] = dateStr.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d)
  const day = new Date(utc).getUTCDay()
  if (day === 6) {
    return new Date(utc - 86400000).toISOString().slice(0, 10)
  }
  if (day === 0) {
    return new Date(utc - 2 * 86400000).toISOString().slice(0, 10)
  }
  return dateStr
}

export function getRawPuzzleDateForSendCron(
  now: Date = new Date(),
  cronStr: string = '0 15 * * 1-5',
  leadTimeMinutes: number = 5
): string {
  const { minute, hour } = parseCronTime(cronStr)
  const switchoverOffsetMs = ((hour * 60 + minute) - leadTimeMinutes) * 60 * 1000
  const effectiveTime = new Date(now.getTime() - switchoverOffsetMs)
  return effectiveTime.toISOString().slice(0, 10)
}

/**
 * Returns the active puzzle date string (YYYY-MM-DD) based on the daily send cron schedule.
 * Switches over to the new day's puzzle exactly `leadTimeMinutes` (default: 5) minutes
 * before the scheduled send cron, and rolls weekend dates (from 2026-11-28 onward) back to Friday.
 */
export function getPuzzleDateForSendCron(
  now: Date = new Date(),
  cronStr: string = '0 15 * * 1-5',
  leadTimeMinutes: number = 5
): string {
  return rollBackToWeekday(getRawPuzzleDateForSendCron(now, cronStr, leadTimeMinutes))
}

/**
 * Convenience helper to get the active puzzle based on the send cron switchover time.
 */
export function getSendDailyPuzzle(
  now: Date = new Date(),
  cronStr: string = '0 15 * * 1-5',
  leadTimeMinutes: number = 5,
  options?: { isDev?: boolean }
): DailyPuzzle {
  const dateStr = getPuzzleDateForSendCron(now, cronStr, leadTimeMinutes)
  return getDailyPuzzle(dateStr, options)
}

export function getDailyPuzzle(dateOrPuzzleId?: string | number, options?: { isDev?: boolean }): DailyPuzzle {
  if (dateOrPuzzleId !== undefined && dateOrPuzzleId !== null && dateOrPuzzleId !== '') {
    const raw = String(dateOrPuzzleId).trim()
    // Check if it's a puzzle ID / number (e.g. 1, "1", "#1", 43) rather than a date string with hyphens
    if (/^#?\d+$/.test(raw) && !raw.includes('-')) {
      const cleanId = raw.replace('#', '')
      const found = getPuzzleById(cleanId)
      if (found) {
        const targetDate = getDateForPuzzleId(cleanId, options)
        return {
          ...found,
          date: targetDate,
        }
      }
    }
  }

  const targetDate = (dateOrPuzzleId && /^\d{4}-\d{2}-\d{2}$/.test(String(dateOrPuzzleId)))
    ? String(dateOrPuzzleId)
    : getPuzzleDateForSendCron()

  // For historical dates before the official launch date ('2026-09-28'):
  // Retain exact historical behavior and deterministic hash fallback for tests.
  if (targetDate < LAUNCH_DATE) {
    const historicalPuzzle = PUZZLES.find(p => p.date === targetDate)
    if (historicalPuzzle) return historicalPuzzle

    const idx = Math.abs(hashCode(targetDate)) % PUZZLES.length
    return {
      ...PUZZLES[idx],
      date: targetDate
    }
  }

  const effectiveDate = rollBackToWeekday(targetDate)
  const [ty, tm, td] = effectiveDate.split('-').map(Number)
  const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number)
  const effectiveUtc = Date.UTC(ty, tm - 1, td)
  const launchUtc = Date.UTC(ly, lm - 1, ld)

  let baseIndex: number
  if (effectiveDate <= WEEKDAY_LAST_DAILY_DATE) {
    baseIndex = Math.round((effectiveUtc - launchUtc) / 86400000)
  } else {
    const [wy, wm, wd] = WEEKDAY_LAST_DAILY_DATE.split('-').map(Number)
    const lastDailyUtc = Date.UTC(wy, wm - 1, wd)
    const diffFromFri = Math.round((effectiveUtc - lastDailyUtc) / 86400000)
    const weekdaysAfterFri = Math.floor(diffFromFri / 7) * 5 + Math.max(0, (diffFromFri % 7) - 2)
    baseIndex = WEEKDAY_LAST_DAILY_INDEX + weekdaysAfterFri
  }

  // Dev testers prescreen puzzles 42 puzzles in advance
  const offset = options?.isDev ? DEV_PUZZLE_OFFSET : 0
  const puzzleIndex = Math.abs(baseIndex + offset) % PUZZLES.length
  const basePuzzle = PUZZLES[puzzleIndex]

  return {
    ...basePuzzle,
    date: effectiveDate
  }
}

export function formatPrettyDate(dateStr: string): string {
  if (!dateStr) return ''
  const parts = dateStr.split('-')
  if (parts.length !== 3) return dateStr
  const year = Number(parts[0])
  const month = Number(parts[1])
  const day = Number(parts[2])
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec']
  if (!year || !month || !day || month < 1 || month > 12) return dateStr
  return `${months[month - 1]} ${day}, ${year}`
}

export function hashCode(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = (hash << 5) - hash + char
    hash |= 0
  }
  return hash
}

export function getPuzzleById(id: string | number): DailyPuzzle | undefined {
  const cleanId = String(id).replace('#', '').trim()
  return PUZZLES.find(p => p.id === cleanId)
}

export function getPuzzleDateForSendCronLegacy(
  now: Date = new Date(),
  cronStr: string = '0 15 * * *',
  leadTimeMinutes: number = 5
): string {
  return getRawPuzzleDateForSendCron(now, cronStr, leadTimeMinutes)
}

export function parseCronTimeOrDefault(cronStr: string = '0 15 * * 1-5'): { minute: number; hour: number } {
  return parseCronTime(cronStr)
}

export function getDateForPuzzleId(id: string | number, options?: { isDev?: boolean }): string {
  const cleanId = typeof id === 'number' ? id : parseInt(String(id).replace('#', '').trim(), 10)
  if (isNaN(cleanId) || cleanId < 1) return LAUNCH_DATE

  const offset = options?.isDev ? DEV_PUZZLE_OFFSET : 0
  const effectiveIndex = cleanId - 1 - offset

  if (effectiveIndex <= WEEKDAY_LAST_DAILY_INDEX) {
    const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number)
    const launchUtc = Date.UTC(ly, lm - 1, ld)
    const targetUtc = launchUtc + (effectiveIndex * 86400000)
    return new Date(targetUtc).toISOString().slice(0, 10)
  }

  const weekdaysAfterFri = effectiveIndex - WEEKDAY_LAST_DAILY_INDEX
  const fullWeeks = Math.floor((weekdaysAfterFri - 1) / 5)
  const dayInWeek = ((weekdaysAfterFri - 1) % 5) + 1
  const calendarDaysAfterFri = fullWeeks * 7 + dayInWeek + 2

  const [wy, wm, ld] = WEEKDAY_LAST_DAILY_DATE.split('-').map(Number)
  const lastDailyUtc = Date.UTC(wy, wm - 1, ld)
  return new Date(lastDailyUtc + (calendarDaysAfterFri * 86400000)).toISOString().slice(0, 10)
}
