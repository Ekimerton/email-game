import { extractEmailDomain, kvDelete, kvPut } from '../core'
import { getDomainLeaderboard } from './leaderboard'
import { getUserSettings, updateUserSettings } from './userService'

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
  const domain = extractEmailDomain(cleanEmail)
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
