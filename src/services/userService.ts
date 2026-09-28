import { OAuth2Client } from 'google-auth-library'
import { extractEmailDomain, kvGet, kvPut, withKeyLock, type StorageBackend } from '../core'
import type { UserSettings } from '../core'
import { getDailyPuzzle } from '../game'
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
      theme: existing.theme === 'dark' ? 'dark' : 'light',
    }
  }

  return {
    email: cleanEmail,
    domain,
    showOnLeaderboard: true,
    theme: 'light',
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
  dateStr: string
): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const key = `user:profile:${cleanEmail}`
  return withKeyLock(key, async () => {
    const profile = await getUserSettings(kv, cleanEmail)

    if (!profile.playedDates) {
      profile.playedDates = [dateStr]
    } else if (!profile.playedDates.includes(dateStr)) {
      profile.playedDates.push(dateStr)
    }
    profile.daysPlayed = profile.playedDates.length

    await kvPut(kv, key, profile)
    return profile
  })
}

export async function getCoworkerCount(
  kv: StorageBackend,
  domain: string,
  email: string
): Promise<number> {
  const subscribers = await getSubscribers(kv)
  const coworkerEmails = new Set<string>()

  for (const sub of subscribers) {
    if (sub.domain === domain) {
      coworkerEmails.add(sub.email.toLowerCase())
    }
  }

  const puzzle = getDailyPuzzle()
  const leaderboard = await getDomainLeaderboard(kv, domain, puzzle.date)
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
