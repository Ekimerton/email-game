import { extractEmailDomain, kvDelete, kvPut, kvGet, withKeyLock, type StorageBackend, type LeaderboardEntry } from '../core'
import { getDailyPuzzle } from '../game'
import { getDomainLeaderboard } from './leaderboard'
import { getUserSettings, updateUserSettings } from './userService'

// Reset user game state, leaderboard entry, and played dates for a specific date
export async function resetUserDayState(
  kv: StorageBackend,
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
  const domain = extractEmailDomain(cleanEmail)
  const stateKey = `game:${dateStr}:${cleanEmail}`

  // 1. Delete Game State
  await withKeyLock(stateKey, async () => {
    await kvDelete(kv, stateKey)
  })

  // 2. Remove from Domain Leaderboard for this date/puzzle if present
  let removedFromLeaderboard = false
  const stdPuzzle = getDailyPuzzle(dateStr, { isDev: false })
  const devPuzzle = getDailyPuzzle(dateStr, { isDev: true })
  const leaderboardKeys = Array.from(new Set([
    `leaderboard:${domain}:${stdPuzzle.id}`,
    `leaderboard:${domain}:${devPuzzle.id}`,
    `leaderboard:${domain}:${dateStr}`
  ]))

  for (const lbKey of leaderboardKeys) {
    await withKeyLock(lbKey, async () => {
      const existingLeaderboard = await kvGet(kv, lbKey)
      if (Array.isArray(existingLeaderboard) && existingLeaderboard.length > 0) {
        const filtered = existingLeaderboard.filter(
          (entry: LeaderboardEntry) => entry.email.toLowerCase().trim() !== cleanEmail
        )
        if (filtered.length !== existingLeaderboard.length) {
          await kvPut(kv, lbKey, filtered)
          removedFromLeaderboard = true
        }
      }
    })
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
