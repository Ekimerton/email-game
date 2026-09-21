import { OAuth2Client } from 'google-auth-library'
import { extractEmailDomain, kvGet, kvPut } from '../core'
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

export async function getUserSettings(kv: KVNamespace | undefined, email: string): Promise<UserSettings> {
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

export async function updateUserSettings(kv: KVNamespace | undefined, settings: UserSettings): Promise<void> {
  const cleanEmail = settings.email.toLowerCase().trim()
  await kvPut(kv, `user:profile:${cleanEmail}`, settings)
}

export async function recordUserActivity(
  kv: KVNamespace | undefined,
  email: string,
  dateStr: string
): Promise<UserSettings> {
  const profile = await getUserSettings(kv, email)

  if (!profile.playedDates) {
    profile.playedDates = [dateStr]
  } else if (!profile.playedDates.includes(dateStr)) {
    profile.playedDates.push(dateStr)
  }
  profile.daysPlayed = profile.playedDates.length

  await updateUserSettings(kv, profile)
  return profile
}

export async function getCoworkerCount(
  kv: KVNamespace | undefined,
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

export async function getPlayerCount(kv: KVNamespace | undefined): Promise<number> {
  const subscribers = await getSubscribers(kv)
  return subscribers.filter(subscriber => subscriber.status === 'active').length
}
