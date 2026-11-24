import { OAuth2Client } from 'google-auth-library'
import { extractEmailDomain, getLeaderboardDomain, kvGet, kvPut, withKeyLock, type StorageBackend } from '../core'
import type { UserSettings, SubscriberEntry } from '../core'
import { getDailyPuzzle, getPuzzleById, getDateForPuzzleId } from '../game'
import { getSubscribers } from './subscribers'
import { getDomainLeaderboard } from './leaderboard'

const client = new OAuth2Client()

export const COMMON_EMAIL_DOMAINS = new Set([
  'aol.com', 'att.net', 'comcast.net', 'gmail.com', 'googlemail.com', 'hotmail.com',
  'icloud.com', 'live.com', 'mac.com', 'mail.com', 'me.com', 'msn.com', 'outlook.com',
  'proton.me', 'protonmail.com', 'verizon.net', 'yahoo.com',
])

export function extractDomain(email: string): string {
  return extractEmailDomain(email)
}

// Display full uncensored email address in organization leaderboard
export function formatDisplayEmail(email: string): string {
  return email ? email.toLowerCase().trim() : 'Anonymous'
}

// User identification helper (supports AMP Google Auth ID Token OR dev query/body/header)
export async function getUserEmail(c: any, parsedBody?: Record<string, any>): Promise<string> {
  let emailParam = c.req.query('email') || c.req.header('x-user-email') || parsedBody?.['email']

  if (!emailParam) {
    const ampSourceOrigin = c.req.query('__amp_source_origin')
    if (ampSourceOrigin && ampSourceOrigin.includes('@') && !ampSourceOrigin.includes('amp@gmail.dev')) {
      emailParam = ampSourceOrigin
    }
  }

  if (!emailParam) {
    try {
      const body = await c.req.parseBody()
      emailParam = body['email'] as string
    } catch (_) { }
  }

  if (emailParam && typeof emailParam === 'string' && emailParam.includes('@')) {
    return emailParam.toLowerCase().trim()
  }

  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const ticket = await client.verifyIdToken({
        idToken: token,
      })
      const payload = ticket.getPayload()
      if (payload?.email) {
        return payload.email.toLowerCase().trim()
      }
    } catch (error) {
      console.warn('Token verification failed, falling back to default dev user:', error)
    }
  }

  return 'player@company.com'
}

export async function getUserSettings(kv: StorageBackend, email: string): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractDomain(cleanEmail)
  const userKey = `user:profile:${cleanEmail}`
  const existing = await kvGet(kv, userKey)
  if (existing) {
    return {
      email: existing.email || cleanEmail,
      domain: existing.domain || domain,
      showOnLeaderboard: typeof existing.showOnLeaderboard === 'boolean' ? existing.showOnLeaderboard : true,
      daysPlayed: existing.daysPlayed,
      playedDates: existing.playedDates,
      playedPuzzles: existing.playedPuzzles,
      submittedPuzzles: existing.submittedPuzzles,
      openedDates: existing.openedDates,
      openedPuzzles: existing.openedPuzzles,
      theme: existing.theme === 'dark' ? 'dark' : 'light',
      colorCombo: existing.colorCombo || 'amber-blue',
      primaryColor: existing.primaryColor,
      secondaryColor: existing.secondaryColor,
      leaderboardType: existing.leaderboardType,
      customLeaderboardId: existing.customLeaderboardId,
    }
  }

  return {
    email: cleanEmail,
    domain,
    showOnLeaderboard: true,
    theme: 'light',
    colorCombo: 'amber-blue',
  }
}

export async function updateUserSettings(kv: StorageBackend, settings: UserSettings): Promise<void> {
  const cleanEmail = settings.email.toLowerCase().trim()
  const key = `user:profile:${cleanEmail}`
  await withKeyLock(key, async () => {
    await kvPut(kv, key, settings)
  })
}

export async function recordUserOpen(
  kv: StorageBackend,
  email: string,
  puzzleOrDate?: string | number,
  options?: { isDev?: boolean }
): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const key = `user:profile:${cleanEmail}`
  return withKeyLock(key, async () => {
    const profile = await getUserSettings(kv, cleanEmail)
    const puzzle = getDailyPuzzle(puzzleOrDate, options)
    const puzzleId = String(puzzle.id)
    const dateStr = (options?.isDev && Number(puzzle.id) > 42)
      ? (getDateForPuzzleId(puzzleId, { isDev: true }) || puzzle.date)
      : puzzle.date

    let changed = false
    if (!profile.openedDates) {
      profile.openedDates = [dateStr]
      changed = true
    } else if (!profile.openedDates.includes(dateStr)) {
      profile.openedDates.push(dateStr)
      changed = true
    }

    if (!profile.openedPuzzles) {
      profile.openedPuzzles = [puzzleId]
      changed = true
    } else if (!profile.openedPuzzles.includes(puzzleId)) {
      profile.openedPuzzles.push(puzzleId)
      changed = true
    }

    if (changed) {
      await kvPut(kv, key, profile)
    }
    return profile
  })
}

export async function recordUserActivity(
  kv: StorageBackend,
  email: string,
  puzzleOrDate?: string | number
): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const key = `user:profile:${cleanEmail}`
  return withKeyLock(key, async () => {
    const profile = await getUserSettings(kv, cleanEmail)
    const puzzle = getDailyPuzzle(puzzleOrDate)
    const dateStr = puzzle.date
    const puzzleId = puzzle.id

    if (!profile.openedDates) {
      profile.openedDates = [dateStr]
    } else if (!profile.openedDates.includes(dateStr)) {
      profile.openedDates.push(dateStr)
    }

    if (!profile.openedPuzzles) {
      profile.openedPuzzles = [puzzleId]
    } else if (!profile.openedPuzzles.includes(puzzleId)) {
      profile.openedPuzzles.push(puzzleId)
    }

    if (!profile.playedDates) {
      profile.playedDates = [dateStr]
    } else if (!profile.playedDates.includes(dateStr)) {
      profile.playedDates.push(dateStr)
    }

    if (!profile.playedPuzzles) {
      profile.playedPuzzles = [puzzleId]
    } else if (!profile.playedPuzzles.includes(puzzleId)) {
      profile.playedPuzzles.push(puzzleId)
    }

    profile.daysPlayed = Math.max(profile.playedDates.length, profile.playedPuzzles.length)

    await kvPut(kv, key, profile)
    return profile
  })
}

export async function recordUserSubmission(
  kv: StorageBackend,
  email: string,
  puzzleOrDate?: string | number
): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const key = `user:profile:${cleanEmail}`
  return withKeyLock(key, async () => {
    const profile = await getUserSettings(kv, cleanEmail)
    const puzzle = getDailyPuzzle(puzzleOrDate)
    const dateStr = puzzle.date
    const puzzleId = puzzle.id

    if (!profile.openedDates) {
      profile.openedDates = [dateStr]
    } else if (!profile.openedDates.includes(dateStr)) {
      profile.openedDates.push(dateStr)
    }

    if (!profile.openedPuzzles) {
      profile.openedPuzzles = [puzzleId]
    } else if (!profile.openedPuzzles.includes(puzzleId)) {
      profile.openedPuzzles.push(puzzleId)
    }

    if (!profile.playedDates) {
      profile.playedDates = [dateStr]
    } else if (!profile.playedDates.includes(dateStr)) {
      profile.playedDates.push(dateStr)
    }

    if (!profile.playedPuzzles) {
      profile.playedPuzzles = [puzzleId]
    } else if (!profile.playedPuzzles.includes(puzzleId)) {
      profile.playedPuzzles.push(puzzleId)
    }

    if (!profile.submittedPuzzles) {
      profile.submittedPuzzles = [puzzleId]
    } else if (!profile.submittedPuzzles.includes(puzzleId)) {
      profile.submittedPuzzles.push(puzzleId)
    }

    profile.daysPlayed = Math.max(profile.playedDates.length, profile.playedPuzzles.length)

    await kvPut(kv, key, profile)
    return profile
  })
}

export async function getUserStreak(
  kv: StorageBackend,
  email: string,
  targetPuzzleId?: string | number
): Promise<number> {
  const cleanEmail = email.toLowerCase().trim()
  const settings = await getUserSettings(kv, cleanEmail)

  const playedNumbers = new Set<number>()
  for (const id of settings.playedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) playedNumbers.add(num)
  }
  for (const id of settings.submittedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) playedNumbers.add(num)
  }

  let currentTargetNum: number
  if (targetPuzzleId !== undefined && targetPuzzleId !== null && String(targetPuzzleId).trim() !== '') {
    currentTargetNum = parseInt(String(targetPuzzleId).replace('#', '').trim(), 10)
  } else {
    const today = getDailyPuzzle()
    currentTargetNum = parseInt(today.id, 10)
  }

  if (isNaN(currentTargetNum) || currentTargetNum < 1) return 0

  const didPlayPuzzle = async (checkNum: number): Promise<boolean> => {
    if (checkNum < 1) return false
    if (playedNumbers.has(checkNum)) {
      return true
    }

    const staticPuzzle = getPuzzleById(checkNum)
    if (staticPuzzle) {
      const targetDate = getDateForPuzzleId(String(checkNum)) || staticPuzzle.date
      const stateKey = `game:${targetDate}:${cleanEmail}`
      const st = await kvGet(kv, stateKey)
      if (st && (st.hasWon || st.guessCount > 0)) {
        playedNumbers.add(checkNum)
        return true
      }
      if (staticPuzzle.date !== targetDate) {
        const legacySt = await kvGet(kv, `game:${staticPuzzle.date}:${cleanEmail}`)
        if (legacySt && (legacySt.hasWon || legacySt.guessCount > 0)) {
          playedNumbers.add(checkNum)
          return true
        }
      }
    }

    const domain = extractDomain(cleanEmail)
    const lb = await getDomainLeaderboard(kv, domain, String(checkNum))
    if (lb && lb.some(e => e.email.toLowerCase() === cleanEmail)) {
      playedNumbers.add(checkNum)
      return true
    }

    return false
  }

  // If the target game wasn't played, current streak is 0
  if (!(await didPlayPuzzle(currentTargetNum))) {
    return 0
  }

  // Count backwards with 1 missed puzzle grace day forgiven per 5 puzzles (1 workweek)
  let streak = 0
  let checkNum = currentTargetNum
  let lastFreezeAt: number | null = null

  while (checkNum >= 1) {
    if (await didPlayPuzzle(checkNum)) {
      streak++
      checkNum--
    } else if (
      checkNum > 1 &&
      (lastFreezeAt === null || lastFreezeAt - checkNum >= 5) &&
      await didPlayPuzzle(checkNum - 1)
    ) {
      // Bridge a single missed puzzle without incrementing streak for the missed day
      lastFreezeAt = checkNum
      checkNum--
    } else {
      break
    }
  }

  return streak
}

export const INACTIVITY_WARNING_DAYS = 14
export const INACTIVITY_UNSUBSCRIBE_DAYS = 21
export const DEFAULT_PAUSE_DAYS = 14

export type SubscriberInactivityStatus = 'active' | 'warn' | 'warned' | 'unsubscribe'

/**
 * Returns true if the given YYYY-MM-DD date string falls on Saturday or Sunday (UTC).
 */
export function isWeekendDate(dateStr: string): boolean {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return false
  const [y, m, d] = dateStr.split('-').map(Number)
  const day = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
  return day === 0 || day === 6
}

/**
 * Adds a whole number of calendar days to a YYYY-MM-DD date string in UTC.
 */
export function addDaysToDateString(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  const utc = Date.UTC(y, m - 1, d) + days * 86400000
  return new Date(utc).toISOString().slice(0, 10)
}

/**
 * Returns true if the subscriber has an active pause covering targetDate (YYYY-MM-DD).
 * Emails automatically resume on the pausedUntil date itself (i.e. paused while targetDate < pausedUntil).
 */
export function isSubscriberPaused(subscriber: SubscriberEntry | undefined, targetDate: string): boolean {
  if (!subscriber?.pausedUntil || !targetDate) return false
  const pausedUntil = subscriber.pausedUntil.slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(pausedUntil)) return false
  return targetDate < pausedUntil
}

/**
 * Returns true if a subscriber should be skipped for daily puzzle delivery on targetDate
 * due to an active pause or weekday-only cadence on a weekend.
 */
export function shouldSkipSubscriberForDate(subscriber: SubscriberEntry | undefined, targetDate: string): boolean {
  if (!subscriber) return false
  if (isSubscriberPaused(subscriber, targetDate)) return true
  if (subscriber.emailFrequency === 'weekdays' && isWeekendDate(targetDate)) return true
  return false
}

function getGraceAnchorPuzzleNum(subscriber: SubscriberEntry | undefined, currentDate: string): number | null {
  if (!subscriber) return null
  const candidateDates: string[] = []

  if (subscriber.subscribedAt) {
    candidateDates.push(subscriber.subscribedAt.slice(0, 10))
  }
  if (subscriber.inactivityConfirmedAt) {
    candidateDates.push(subscriber.inactivityConfirmedAt.slice(0, 10))
  }
  if (subscriber.pausedUntil) {
    const resumeDate = subscriber.pausedUntil.slice(0, 10)
    if (/^\d{4}-\d{2}-\d{2}$/.test(resumeDate) && resumeDate <= currentDate) {
      candidateDates.push(resumeDate)
    }
  }

  let maxPuzzleNum: number | null = null
  for (const dateStr of candidateDates) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) continue
    const puzzle = getDailyPuzzle(dateStr)
    const num = parseInt(puzzle.id, 10)
    if (!isNaN(num) && (maxPuzzleNum === null || num > maxPuzzleNum)) {
      maxPuzzleNum = num
    }
  }
  return maxPuzzleNum
}

async function hasSubmissionInWindow(
  kv: StorageBackend,
  cleanEmail: string,
  currentPuzzleNum: number,
  windowDays: number,
  submittedNumbers: Set<number>
): Promise<boolean> {
  const startGame = Math.max(1, currentPuzzleNum - windowDays)
  for (let gameNum = currentPuzzleNum - 1; gameNum >= startGame; gameNum--) {
    if (submittedNumbers.has(gameNum)) {
      return true
    }
    const puzzle = getPuzzleById(gameNum)
    if (puzzle) {
      const targetDate = getDateForPuzzleId(String(gameNum)) || puzzle.date
      const stateKey = `game:${targetDate}:${cleanEmail}`
      const st = await kvGet(kv, stateKey)
      if (st && (st.hasWon || st.guessCount > 0 || st.hintsUsed > 0)) {
        return true
      }
      if (puzzle.date !== targetDate) {
        const legacySt = await kvGet(kv, `game:${puzzle.date}:${cleanEmail}`)
        if (legacySt && (legacySt.hasWon || legacySt.guessCount > 0 || legacySt.hintsUsed > 0)) {
          return true
        }
      }
    }
  }
  return false
}

/**
 * Evaluates a subscriber's inactivity status before dispatching currentPuzzleId:
 * - 'active': paused, within grace period, or submitted in the last 14 puzzles
 * - 'warn': missed 14..20 consecutive puzzles and hasn't been sent a check-in email for this streak yet
 * - 'warned': missed 14..20 consecutive puzzles and already received a check-in email for this streak
 * - 'unsubscribe': missed 21+ consecutive puzzles (outside grace period)
 */
export async function getSubscriberInactivityStatus(
  kv: StorageBackend,
  email: string,
  currentPuzzleId: string | number,
  subscriber?: SubscriberEntry,
  options?: { targetDate?: string }
): Promise<SubscriberInactivityStatus> {
  const cleanEmail = email.toLowerCase().trim()
  const currentPuzzleNum = parseInt(String(currentPuzzleId).replace('#', '').trim(), 10)
  if (isNaN(currentPuzzleNum) || currentPuzzleNum <= INACTIVITY_WARNING_DAYS) {
    return 'active'
  }

  const currentDate = options?.targetDate || getDateForPuzzleId(currentPuzzleNum)
  if (isSubscriberPaused(subscriber, currentDate)) {
    return 'active'
  }

  const graceAnchor = getGraceAnchorPuzzleNum(subscriber, currentDate)
  if (graceAnchor !== null && graceAnchor > currentPuzzleNum - INACTIVITY_WARNING_DAYS) {
    return 'active'
  }

  const settings = await getUserSettings(kv, cleanEmail)
  const submittedNumbers = new Set<number>()
  for (const id of settings.submittedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) submittedNumbers.add(num)
  }

  // Active if they submitted in the last INACTIVITY_WARNING_DAYS (14) puzzles
  if (await hasSubmissionInWindow(kv, cleanEmail, currentPuzzleNum, INACTIVITY_WARNING_DAYS, submittedNumbers)) {
    return 'active'
  }

  // Check if they also missed the full INACTIVITY_UNSUBSCRIBE_DAYS (21) window
  const pastUnsubGrace =
    currentPuzzleNum > INACTIVITY_UNSUBSCRIBE_DAYS &&
    (graceAnchor === null || graceAnchor <= currentPuzzleNum - INACTIVITY_UNSUBSCRIBE_DAYS)

  if (pastUnsubGrace) {
    const hadRecentSubmission = await hasSubmissionInWindow(
      kv,
      cleanEmail,
      currentPuzzleNum,
      INACTIVITY_UNSUBSCRIBE_DAYS,
      submittedNumbers
    )
    if (!hadRecentSubmission) {
      return 'unsubscribe'
    }
  }

  // Otherwise they are in the 14..20 day warning zone. Only send one check-in per inactivity stretch.
  const warnGap = INACTIVITY_UNSUBSCRIBE_DAYS - INACTIVITY_WARNING_DAYS
  if (subscriber?.inactivityWarningSentForPuzzle) {
    const warnedNum = parseInt(String(subscriber.inactivityWarningSentForPuzzle).replace('#', '').trim(), 10)
    if (!isNaN(warnedNum) && currentPuzzleNum - warnedNum >= 0 && currentPuzzleNum - warnedNum < warnGap) {
      return 'warned'
    }
  }

  return 'warn'
}

export async function isSubscriberInactive(
  kv: StorageBackend,
  email: string,
  currentPuzzleId: string | number,
  subscriber?: SubscriberEntry,
  windowDays: number = INACTIVITY_UNSUBSCRIBE_DAYS
): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim()
  const currentPuzzleNum = parseInt(String(currentPuzzleId).replace('#', '').trim(), 10)
  if (isNaN(currentPuzzleNum) || currentPuzzleNum <= windowDays) {
    return false
  }

  const currentDate = getDateForPuzzleId(currentPuzzleNum)
  if (isSubscriberPaused(subscriber, currentDate)) {
    return false
  }

  const graceAnchor = getGraceAnchorPuzzleNum(subscriber, currentDate)
  if (graceAnchor !== null && graceAnchor > currentPuzzleNum - windowDays) {
    return false
  }

  const settings = await getUserSettings(kv, cleanEmail)
  const submittedNumbers = new Set<number>()
  for (const id of settings.submittedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) submittedNumbers.add(num)
  }

  return !(await hasSubmissionInWindow(kv, cleanEmail, currentPuzzleNum, windowDays, submittedNumbers))
}

export async function getCoworkerCount(
  kv: StorageBackend,
  domain: string,
  email: string,
  puzzleOrDate?: string | number
): Promise<number> {
  const subscribers = await getSubscribers(kv)
  const coworkerEmails = new Set<string>()
  const targetDomain = getLeaderboardDomain(domain)

  for (const sub of subscribers) {
    if (getLeaderboardDomain(sub.domain) === targetDomain) {
      coworkerEmails.add(sub.email.toLowerCase())
    }
  }

  const puzzle = getDailyPuzzle(puzzleOrDate)
  const leaderboard = await getDomainLeaderboard(kv, targetDomain, puzzle.id, puzzle.date)
  for (const entry of leaderboard) {
    coworkerEmails.add(entry.email.toLowerCase())
  }

  coworkerEmails.delete(email.toLowerCase())
  return coworkerEmails.size
}

export async function getPlayerCount(kv: StorageBackend): Promise<number> {
  const subscribers = await getSubscribers(kv)
  return subscribers.filter(subscriber => subscriber.status === 'active').length
}

export const DEV_TESTERS_KEY = 'dev:testers:list'

export async function getDevTesters(kv: StorageBackend): Promise<string[]> {
  const data = await kvGet(kv, DEV_TESTERS_KEY)
  const list = Array.isArray(data)
    ? data.map((e: any) => String(e).toLowerCase().trim()).filter(Boolean)
    : []
  const envDevList = (process.env.DEV_TESTERS || '')
    .split(/[,;\s]+/)
    .map(e => e.toLowerCase().trim())
    .filter(Boolean)
  return Array.from(new Set([...list, ...envDevList]))
}

export async function isDevTester(kv: StorageBackend, email: string): Promise<boolean> {
  if (!email) return false
  const cleanEmail = email.toLowerCase().trim()
  const list = await getDevTesters(kv)
  return list.includes(cleanEmail)
}

export async function addDevTester(kv: StorageBackend, email: string): Promise<string[]> {
  if (!email) return getDevTesters(kv)
  const cleanEmail = email.toLowerCase().trim()
  return withKeyLock(DEV_TESTERS_KEY, async () => {
    const list = await getDevTesters(kv)
    if (!list.includes(cleanEmail)) {
      list.push(cleanEmail)
      await kvPut(kv, DEV_TESTERS_KEY, list)
    }
    return list
  })
}

export async function removeDevTester(kv: StorageBackend, email: string): Promise<string[]> {
  if (!email) return getDevTesters(kv)
  const cleanEmail = email.toLowerCase().trim()
  return withKeyLock(DEV_TESTERS_KEY, async () => {
    let list = await getDevTesters(kv)
    if (list.includes(cleanEmail)) {
      list = list.filter(e => e !== cleanEmail)
      await kvPut(kv, DEV_TESTERS_KEY, list)
    }
    return list
  })
}
