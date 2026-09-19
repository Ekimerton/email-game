import { extractEmailDomain } from './auth'
import { getDailyPuzzle } from './puzzleLogic'
import { DailyPuzzle } from './puzzles'
import { createInitialMask } from './gameLogic'
import { GAME_MESSAGES } from './gameMessages'
import {
  GameState,
  LeaderboardEntry,
  SubscriberEntry,
  UserSettings,
} from './types'

// Persistent memory store for development fallback & 429 rate limit protection
const MEMORY_STORE = new Map<string, any>()

export function extractDomain(email: string): string {
  return extractEmailDomain(email)
}

export function formatDisplayEmail(email: string): string {
  return email ? email.toLowerCase().trim() : 'Anonymous'
}

export async function kvGet(kv: KVNamespace | undefined, key: string): Promise<any> {
  if (kv) {
    try {
      const val = await kv.get(key, { type: 'json' })
      if (val !== null) {
        MEMORY_STORE.set(key, val)
        return val
      }
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed reading ${key} from KV, falling back to memory:`, err)
    }
  }
  return MEMORY_STORE.get(key) || null
}

export async function kvPut(kv: KVNamespace | undefined, key: string, value: any): Promise<void> {
  MEMORY_STORE.set(key, value)
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed writing ${key} to KV:`, err)
    }
  }
}

export async function kvDelete(kv: KVNamespace | undefined, key: string): Promise<void> {
  MEMORY_STORE.delete(key)
  if (kv) {
    try {
      await kv.delete(key)
    } catch (err) {
      console.warn(`[KV Error] Failed deleting ${key} from KV:`, err)
    }
  }
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

export async function getDomainLeaderboard(
  kv: KVNamespace | undefined,
  domain: string,
  date: string
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${date}`
  const data = await kvGet(kv, key)
  return Array.isArray(data) ? data : []
}

export async function updateDomainLeaderboard(
  kv: KVNamespace | undefined,
  domain: string,
  date: string,
  entry: LeaderboardEntry
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${date}`
  const list = (await getDomainLeaderboard(kv, domain, date)) || []

  const existingIdx = list.findIndex((item) => item.email === entry.email)
  if (existingIdx >= 0) {
    list[existingIdx] = entry
  } else {
    list.push(entry)
  }

  list.sort((a, b) => b.score - a.score || a.guessCount - b.guessCount)

  const topList = list.slice(0, 20)
  await kvPut(kv, key, topList)
  return topList
}

export async function getSubscribers(kv: KVNamespace | undefined): Promise<SubscriberEntry[]> {
  const data = await kvGet(kv, 'subscribers:list')
  return Array.isArray(data) ? data : []
}

export async function addSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const domain = extractDomain(email)
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'active'
  } else {
    subscribers.push({
      email,
      domain,
      subscribedAt: new Date().toISOString(),
      status: 'active'
    })
  }

  await kvPut(kv, 'subscribers:list', subscribers)
  return subscribers
}

export async function removeSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'unsubscribed'
    await kvPut(kv, 'subscribers:list', subscribers)
  }
  return subscribers
}

export async function unsubscribeUser(
  kv: KVNamespace | undefined,
  email: string,
  purge = false
): Promise<{ success: boolean; email: string; status: string; totalSubscribers: number; activeCount: number }> {
  const cleanEmail = email.toLowerCase().trim()
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === cleanEmail)

  let status = 'not_found'
  if (existingIdx >= 0) {
    if (purge) {
      subscribers.splice(existingIdx, 1)
      status = 'purged'
    } else {
      subscribers[existingIdx].status = 'unsubscribed'
      status = 'unsubscribed'
    }
    await kvPut(kv, 'subscribers:list', subscribers)
  }

  return {
    success: true,
    email: cleanEmail,
    status,
    totalSubscribers: subscribers.length,
    activeCount: subscribers.filter(s => s.status === 'active').length
  }
}

export async function ensureSubscribedOnOpen(kv: KVNamespace | undefined, email: string): Promise<boolean> {
  const subscribers = await getSubscribers(kv)
  const existing = subscribers.find(s => s.email === email)

  if (!existing) {
    await addSubscriber(kv, email)
    return true
  }

  return existing.status === 'active'
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

export async function getOrCreateGameState(
  kv: KVNamespace | undefined,
  userEmail: string,
  dateStr?: string
): Promise<{ state: GameState; puzzle: DailyPuzzle; stateKey: string }> {
  const puzzle = getDailyPuzzle(dateStr)
  const domain = extractDomain(userEmail)
  const stateKey = `game:${puzzle.date}:${userEmail}`

  const stored = await kvGet(kv, stateKey)
  if (stored) {
    if (!stored.guessesHistory) {
      stored.guessesHistory = []
    }
    if (!stored.guessedWords) {
      stored.guessedWords = stored.guessesHistory.map((g: any) => g.guess)
    }
    if (stored.synonymGuessesCount === undefined) {
      stored.synonymGuessesCount = 0
    }
    return { state: stored, puzzle, stateKey }
  }

  const initialState: GameState = {
    puzzleId: puzzle.id,
    date: puzzle.date,
    letterMask: createInitialMask(puzzle.word),
    guessesHistory: [],
    guessedWords: [],
    guessCount: 0,
    hintsUsed: 0,
    score: 0,
    hasWon: false,
    lastMessage: GAME_MESSAGES.initialPrompt(puzzle.word.length),
    shareText: '',
    revealedCount: 1,
    synonymGuessesCount: 0,
  }

  return { state: initialState, puzzle, stateKey }
}

// Reset user game state, leaderboard entry, and played dates for a specific date
export async function resetUserDayState(
  kv: KVNamespace | undefined,
  email: string,
  dateStr: string
): Promise<{
  success: boolean
  email: string
  date: string
  message: string
  details: {
    gameStateDeleted: boolean
    removedFromLeaderboard: boolean
    removedFromPlayedDates: boolean
  }
}> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractDomain(cleanEmail)
  const stateKey = `game:${dateStr}:${cleanEmail}`

  // 1. Delete Game State
  await kvDelete(kv, stateKey)

  // 2. Remove from Domain Leaderboard for this date if present
  let removedFromLeaderboard = false
  const leaderboardKey = `leaderboard:${domain}:${dateStr}`
  const existingLeaderboard = await getDomainLeaderboard(kv, domain, dateStr)
  if (existingLeaderboard && existingLeaderboard.length > 0) {
    const filteredLeaderboard = existingLeaderboard.filter(
      (entry) => entry.email.toLowerCase().trim() !== cleanEmail
    )
    if (filteredLeaderboard.length !== existingLeaderboard.length) {
      await kvPut(kv, leaderboardKey, filteredLeaderboard)
      removedFromLeaderboard = true
    }
  }

  // 3. Remove date from user's playedDates profile if present
  let removedFromPlayedDates = false
  const userSettings = await getUserSettings(kv, cleanEmail)
  if (userSettings.playedDates && userSettings.playedDates.includes(dateStr)) {
    userSettings.playedDates = userSettings.playedDates.filter((d) => d !== dateStr)
    userSettings.daysPlayed = userSettings.playedDates.length
    await updateUserSettings(kv, userSettings)
    removedFromPlayedDates = true
  }

  return {
    success: true,
    email: cleanEmail,
    date: dateStr,
    message: `Successfully reset save state for ${cleanEmail} on ${dateStr}`,
    details: {
      gameStateDeleted: true,
      removedFromLeaderboard,
      removedFromPlayedDates,
    },
  }
}
