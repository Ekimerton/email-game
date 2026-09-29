import { extractEmailDomain, kvDelete, kvPut, kvGet, withKeyLock, type StorageBackend, type LeaderboardEntry } from '../core'
import { getDailyPuzzle, getDateForPuzzleId } from '../game'
import { getDomainLeaderboard } from './leaderboard'
import { getUserSettings, updateUserSettings } from './userService'

// Reset user game state, leaderboard entry, and played dates for a specific puzzle number or date
export async function resetUserDayState(
  kv: StorageBackend,
  email: string,
  puzzleOrDate?: string | number
): Promise<{
  success: boolean
  email: string
  date: string
  puzzleId: string
  message: string
  details: {
    gameStateDeleted: boolean
    removedFromLeaderboard: boolean
    removedFromPlayedDates: boolean
  }
}> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractEmailDomain(cleanEmail)
  const cleanTarget = puzzleOrDate !== undefined ? String(puzzleOrDate).trim().replace(/^#/, '') : ''

  let dateStr = ''
  let targetPuzzleId = ''

  if (/^\d{4}-\d{2}-\d{2}$/.test(cleanTarget)) {
    // Target is a date (YYYY-MM-DD)
    dateStr = cleanTarget
    const stdPuzzle = getDailyPuzzle(dateStr, { isDev: false })
    targetPuzzleId = stdPuzzle.id
  } else if (/^\d+$/.test(cleanTarget)) {
    // Target is a puzzle ID / number (e.g. "1", "43")
    targetPuzzleId = cleanTarget
    // First, check if the user has an existing game state with this puzzleId among their playedDates
    const userSettings = await getUserSettings(kv, cleanEmail)
    for (const d of userSettings.playedDates || []) {
      const stored = await kvGet(kv, `game:${d}:${cleanEmail}`)
      if (stored && String(stored.puzzleId) === targetPuzzleId) {
        dateStr = d
        break
      }
    }
    // If not found in playedDates, calculate the standard date for this puzzle ID
    if (!dateStr) {
      dateStr = getDateForPuzzleId(targetPuzzleId, { isDev: false })
    }
  } else {
    // Fallback default: today's active puzzle
    const todayPuzzle = getDailyPuzzle()
    dateStr = todayPuzzle.date
    targetPuzzleId = todayPuzzle.id
  }

  const stdPuzzle = getDailyPuzzle(dateStr, { isDev: false })
  const devPuzzle = getDailyPuzzle(dateStr, { isDev: true })
  const devDate = targetPuzzleId ? getDateForPuzzleId(targetPuzzleId, { isDev: true }) : ''

  // 1. Delete Game State (both standard date, dev date, and dev scoped keys if any)
  const stateKeys = Array.from(new Set([
    `game:${dateStr}:${cleanEmail}`,
    `game:${dateStr}:dev:${cleanEmail}`,
    ...(devDate ? [`game:${devDate}:${cleanEmail}`, `game:${devDate}:dev:${cleanEmail}`] : [])
  ]))

  let gameStateDeleted = false
  for (const stateKey of stateKeys) {
    await withKeyLock(stateKey, async () => {
      const existing = await kvGet(kv, stateKey)
      if (existing) {
        gameStateDeleted = true
      }
      await kvDelete(kv, stateKey)
    })
  }

  // 2. Remove from Domain Leaderboard for this date/puzzle if present
  let removedFromLeaderboard = false
  const leaderboardKeys = Array.from(new Set([
    ...(targetPuzzleId ? [`leaderboard:${domain}:${targetPuzzleId}`] : []),
    `leaderboard:${domain}:${stdPuzzle.id}`,
    `leaderboard:${domain}:${devPuzzle.id}`,
    `leaderboard:${domain}:${dateStr}`,
    ...(devDate ? [`leaderboard:${domain}:${devDate}`] : [])
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

  // 3. Remove date and puzzle from user's profile if present
  let removedFromPlayedDates = false
  const userSettings = await getUserSettings(kv, cleanEmail)
  const datesToRemove = new Set([dateStr, ...(devDate ? [devDate] : [])])
  const puzzlesToRemove = new Set([targetPuzzleId, stdPuzzle.id, devPuzzle.id].filter(Boolean))

  let profileChanged = false
  if (userSettings.playedDates && userSettings.playedDates.some((d) => datesToRemove.has(d))) {
    userSettings.playedDates = userSettings.playedDates.filter((d) => !datesToRemove.has(d))
    profileChanged = true
    removedFromPlayedDates = true
  }

  if (userSettings.playedPuzzles && userSettings.playedPuzzles.some((p) => puzzlesToRemove.has(p))) {
    userSettings.playedPuzzles = userSettings.playedPuzzles.filter((p) => !puzzlesToRemove.has(p))
    profileChanged = true
    removedFromPlayedDates = true
  }

  if (profileChanged) {
    userSettings.daysPlayed = Math.max(
      userSettings.playedDates ? userSettings.playedDates.length : 0,
      userSettings.playedPuzzles ? userSettings.playedPuzzles.length : 0
    )
    await updateUserSettings(kv, userSettings)
  }

  return {
    success: true,
    email: cleanEmail,
    date: dateStr,
    puzzleId: targetPuzzleId,
    message: `Successfully reset save state for ${cleanEmail} on Puzzle #${targetPuzzleId} (${dateStr})`,
    details: {
      gameStateDeleted: true,
      removedFromLeaderboard,
      removedFromPlayedDates,
    },
  }
}
