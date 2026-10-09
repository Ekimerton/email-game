import type { Hono } from 'hono'
import { kvPut, withKeyLock, getLeaderboardDomain, type Bindings, type LeaderboardEntry } from '../core'
import {
  GAME_MESSAGES,
  formatPrettyDate,
  getDailyPuzzle,
  getPuzzleById,
  evaluateGuess,
  isPuzzleSynonym,
  calculateScore,
  buildStatePayload,
  getOrCreateGameState,
  type DailyPuzzle
} from '../game'
import {
  getUserEmail,
  extractDomain,
  formatDisplayEmail,
  getUserSettings,
  getDomainLeaderboard,
  updateDomainLeaderboard,
  isDevTester,
  recordUserSubmission,
  getUserStreak,
} from '../services'

export function registerGameApiRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Get game state
  app.get('/api/state', async (c) => {
    try {
      const userEmail = await getUserEmail(c)
      const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
      const dateParam = c.req.query('date')
      const target = puzzleParam || dateParam
      const isDev = await isDevTester(c.env, userEmail)
      const puzzle = getDailyPuzzle(target, { isDev })
      const stateKey = `game:${puzzle.date}:${userEmail}`

      const payload = await withKeyLock(stateKey, async () => {
        const { state } = await getOrCreateGameState(c.env, userEmail, target, { isDev })
        return buildStatePayload(state, puzzle)
      })

      return c.json(payload)
    } catch (error: any) {
      console.error('Error fetching game state:', error)
      return c.json({ error: 'Failed to fetch game state' }, 500)
    }
  })

  // Submit guess
  app.post('/api/guess', async (c) => {
    try {
      const body = await c.req.parseBody()
      const userEmail = await getUserEmail(c, body)
      const guess = (body['user-guess'] as string || '').toUpperCase().trim()
      const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id') || (body['puzzle'] as string) || (body['puzzleId'] as string) || (body['id'] as string)
      const dateParam = c.req.query('date') || (body['date'] as string)
      const target = puzzleParam || dateParam
      const domain = extractDomain(userEmail)
      const isDev = await isDevTester(c.env, userEmail)
      const puzzle = getDailyPuzzle(target, { isDev })
      const stateKey = `game:${puzzle.date}:${userEmail}`

      const payload = await withKeyLock(stateKey, async () => {
        const { state } = await getOrCreateGameState(
          c.env,
          userEmail,
          target,
          { isDev }
        )

        if (state.hasWon) {
          return buildStatePayload(state, puzzle)
        }

        const isSynonym = isPuzzleSynonym(puzzle, guess)

        if (!guess || (guess.length !== puzzle.word.length && !isSynonym)) {
          state.lastMessage = GAME_MESSAGES.invalidLength(puzzle.word.length)
          state.version = (state.version || 0) + 1
          state.updatedAt = new Date().toISOString()
          await kvPut(c.env, stateKey, state)
          return buildStatePayload(state, puzzle, state.lastMessage)
        }

        const alreadyGuessed = (state.guessedWords || []).some(
          (w) => w.toUpperCase() === guess
        ) || (state.guessesHistory || []).some(
          (g) => g.guess.toUpperCase() === guess
        )

        if (alreadyGuessed) {
          state.lastMessage = GAME_MESSAGES.alreadyGuessed(guess)
          state.version = (state.version || 0) + 1
          state.updatedAt = new Date().toISOString()
          await kvPut(c.env, stateKey, state)
          return buildStatePayload(state, puzzle, state.lastMessage)
        }

        const statuses = evaluateGuess(puzzle.word, guess)
        const isCorrect = guess === puzzle.word.toUpperCase()

        const newMask = [...state.letterMask]
        for (let i = 0; i < puzzle.word.length; i++) {
          if (statuses[i] === 'correct') {
            newMask[i] = puzzle.word[i]
          }
        }

        state.guessCount += 1
        if (isSynonym) {
          state.synonymGuessesCount = (state.synonymGuessesCount || 0) + 1
        }
        state.guessesHistory.push({ guess, statuses })
        if (!state.guessedWords) {
          state.guessedWords = []
        }
        state.guessedWords.push(guess)
        state.letterMask = newMask
        state.version = (state.version || 0) + 1
        state.updatedAt = new Date().toISOString()
        await recordUserSubmission(c.env, userEmail, puzzle.id)

        if (isCorrect) {
          state.hasWon = true
          state.revealedCount = puzzle.definitions.length
          state.score = calculateScore(
            state.guessCount,
            state.hintsUsed,
            state.synonymGuessesCount || 0,
            true
          )
          state.letterMask = puzzle.word.split('')
          state.lastMessage = GAME_MESSAGES.puzzleSolved(puzzle.word, state.guessCount, state.score)

          const leaderboardDomain = getLeaderboardDomain(userEmail)

          const leaderboardEntry: LeaderboardEntry = {
            email: userEmail,
            displayEmail: formatDisplayEmail(userEmail),
            score: state.score,
            guessCount: state.guessCount,
            hintsUsed: state.hintsUsed,
            wonAt: new Date().toISOString(),
          }

          const updatedLeaderboard = await updateDomainLeaderboard(
            c.env,
            leaderboardDomain,
            puzzle.id,
            leaderboardEntry
          )

          const rank = updatedLeaderboard.findIndex((e) => e.email === userEmail) + 1

          state.shareText = `Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)})\nSolved in ${state.guessCount} guess${state.guessCount > 1 ? 'es' : ''
            }!\nScore: ${state.score} pts | Org Rank: #${rank} (${leaderboardDomain})\n\nPlay at: https://inboxed.fun`
        } else {
          if (state.revealedCount < puzzle.definitions.length) {
            state.revealedCount += 1
          }
          state.score = calculateScore(
            state.guessCount,
            state.hintsUsed,
            state.synonymGuessesCount || 0,
            false
          )
          if (isSynonym) {
            state.lastMessage = GAME_MESSAGES.synonymGuess(guess)
          } else {
            state.lastMessage = GAME_MESSAGES.incorrectGuess(guess)
          }
        }

        await kvPut(c.env, stateKey, state)
        return buildStatePayload(state, puzzle)
      })

      return c.json(payload)
    } catch (error: any) {
      console.error('Error submitting guess:', error)
      return c.json({ error: 'Failed to process guess' }, 500)
    }
  })

  // Request Letter Hint
  app.post('/api/hint', async (c) => {
    try {
      const body = await c.req.parseBody()
      const userEmail = await getUserEmail(c, body)
      const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id') || (body['puzzle'] as string) || (body['puzzleId'] as string) || (body['id'] as string)
      const dateParam = c.req.query('date') || (body['date'] as string)
      const target = puzzleParam || dateParam
      const isDev = await isDevTester(c.env, userEmail)
      const puzzle = getDailyPuzzle(target, { isDev })
      const stateKey = `game:${puzzle.date}:${userEmail}`

      const payload = await withKeyLock(stateKey, async () => {
        const { state } = await getOrCreateGameState(
          c.env,
          userEmail,
          target,
          { isDev }
        )

        if (state.hasWon) {
          return buildStatePayload(state, puzzle)
        }

        const unrevealedIndices: number[] = []
        for (let i = 0; i < puzzle.word.length; i++) {
          if (state.letterMask[i] === '_') {
            unrevealedIndices.push(i)
          }
        }

        if (unrevealedIndices.length === 0) {
          state.lastMessage = GAME_MESSAGES.allLettersRevealed
          state.version = (state.version || 0) + 1
          state.updatedAt = new Date().toISOString()
          await kvPut(c.env, stateKey, state)
          return buildStatePayload(state, puzzle)
        }

        const targetIdx = unrevealedIndices[0]
        const updatedMask = [...state.letterMask]
        updatedMask[targetIdx] = puzzle.word[targetIdx]

        state.hintsUsed += 1
        state.letterMask = updatedMask
        state.score = calculateScore(
          state.guessCount,
          state.hintsUsed,
          state.synonymGuessesCount || 0,
          state.hasWon
        )
        state.lastMessage = GAME_MESSAGES.hintRevealed(targetIdx + 1, puzzle.word[targetIdx])
        state.version = (state.version || 0) + 1
        state.updatedAt = new Date().toISOString()
        await recordUserSubmission(c.env, userEmail, puzzle.id)

        await kvPut(c.env, stateKey, state)
        return buildStatePayload(state, puzzle)
      })

      return c.json(payload)
    } catch (error: any) {
      console.error('Error revealing hint:', error)
      return c.json({ error: 'Failed to reveal hint' }, 500)
    }
  })

  // Endpoint to fetch domain leaderboard directly (with privacy filter check)
  app.get('/api/leaderboard', async (c) => {
    try {
      const userEmail = await getUserEmail(c)
      const requestedDomain = c.req.query('domain')
      const domain = getLeaderboardDomain(requestedDomain || userEmail)
      const isDev = await isDevTester(c.env, userEmail)
      const puzzleIdParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
      const dateParam = c.req.query('date')

      let puzzle: DailyPuzzle
      if (puzzleIdParam) {
        puzzle = getDailyPuzzle(puzzleIdParam, { isDev }) || getPuzzleById(puzzleIdParam)
      } else {
        puzzle = getDailyPuzzle(dateParam, { isDev })
      }

      const leaderboard = await getDomainLeaderboard(c.env, domain, puzzle.id, puzzle.date)

      // Filter out users who chose to hide themselves from the leaderboard
      const visibleEntriesWithSettings = await Promise.all(
        leaderboard.map(async (entry) => {
          const userSettings = await getUserSettings(c.env, entry.email)
          return { entry, showOnLeaderboard: userSettings.showOnLeaderboard }
        })
      )

      const allItems = await Promise.all(
        visibleEntriesWithSettings
          .filter(item => item.showOnLeaderboard)
          .map(async (item, index) => {
            const isCurrentPlayer = item.entry.email.toLowerCase() === userEmail.toLowerCase()
            let streak: number | undefined = undefined
            let streakBadge: string | undefined = undefined
            let hasStreak = false

            if (isCurrentPlayer) {
              const userStreak = await getUserStreak(c.env, userEmail, puzzle.id)
              if (userStreak >= 3) {
                streak = userStreak
                streakBadge = `🔥 ${userStreak} days`
                hasStreak = true
              }
            }

            return {
              rank: index + 1,
              displayEmail: formatDisplayEmail(item.entry.email),
              score: `${item.entry.score} points`,
              email: item.entry.email,
              isCurrentPlayer,
              hasStreak,
              ...(streak !== undefined ? { streak, streakBadge } : {})
            }
          })
      )

      const top5 = allItems.slice(0, 5)
      const currentPlayerItem = allItems.find(item => item.isCurrentPlayer)

      const items = [...top5]
      if (currentPlayerItem && !top5.some(item => item.email.toLowerCase() === userEmail.toLowerCase())) {
        items.push(currentPlayerItem)
      }

      const { state: userState } = await getOrCreateGameState(c.env, userEmail, puzzle.date, { isDev })

      const hasWon = Boolean(userState.hasWon || currentPlayerItem)

      const payload = {
        domain,
        date: puzzle.date,
        puzzleId: puzzle.id,
        hasWon,
        players: items
      }

      return c.json({
        items: [payload],
        ...payload
      })
    } catch (error: any) {
      return c.json({ items: [] })
    }
  })
}
