import { kvGet, kvPut, withKeyLock, getLeaderboardDomain, type StorageBackend } from '../core'
import type { LeaderboardEntry } from '../core'

export async function getDomainLeaderboard(
  kv: StorageBackend,
  domain: string,
  puzzleIdentifier: string,
  fallbackDate?: string
): Promise<LeaderboardEntry[]> {
  const domainKey = getLeaderboardDomain(domain)
  const primaryKey = `leaderboard:${domainKey}:${puzzleIdentifier}`
  const data = await kvGet(kv, primaryKey)
  let list: LeaderboardEntry[] = Array.isArray(data) ? [...data] : []

  // Fallback: If fallbackDate is provided or puzzleIdentifier is a date string (YYYY-MM-DD), check legacy date key
  const legacyKey = fallbackDate
    ? `leaderboard:${domainKey}:${fallbackDate}`
    : (/^\d{4}-\d{2}-\d{2}$/.test(puzzleIdentifier) ? `leaderboard:${domainKey}:${puzzleIdentifier}` : null)

  if (legacyKey && legacyKey !== primaryKey) {
    const legacyData = await kvGet(kv, legacyKey)
    if (Array.isArray(legacyData) && legacyData.length > 0) {
      for (const entry of legacyData) {
        if (!list.some(e => e.email.toLowerCase().trim() === entry.email.toLowerCase().trim())) {
          list.push(entry)
        }
      }
    }
  }

  // If general leaderboard, also merge any legacy records under gmail.com, googlemail.com, and yahoo.com
  if (domainKey === 'general') {
    const legacyDomains = ['gmail.com', 'googlemail.com', 'yahoo.com']
    for (const legDomain of legacyDomains) {
      const legPuzKey = `leaderboard:${legDomain}:${puzzleIdentifier}`
      const legPuzData = await kvGet(kv, legPuzKey)
      if (Array.isArray(legPuzData)) {
        for (const entry of legPuzData) {
          if (!list.some(e => e.email.toLowerCase().trim() === entry.email.toLowerCase().trim())) {
            list.push(entry)
          }
        }
      }
      if (fallbackDate) {
        const legDateKey = `leaderboard:${legDomain}:${fallbackDate}`
        const legDateData = await kvGet(kv, legDateKey)
        if (Array.isArray(legDateData)) {
          for (const entry of legDateData) {
            if (!list.some(e => e.email.toLowerCase().trim() === entry.email.toLowerCase().trim())) {
              list.push(entry)
            }
          }
        }
      }
    }
  }

  if (list.length > 0) {
    list.sort((a, b) => b.score - a.score || a.guessCount - b.guessCount)
    return list.slice(0, 20)
  }

  return []
}

// Save domain leaderboard entry to KV/D1 and Memory
export async function updateDomainLeaderboard(
  kv: StorageBackend,
  domain: string,
  puzzleIdentifier: string,
  entry: LeaderboardEntry
): Promise<LeaderboardEntry[]> {
  const domainKey = getLeaderboardDomain(domain || entry.email)
  const key = `leaderboard:${domainKey}:${puzzleIdentifier}`
  return withKeyLock(key, async () => {
    const list = (await getDomainLeaderboard(kv, domainKey, puzzleIdentifier)) || []

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

