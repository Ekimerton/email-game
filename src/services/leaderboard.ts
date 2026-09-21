import { kvGet, kvPut } from '../core'
import type { LeaderboardEntry } from '../core'

export async function getDomainLeaderboard(
  kv: KVNamespace | undefined,
  domain: string,
  date: string
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${date}`
  const data = await kvGet(kv, key)
  return Array.isArray(data) ? data : []
}

// Save domain leaderboard entry to KV and Memory
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
