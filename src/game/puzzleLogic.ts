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

/**
 * Returns the active puzzle date string (YYYY-MM-DD) based on the daily send cron schedule.
 * Switches over to the new day's puzzle exactly `leadTimeMinutes` (default: 5) minutes
 * before the scheduled daily send cron.
 *
 * For Cloudflare cron "0 15 * * *" (15:00 UTC), switchover occurs at 14:55 UTC:
 * - Before 14:55 UTC: resolves to previous day's puzzle date.
 * - At or after 14:55 UTC: resolves to today's new puzzle date.
 */
export function getPuzzleDateForSendCron(
  now: Date = new Date(),
  cronStr: string = '0 15 * * *',
  leadTimeMinutes: number = 5
): string {
  const { minute, hour } = parseCronTime(cronStr)
  const switchoverOffsetMs = ((hour * 60 + minute) - leadTimeMinutes) * 60 * 1000
  const effectiveTime = new Date(now.getTime() - switchoverOffsetMs)
  return effectiveTime.toISOString().slice(0, 10)
}

export const LAUNCH_DATE = '2026-09-28'
export const DEV_PUZZLE_OFFSET = 42

/**
 * Convenience helper to get the active puzzle based on the daily send cron switchover time.
 */
export function getSendDailyPuzzle(
  now: Date = new Date(),
  cronStr: string = '0 15 * * *',
  leadTimeMinutes: number = 5,
  options?: { isDev?: boolean }
): DailyPuzzle {
  const dateStr = getPuzzleDateForSendCron(now, cronStr, leadTimeMinutes)
  return getDailyPuzzle(dateStr, options)
}

export function getDailyPuzzle(dateStr?: string, options?: { isDev?: boolean }): DailyPuzzle {
  const targetDate = dateStr || getPuzzleDateForSendCron()

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

  // Calculate days since launch date (2026-09-28)
  const [ty, tm, td] = targetDate.split('-').map(Number)
  const [ly, lm, ld] = LAUNCH_DATE.split('-').map(Number)
  const targetUtc = Date.UTC(ty, tm - 1, td)
  const launchUtc = Date.UTC(ly, lm - 1, ld)
  const daysSinceLaunch = Math.round((targetUtc - launchUtc) / 86400000)

  // Dev testers prescreen puzzles 42 days in advance (Puzzle #43 "DIGEST" on Sept 28 launch, #44 tomorrow, etc.)
  const offset = options?.isDev ? DEV_PUZZLE_OFFSET : 0
  const puzzleIndex = Math.abs(daysSinceLaunch + offset) % PUZZLES.length
  const basePuzzle = PUZZLES[puzzleIndex]

  return {
    ...basePuzzle,
    date: targetDate
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
