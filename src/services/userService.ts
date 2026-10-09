import { OAuth2Client } from 'google-auth-library'
import { extractEmailDomain, getLeaderboardDomain, kvGet, kvPut, withKeyLock, type StorageBackend } from '../core'
import type { UserSettings, SubscriberEntry } from '../core'
import { getDailyPuzzle, getPuzzleById } from '../game'
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
      theme: existing.theme === 'dark' ? 'dark' : 'light',
      colorCombo: existing.colorCombo || 'amber-blue',
      primaryColor: existing.primaryColor,
      secondaryColor: existing.secondaryColor,
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

  if (isNaN(currentTargetNum)) return 0

  // Check if currentTargetNum was played/won in storage if not already in set
  if (!playedNumbers.has(currentTargetNum)) {
    const targetPuzzle = getDailyPuzzle(currentTargetNum) || getPuzzleById(currentTargetNum)
    if (targetPuzzle) {
      const stateKey = `game:${targetPuzzle.date}:${cleanEmail}`
      const st = await kvGet(kv, stateKey)
      if (st && (st.hasWon || st.guessCount > 0)) {
        playedNumbers.add(currentTargetNum)
      } else {
        const staticPuzzle = getPuzzleById(currentTargetNum)
        if (staticPuzzle && staticPuzzle.date !== targetPuzzle.date) {
          const legacySt = await kvGet(kv, `game:${staticPuzzle.date}:${cleanEmail}`)
          if (legacySt && (legacySt.hasWon || legacySt.guessCount > 0)) {
            playedNumbers.add(currentTargetNum)
          }
        }
      }
    }
    if (!playedNumbers.has(currentTargetNum)) {
      const domain = extractDomain(cleanEmail)
      const lb = await getDomainLeaderboard(kv, domain, String(currentTargetNum))
      if (lb && lb.some(e => e.email.toLowerCase() === cleanEmail)) {
        playedNumbers.add(currentTargetNum)
      }
    }
  }

  // If the target game wasn't played, current streak is 0
  if (!playedNumbers.has(currentTargetNum)) {
    return 0
  }

  // Count backwards consecutive games
  let streak = 0
  let checkNum = currentTargetNum
  while (true) {
    if (playedNumbers.has(checkNum)) {
      streak++
      checkNum--
    } else {
      // Fallback check in KV for checkNum
      const puzzle = getDailyPuzzle(checkNum) || getPuzzleById(checkNum)
      let found = false
      if (puzzle) {
        const stateKey = `game:${puzzle.date}:${cleanEmail}`
        const st = await kvGet(kv, stateKey)
        if (st && (st.hasWon || st.guessCount > 0)) {
          playedNumbers.add(checkNum)
          streak++
          checkNum--
          found = true
          continue
        } else {
          const staticPuzzle = getPuzzleById(checkNum)
          if (staticPuzzle && staticPuzzle.date !== puzzle.date) {
            const legacySt = await kvGet(kv, `game:${staticPuzzle.date}:${cleanEmail}`)
            if (legacySt && (legacySt.hasWon || legacySt.guessCount > 0)) {
              playedNumbers.add(checkNum)
              streak++
              checkNum--
              found = true
              continue
            }
          }
        }
      }

      if (!found) {
        const domain = extractDomain(cleanEmail)
        const lb = await getDomainLeaderboard(kv, domain, String(checkNum))
        if (lb && lb.some(e => e.email.toLowerCase() === cleanEmail)) {
          playedNumbers.add(checkNum)
          streak++
          checkNum--
          found = true
          continue
        }
      }

      break
    }
  }

  return streak
}

export async function isSubscriberInactive(
  kv: StorageBackend,
  email: string,
  currentPuzzleId: string | number,
  subscriber?: SubscriberEntry
): Promise<boolean> {
  const cleanEmail = email.toLowerCase().trim()
  const currentPuzzleNum = parseInt(String(currentPuzzleId).replace('#', '').trim(), 10)
  if (isNaN(currentPuzzleNum) || currentPuzzleNum <= 7) {
    return false
  }

  // If subscriber entry exists with subscribedAt, check if they subscribed less than 7 games ago
  if (subscriber?.subscribedAt) {
    const subDateStr = subscriber.subscribedAt.slice(0, 10)
    const subPuzzle = getDailyPuzzle(subDateStr)
    const subPuzzleNum = parseInt(subPuzzle.id, 10)
    if (!isNaN(subPuzzleNum) && subPuzzleNum > currentPuzzleNum - 7) {
      return false
    }
  }

  const settings = await getUserSettings(kv, cleanEmail)
  const submittedNumbers = new Set<number>()
  for (const id of settings.submittedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) submittedNumbers.add(num)
  }
  for (const id of settings.playedPuzzles || []) {
    const num = parseInt(String(id).replace('#', '').trim(), 10)
    if (!isNaN(num)) submittedNumbers.add(num)
  }

  // The 7 games in a row prior to today
  const windowGames: number[] = []
  for (let i = 1; i <= 7; i++) {
    windowGames.push(currentPuzzleNum - i)
  }

  for (const gameNum of windowGames) {
    if (submittedNumbers.has(gameNum)) {
      return false
    }
    // Fallback check in KV
    const puzzle = getPuzzleById(gameNum)
    if (puzzle) {
      const stateKey = `game:${puzzle.date}:${cleanEmail}`
      const st = await kvGet(kv, stateKey)
      if (st && (st.hasWon || st.guessCount > 0)) {
        return false
      }
    }
  }

  return true
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
