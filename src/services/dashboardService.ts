import {
  extractBackends,
  extractEmailDomain,
  generateAccountToken,
  getLeaderboardDomain,
  parseColorCombo,
  MEMORY_STORE,
  type StorageBackend,
  type SubscriberEntry,
  type LeaderboardEntry,
  type GameState
} from '../core'
import { getDailyPuzzle, getDateForPuzzleId, getPuzzleById, PUZZLES } from '../game'
import { getSubscribers, addSubscriber, unsubscribeUser } from './subscribers'
import { getDevTesters, getUserSettings, updateUserSettings, addDevTester, removeDevTester } from './userService'

export interface PlayerScoreRecord {
  email: string
  displayEmail: string
  domain: string
  puzzleId: string
  legacyOriginalPuzzleId?: string
  date: string
  score: number
  guessCount: number
  guesses: string[]
  hintsUsed: number
  hasWon: boolean
  status: 'won' | 'playing'
  revealedCount: number
  wonAt?: string
  updatedAt?: string
  isDev?: boolean
}

export interface UserProfileSummary {
  email: string
  domain: string
  showOnLeaderboard: boolean
  theme: 'light' | 'dark'
  colorCombo?: string
  primaryColor?: string
  secondaryColor?: string
  daysPlayed: number
  playedDates: string[]
  playedPuzzles: string[]
  isSubscribed: boolean
  isDev: boolean
  accountToken?: string
  lastPlayed?: string
}

export interface DomainStats {
  domain: string
  playerCount: number
  subscriberCount: number
  avgScore: number
  topScore: number
}

export interface DashboardStats {
  todayPuzzle: {
    id: string
    date: string
    wordLength: number
    definitionsCount: number
  }
  selectedPuzzle: {
    id: string
    date: string
  }
  subscribers: {
    total: number
    activeCount: number
    unsubscribedCount: number
    uniqueDomainsCount: number
    list: SubscriberEntry[]
  }
  todayStats: {
    totalPlayers: number
    totalWon: number
    totalPlaying: number
    winRate: number
    avgScore: number
    avgGuesses: number
    topScore: number
    topPlayer?: string
  }
  selectedPuzzleStats: {
    totalPlayers: number
    totalWon: number
    totalPlaying: number
    winRate: number
    avgScore: number
    avgGuesses: number
    topScore: number
    topPlayer?: string
  }
  selectedPlays: PlayerScoreRecord[]
  allPlays: PlayerScoreRecord[]
  availablePuzzles: { id: string; date: string; playCount: number }[]
  domainRankings: DomainStats[]
  devTesters: string[]
  userProfiles: UserProfileSummary[]
  generatedAt: string
}

function parseStateRecord(
  key: string,
  rawVal: any,
  updatedAtFallback?: string,
  devSet?: Set<string>
): PlayerScoreRecord | null {
  try {
    let state: Partial<GameState> = {}
    if (typeof rawVal === 'string') {
      try {
        state = JSON.parse(rawVal)
      } catch {
        return null
      }
    } else if (rawVal && typeof rawVal === 'object') {
      state = rawVal
    } else {
      return null
    }

    // Key patterns:
    // game:<date>:<email>
    // game:<date>:dev:<email>
    const parts = key.split(':')
    if (parts.length < 3) return null

    const dateFromKey = parts[1]
    const isDevKey = parts[2] === 'dev'
    const emailFromKey = isDevKey ? (parts[3] || '') : (parts[2] || '')
    const cleanEmail = ((state as any).email || emailFromKey || '').toLowerCase().trim()
    if (!cleanEmail || !cleanEmail.includes('@')) return null

    const domain = extractEmailDomain(cleanEmail)
    const hasWon = Boolean(state.hasWon)
    const guesses: string[] = Array.isArray(state.guessedWords) && state.guessedWords.length > 0
      ? state.guessedWords
      : (Array.isArray(state.guessesHistory) ? state.guessesHistory.map(g => (typeof g === 'string' ? g : g.guess)).filter(Boolean) : [])

    // Determine normalized puzzleId (game number)
    let puzzleId = ''
    if (state.puzzleId) {
      const cleanStateId = String(state.puzzleId).replace('#', '').trim()
      if (/^\d+$/.test(cleanStateId)) {
        puzzleId = cleanStateId
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanStateId)) {
        const found = PUZZLES.find(p => p.date === cleanStateId) || getDailyPuzzle(cleanStateId)
        if (found) puzzleId = String(found.id)
      }
    }

    // If state.puzzleId was not a valid number, attempt to match the winning word if won
    if (!puzzleId && hasWon && guesses.length > 0) {
      const lastGuess = guesses[guesses.length - 1].toUpperCase().trim()
      const matchingPuzzle = PUZZLES.find(p => p.word.toUpperCase() === lastGuess)
      if (matchingPuzzle) {
        puzzleId = String(matchingPuzzle.id)
      }
    }

    // Fall back to key's second part (puzzleId or date)
    if (!puzzleId) {
      const cleanKeyPart = dateFromKey.replace('#', '').trim()
      if (/^\d+$/.test(cleanKeyPart)) {
        puzzleId = cleanKeyPart
      } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanKeyPart)) {
        const found = PUZZLES.find(p => p.date === cleanKeyPart) || getDailyPuzzle(cleanKeyPart, { isDev: isDevKey })
        if (found) puzzleId = String(found.id)
      }
    }

    if (!puzzleId) puzzleId = '1'

    // Validation: Verify that the winning guess belongs to this puzzle
    // This prevents legacy test game states (e.g. won with word "SPRING") from polluting
    // a different puzzle (e.g. puzzle #2 whose word is "CONVERT").
    let legacyOriginalPuzzleId: string | undefined = undefined
    const puzzle = getPuzzleById(puzzleId)
    if (puzzle && hasWon && guesses.length > 0) {
      const lastGuess = guesses[guesses.length - 1]?.toUpperCase().trim()

      if (lastGuess && lastGuess !== puzzle.word.toUpperCase()) {
        legacyOriginalPuzzleId = puzzleId
        // Winning word doesn't match this puzzle!
        // Check if winning word matches any other puzzle in PUZZLES
        const correctPuzzle = PUZZLES.find(p => p.word.toUpperCase() === lastGuess)
        if (correctPuzzle) {
          puzzleId = String(correctPuzzle.id)
        } else {
          // Obsolete/legacy puzzle word from dev (e.g. SPRING)
          puzzleId = `legacy-${lastGuess.toLowerCase()}`
        }
      }
    }

    const date = state.date || getDateForPuzzleId(puzzleId) || ''
    const guessCount = typeof state.guessCount === 'number' ? state.guessCount : (state.guessesHistory?.length || guesses.length || 0)
    const hintsUsed = typeof state.hintsUsed === 'number' ? state.hintsUsed : 0
    const score = typeof state.score === 'number' ? state.score : 0
    const revealedCount = typeof state.revealedCount === 'number' ? state.revealedCount : 0
    const status: 'won' | 'playing' = hasWon ? 'won' : 'playing'

    const isDev = isDevKey || (devSet ? devSet.has(cleanEmail) : false)

    // Mask display email: first 2 chars + ... + @domain
    const atIdx = cleanEmail.indexOf('@')
    const localPart = cleanEmail.slice(0, atIdx)
    const displayEmail = localPart.length > 3
      ? `${localPart.slice(0, 2)}•••${localPart.slice(-1)}@${domain}`
      : `${localPart.slice(0, 1)}•••@${domain}`

    return {
      email: cleanEmail,
      displayEmail,
      domain,
      puzzleId,
      legacyOriginalPuzzleId,
      date,
      score,
      guessCount,
      guesses,
      hintsUsed,
      hasWon,
      status,
      revealedCount,
      wonAt: hasWon ? (state.updatedAt || updatedAtFallback) : undefined,
      updatedAt: state.updatedAt || updatedAtFallback,
      isDev
    }
  } catch {
    return null
  }
}

export async function getDashboardStats(
  storage: StorageBackend,
  targetPuzzleOrDate?: string
): Promise<DashboardStats> {
  const { db, kv } = extractBackends(storage)

  // 1. Fetch Subscribers & Dev Testers
  const subscribers = await getSubscribers(storage)
  const devTesters = await getDevTesters(storage)
  const devSet = new Set(devTesters.map(e => e.toLowerCase().trim()))

  const totalSubscribers = subscribers.length
  const activeCount = subscribers.filter(s => s.status === 'active').length
  const unsubscribedCount = totalSubscribers - activeCount
  const domains = Array.from(new Set(subscribers.map(s => s.domain).filter(Boolean)))

  // 2. Fetch all game:* and leaderboard:* records
  const playRecordsMap = new Map<string, PlayerScoreRecord>()
  const legacyRemappedKeys = new Set<string>()

  const addPlayRecord = (record: PlayerScoreRecord | null) => {
    if (!record) return
    if (record.legacyOriginalPuzzleId && record.legacyOriginalPuzzleId !== record.puzzleId) {
      legacyRemappedKeys.add(`${record.email}:${record.legacyOriginalPuzzleId}`)
    }
    const dedupKey = `${record.email}:${record.puzzleId}`
    const existing = playRecordsMap.get(dedupKey)
    if (!existing || (record.hasWon && !existing.hasWon) || record.score > existing.score) {
      playRecordsMap.set(dedupKey, record)
    }
  }

  // A. Try D1
  if (db) {
    try {
      const rows = await db
        .prepare("SELECT key, value, updated_at FROM kv_store WHERE key LIKE 'game:%'")
        .all<{ key: string; value: string; updated_at: string }>()

      if (rows && Array.isArray(rows.results)) {
        for (const row of rows.results) {
          const record = parseStateRecord(row.key, row.value, row.updated_at, devSet)
          addPlayRecord(record)
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Error querying D1 game records:', err)
    }
  }

  // B. Try KV fallback if D1 returned few or no records
  if (kv && playRecordsMap.size === 0 && typeof (kv as any).list === 'function') {
    try {
      let cursor: string | undefined = undefined
      let keys: string[] = []
      do {
        const listRes: any = await kv.list({ prefix: 'game:', cursor })
        if (listRes?.keys) {
          keys.push(...listRes.keys.map((k: any) => k.name))
        }
        cursor = listRes?.list_complete ? undefined : listRes?.cursor
      } while (cursor && keys.length < 500)

      for (const k of keys) {
        const val = await kv.get(k, { type: 'json' })
        const record = parseStateRecord(k, val, undefined, devSet)
        addPlayRecord(record)
      }
    } catch (err) {
      console.warn('[Dashboard] Error querying KV game records:', err)
    }
  }

  // C. In-Memory Store (for unit tests and local dev)
  for (const [k, v] of MEMORY_STORE.entries()) {
    if (k.startsWith('game:')) {
      const record = parseStateRecord(k, v, undefined, devSet)
      addPlayRecord(record)
    }
  }

  // Also augment with Leaderboard entries if available
  if (db) {
    try {
      const lbRows = await db
        .prepare("SELECT key, value, updated_at FROM kv_store WHERE key LIKE 'leaderboard:%'")
        .all<{ key: string; value: string; updated_at: string }>()

      if (lbRows && Array.isArray(lbRows.results)) {
        for (const row of lbRows.results) {
          // leaderboard:<domain>:<puzzleId> or legacy leaderboard:<domain>:<date>
          const parts = row.key.split(':')
          if (parts.length >= 3) {
            const rawId = parts[parts.length - 1].replace('#', '').trim()
            let pId = rawId
            if (/^\d{4}-\d{2}-\d{2}$/.test(rawId)) {
              const matched = PUZZLES.find(p => p.date === rawId) || getDailyPuzzle(rawId)
              if (matched) pId = String(matched.id)
            }
            try {
              const entries = JSON.parse(row.value) as LeaderboardEntry[]
              if (Array.isArray(entries)) {
                for (const entry of entries) {
                  const cleanEmail = entry.email.toLowerCase().trim()
                  if (legacyRemappedKeys.has(`${cleanEmail}:${pId}`)) {
                    // Legacy dev play with mismatched word - skip associating with this puzzle
                    continue
                  }
                  const dedupKey = `${cleanEmail}:${pId}`
                  const existing = playRecordsMap.get(dedupKey)
                  if (existing) {
                    existing.hasWon = true
                    existing.status = 'won'
                    existing.score = Math.max(existing.score, entry.score)
                    existing.wonAt = entry.wonAt || existing.wonAt
                    if (entry.guessCount) existing.guessCount = entry.guessCount
                    if (entry.hintsUsed) existing.hintsUsed = entry.hintsUsed
                  } else {
                    const domain = extractEmailDomain(cleanEmail)
                    playRecordsMap.set(dedupKey, {
                      email: cleanEmail,
                      displayEmail: entry.displayEmail || cleanEmail,
                      domain,
                      puzzleId: pId,
                      date: getDateForPuzzleId(pId) || '',
                      score: entry.score,
                      guessCount: entry.guessCount,
                      guesses: [],
                      hintsUsed: entry.hintsUsed || 0,
                      hasWon: true,
                      status: 'won',
                      revealedCount: 0,
                      wonAt: entry.wonAt,
                      updatedAt: row.updated_at,
                      isDev: devSet.has(cleanEmail)
                    })
                  }
                }
              }
            } catch {}
          }
        }
      }
    } catch {}
  }

  // Also check MEMORY_STORE for leaderboard
  for (const [k, v] of MEMORY_STORE.entries()) {
    if (k.startsWith('leaderboard:')) {
      const parts = k.split(':')
      if (parts.length >= 3 && Array.isArray(v)) {
        const rawId = parts[parts.length - 1].replace('#', '').trim()
        let pId = rawId
        if (/^\d{4}-\d{2}-\d{2}$/.test(rawId)) {
          const matched = PUZZLES.find(p => p.date === rawId) || getDailyPuzzle(rawId)
          if (matched) pId = String(matched.id)
        }
        for (const entry of v as LeaderboardEntry[]) {
          const cleanEmail = entry.email.toLowerCase().trim()
          if (legacyRemappedKeys.has(`${cleanEmail}:${pId}`)) {
            continue
          }
          const dedupKey = `${cleanEmail}:${pId}`
          const existing = playRecordsMap.get(dedupKey)
          if (existing) {
            existing.hasWon = true
            existing.status = 'won'
            existing.score = Math.max(existing.score, entry.score)
            existing.wonAt = entry.wonAt || existing.wonAt
          } else {
            const domain = extractEmailDomain(cleanEmail)
            playRecordsMap.set(dedupKey, {
              email: cleanEmail,
              displayEmail: entry.displayEmail || cleanEmail,
              domain,
              puzzleId: pId,
              date: getDateForPuzzleId(pId) || '',
              score: entry.score,
              guessCount: entry.guessCount,
              guesses: [],
              hintsUsed: entry.hintsUsed || 0,
              hasWon: true,
              status: 'won',
              revealedCount: 0,
              wonAt: entry.wonAt,
              isDev: devSet.has(cleanEmail)
            })
          }
        }
      }
    }
  }

  const allPlays = Array.from(playRecordsMap.values()).sort((a, b) => {
    // Sort by puzzleId desc, then score desc, then guessCount asc
    const pDiff = Number(b.puzzleId) - Number(a.puzzleId)
    if (pDiff !== 0) return pDiff
    return b.score - a.score || a.guessCount - b.guessCount
  })

  // 3. Today's puzzle determination
  const todayPuzzle = getDailyPuzzle()
  const todayPlays = allPlays.filter(
    p => String(p.puzzleId) === String(todayPuzzle.id)
  )

  // 4. Selected puzzle determination
  let selectedPuzzleId = String(todayPuzzle.id)
  let selectedDate = todayPuzzle.date

  if (targetPuzzleOrDate) {
    const cleanTarget = String(targetPuzzleOrDate).replace(/^#/, '').trim()
    if (/^\d+$/.test(cleanTarget)) {
      selectedPuzzleId = cleanTarget
      selectedDate = getDateForPuzzleId(cleanTarget) || todayPuzzle.date
    } else if (/^\d{4}-\d{2}-\d{2}$/.test(cleanTarget)) {
      selectedDate = cleanTarget
      const p = PUZZLES.find(puzz => puzz.date === cleanTarget) || getDailyPuzzle(cleanTarget)
      selectedPuzzleId = String(p.id)
    }
  }

  const selectedPlays = allPlays.filter(
    p => String(p.puzzleId) === String(selectedPuzzleId)
  )

  // 5. Compute Stats helper
  const computeStats = (plays: PlayerScoreRecord[]) => {
    const totalPlayers = plays.length
    const wonPlays = plays.filter(p => p.hasWon)
    const totalWon = wonPlays.length
    const totalPlaying = plays.filter(p => p.status === 'playing').length
    const winRate = totalPlayers > 0 ? Math.round((totalWon / totalPlayers) * 100) : 0

    let avgScore = 0
    let avgGuesses = 0
    let topScore = 0
    let topPlayer = ''

    if (wonPlays.length > 0) {
      const sumScores = wonPlays.reduce((acc, p) => acc + p.score, 0)
      const sumGuesses = wonPlays.reduce((acc, p) => acc + p.guessCount, 0)
      avgScore = Math.round(sumScores / wonPlays.length)
      avgGuesses = Number((sumGuesses / wonPlays.length).toFixed(1))

      const best = wonPlays.reduce((max, p) => p.score > max.score ? p : max, wonPlays[0])
      topScore = best.score
      topPlayer = best.email
    }

    return {
      totalPlayers,
      totalWon,
      totalPlaying,
      winRate,
      avgScore,
      avgGuesses,
      topScore,
      topPlayer
    }
  }

  const todayStats = computeStats(todayPlays)
  const selectedPuzzleStats = computeStats(selectedPlays)

  // 6. Available Puzzles for dropdown
  const puzzleCounts = new Map<string, { date: string; playCount: number }>()

  // Determine max puzzle ID to show in dropdown:
  // Include at least today's puzzle, dev prescreen puzzle, selected puzzle, and anything with plays
  const devTodayPuzzle = getDailyPuzzle(undefined, { isDev: true })
  const maxPuzzleNum = Math.max(
    Number(devTodayPuzzle.id) || 44,
    Number(todayPuzzle.id) || 2,
    Number(selectedPuzzleId) || 1,
    ...allPlays.map(p => Number(p.puzzleId) || 0)
  )

  // Pre-populate all puzzles from 1 to maxPuzzleNum so all puzzle days can be inspected
  for (let i = 1; i <= maxPuzzleNum; i++) {
    const pId = String(i)
    const pDef = getPuzzleById(pId)
    const pDate = getDateForPuzzleId(pId) || pDef?.date || ''
    puzzleCounts.set(pId, { date: pDate, playCount: 0 })
  }

  // Count plays from allPlays
  for (const play of allPlays) {
    if (!/^\d+$/.test(play.puzzleId)) continue
    const existing = puzzleCounts.get(play.puzzleId)
    if (existing) {
      existing.playCount += 1
      if (!existing.date && play.date) existing.date = play.date
    } else {
      puzzleCounts.set(play.puzzleId, {
        date: play.date || getDateForPuzzleId(play.puzzleId) || '',
        playCount: 1
      })
    }
  }

  // Ensure today's puzzle has its proper date
  const todayEntry = puzzleCounts.get(String(todayPuzzle.id))
  if (todayEntry) todayEntry.date = todayPuzzle.date

  const availablePuzzles = Array.from(puzzleCounts.entries())
    .filter(([id]) => /^\d+$/.test(id))
    .map(([id, info]) => ({
      id,
      date: info.date,
      playCount: info.playCount
    }))
    .sort((a, b) => Number(b.id) - Number(a.id))

  // 7. Domain Rankings
  const domainMap = new Map<string, { players: Set<string>; scores: number[]; topScore: number }>()

  // Initialize with subscriber domains
  for (const sub of subscribers) {
    const d = getLeaderboardDomain(sub.domain)
    if (d && !domainMap.has(d)) {
      domainMap.set(d, { players: new Set(), scores: [], topScore: 0 })
    }
  }

  for (const play of allPlays) {
    if (!play.domain) continue
    const d = getLeaderboardDomain(play.domain)
    let dStats = domainMap.get(d)
    if (!dStats) {
      dStats = { players: new Set(), scores: [], topScore: 0 }
      domainMap.set(d, dStats)
    }
    dStats.players.add(play.email)
    if (play.hasWon && play.score > 0) {
      dStats.scores.push(play.score)
      if (play.score > dStats.topScore) dStats.topScore = play.score
    }
  }

  const domainRankings: DomainStats[] = Array.from(domainMap.entries())
    .map(([domain, data]) => {
      const subCount = subscribers.filter(s => getLeaderboardDomain(s.domain) === domain).length
      const avgScore = data.scores.length > 0
        ? Math.round(data.scores.reduce((a, b) => a + b, 0) / data.scores.length)
        : 0

      return {
        domain,
        playerCount: data.players.size,
        subscriberCount: subCount,
        avgScore,
        topScore: data.topScore
      }
    })
    .sort((a, b) => b.playerCount - a.playerCount || b.subscriberCount - a.subscriberCount)

  // 8. User Profiles & Settings Consolidation
  const userProfilesMap = new Map<string, any>()

  // A. Query D1 for user:profile:%
  if (db) {
    try {
      const profileRows = await db
        .prepare("SELECT key, value FROM kv_store WHERE key LIKE 'user:profile:%'")
        .all<{ key: string; value: string }>()

      if (profileRows && Array.isArray(profileRows.results)) {
        for (const row of profileRows.results) {
          try {
            const val = JSON.parse(row.value)
            const cleanEmail = (val.email || row.key.replace('user:profile:', '')).toLowerCase().trim()
            if (cleanEmail && cleanEmail.includes('@')) {
              userProfilesMap.set(cleanEmail, val)
            }
          } catch (_) {}
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Error querying D1 user profiles:', err)
    }
  }

  // B. Fallback to KV list if D1 didn't return profiles
  if (kv && userProfilesMap.size === 0 && typeof (kv as any).list === 'function') {
    try {
      let cursor: string | undefined = undefined
      let keys: string[] = []
      do {
        const listRes: any = await kv.list({ prefix: 'user:profile:', cursor })
        if (listRes?.keys) {
          keys.push(...listRes.keys.map((k: any) => k.name))
        }
        cursor = listRes?.list_complete ? undefined : listRes?.cursor
      } while (cursor && keys.length < 500)

      for (const k of keys) {
        const val = await kv.get(k, { type: 'json' })
        if (val) {
          const cleanEmail = ((val as any).email || k.replace('user:profile:', '')).toLowerCase().trim()
          if (cleanEmail && cleanEmail.includes('@')) {
            userProfilesMap.set(cleanEmail, val)
          }
        }
      }
    } catch (err) {
      console.warn('[Dashboard] Error querying KV user profiles:', err)
    }
  }

  // C. In-Memory Store
  for (const [k, v] of MEMORY_STORE.entries()) {
    if (k.startsWith('user:profile:')) {
      const cleanEmail = k.replace('user:profile:', '').toLowerCase().trim()
      if (cleanEmail && cleanEmail.includes('@')) {
        userProfilesMap.set(cleanEmail, v)
      }
    }
  }

  // Consolidated list of all known users across subscribers, plays, dev testers, and profile records
  const allUserEmails = new Set<string>()
  for (const sub of subscribers) {
    if (sub.email) allUserEmails.add(sub.email.toLowerCase().trim())
  }
  for (const play of allPlays) {
    if (play.email) allUserEmails.add(play.email.toLowerCase().trim())
  }
  for (const dev of devTesters) {
    if (dev) allUserEmails.add(dev.toLowerCase().trim())
  }
  for (const email of userProfilesMap.keys()) {
    allUserEmails.add(email)
  }

  const userProfiles: UserProfileSummary[] = Array.from(allUserEmails).map((cleanEmail) => {
    const domain = extractEmailDomain(cleanEmail)
    const saved = userProfilesMap.get(cleanEmail) || {}
    const subEntry = subscribers.find(s => s.email.toLowerCase().trim() === cleanEmail)
    const isSubscribed = subEntry ? subEntry.status === 'active' : false
    const isDev = devSet.has(cleanEmail)
    const showOnLeaderboard = typeof saved.showOnLeaderboard === 'boolean' ? saved.showOnLeaderboard : true
    const theme: 'light' | 'dark' = saved.theme === 'dark' ? 'dark' : 'light'

    // Aggregate plays for this user
    const userPlays = allPlays.filter(p => p.email === cleanEmail)
    const playedDates = Array.from(new Set([
      ...(Array.isArray(saved.playedDates) ? saved.playedDates : []),
      ...userPlays.map(p => p.date).filter(Boolean)
    ]))
    const playedPuzzles = Array.from(new Set([
      ...(Array.isArray(saved.playedPuzzles) ? saved.playedPuzzles.map(String) : []),
      ...userPlays.map(p => String(p.puzzleId)).filter(p => !p.startsWith('legacy-'))
    ]))
    const daysPlayed = Math.max(
      typeof saved.daysPlayed === 'number' ? saved.daysPlayed : 0,
      playedDates.length,
      playedPuzzles.length
    )

    const latestPlay = userPlays[0]
    const lastPlayed = latestPlay?.wonAt || latestPlay?.updatedAt || latestPlay?.date

    let accountToken: string | undefined = undefined
    try {
      accountToken = generateAccountToken(cleanEmail, process.env.AUTH_SECRET)
    } catch (_) {}

    const colorCombo = saved.colorCombo || 'amber-blue'
    const primaryColor = saved.primaryColor
    const secondaryColor = saved.secondaryColor

    return {
      email: cleanEmail,
      domain,
      showOnLeaderboard,
      theme,
      colorCombo,
      primaryColor,
      secondaryColor,
      daysPlayed,
      playedDates,
      playedPuzzles,
      isSubscribed,
      isDev,
      accountToken,
      lastPlayed
    }
  }).sort((a, b) => {
    // Active subscribers first, then days played desc, then email asc
    if (a.isSubscribed !== b.isSubscribed) return a.isSubscribed ? -1 : 1
    if (b.daysPlayed !== a.daysPlayed) return b.daysPlayed - a.daysPlayed
    return a.email.localeCompare(b.email)
  })

  return {
    todayPuzzle: {
      id: todayPuzzle.id,
      date: todayPuzzle.date,
      wordLength: todayPuzzle.word.length,
      definitionsCount: todayPuzzle.definitions.length
    },
    selectedPuzzle: {
      id: selectedPuzzleId,
      date: selectedDate
    },
    subscribers: {
      total: totalSubscribers,
      activeCount,
      unsubscribedCount,
      uniqueDomainsCount: domains.length,
      list: subscribers
    },
    todayStats,
    selectedPuzzleStats,
    selectedPlays,
    allPlays,
    availablePuzzles,
    domainRankings,
    devTesters,
    userProfiles,
    generatedAt: new Date().toISOString()
  }
}

export async function updateUserProfileSettings(
  storage: StorageBackend,
  email: string,
  updates: {
    showOnLeaderboard?: boolean
    theme?: 'light' | 'dark'
    colorCombo?: string
    status?: 'active' | 'unsubscribed'
    isDev?: boolean
  }
): Promise<{ success: boolean; profile?: UserProfileSummary; error?: string }> {
  const cleanEmail = (email || '').toLowerCase().trim()
  if (!cleanEmail || !cleanEmail.includes('@')) {
    return { success: false, error: 'A valid email address is required.' }
  }

  // 1. Update user settings (showOnLeaderboard, theme, colorCombo) if provided
  if (updates.showOnLeaderboard !== undefined || updates.theme !== undefined || updates.colorCombo !== undefined) {
    const current = await getUserSettings(storage, cleanEmail)
    if (updates.showOnLeaderboard !== undefined) {
      current.showOnLeaderboard = Boolean(updates.showOnLeaderboard)
    }
    if (updates.theme !== undefined) {
      current.theme = updates.theme === 'dark' ? 'dark' : 'light'
    }
    if (updates.colorCombo !== undefined) {
      current.colorCombo = updates.colorCombo
      const { primary, secondary } = parseColorCombo(updates.colorCombo)
      current.primaryColor = primary
      current.secondaryColor = secondary
    }
    await updateUserSettings(storage, current)
  }

  // 2. Update subscription status if provided
  if (updates.status !== undefined) {
    if (updates.status === 'active') {
      await addSubscriber(storage, cleanEmail)
    } else if (updates.status === 'unsubscribed') {
      await unsubscribeUser(storage, cleanEmail, false)
    }
  }

  // 3. Update dev prescreen status if provided
  if (updates.isDev !== undefined) {
    if (updates.isDev) {
      await addDevTester(storage, cleanEmail)
    } else {
      await removeDevTester(storage, cleanEmail)
    }
  }

  // 4. Return refreshed profile summary
  const stats = await getDashboardStats(storage)
  const profile = stats.userProfiles.find(p => p.email === cleanEmail)
  return { success: true, profile }
}
