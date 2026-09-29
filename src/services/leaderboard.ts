import { kvGet, kvPut, withKeyLock, type StorageBackend } from '../core'
import type { LeaderboardEntry } from '../core'

export async function getDomainLeaderboard(
  kv: StorageBackend,
  domain: string,
  puzzleIdentifier: string,
  fallbackDate?: string
): Promise<LeaderboardEntry[]> {
  const primaryKey = `leaderboard:${domain}:${puzzleIdentifier}`
  const data = await kvGet(kv, primaryKey)
  if (Array.isArray(data) && data.length > 0) {
    return data
  }

  // Fallback: If fallbackDate is provided or puzzleIdentifier is a date string (YYYY-MM-DD), check legacy date key
  const legacyKey = fallbackDate
    ? `leaderboard:${domain}:${fallbackDate}`
    : (/^\d{4}-\d{2}-\d{2}$/.test(puzzleIdentifier) ? `leaderboard:${domain}:${puzzleIdentifier}` : null)

  if (legacyKey && legacyKey !== primaryKey) {
    const legacyData = await kvGet(kv, legacyKey)
    if (Array.isArray(legacyData) && legacyData.length > 0) {
      return legacyData
    }
  }

  return Array.isArray(data) ? data : []
}

// Save domain leaderboard entry to KV/D1 and Memory
export async function updateDomainLeaderboard(
  kv: StorageBackend,
  domain: string,
  puzzleIdentifier: string,
  entry: LeaderboardEntry
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${puzzleIdentifier}`
  return withKeyLock(key, async () => {
    const list = (await getDomainLeaderboard(kv, domain, puzzleIdentifier)) || []

    const cleanEmail = entry.email.toLowerCase().trim()
    const existingIdx = list.findIndex((item) => item.email.toLowerCase().trim() === cleanEmail)
    if (existingIdx >= 0) {
      list[existingIdx] = entry
    } else {
      list.push(entry)
    }

    list.sort((a, b) => b.score - a.score || a.guessCount - b.guessCount)

    const topList = list.slice(0, 20)
    await kvPut(kv, key, topList)
    return topList
  })
}

