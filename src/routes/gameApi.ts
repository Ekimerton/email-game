import type { Hono } from 'hono'
import { kvPut, type Bindings, type LeaderboardEntry } from '../core'
import {
  GAME_MESSAGES,
  formatPrettyDate,
  getDailyPuzzle,
  evaluateGuess,
  isPuzzleSynonym,
  calculateScore,
  buildStatePayload,
  getOrCreateGameState
} from '../game'
import {
  getUserEmail,
  extractDomain,
  formatDisplayEmail,
  getUserSettings,
  getDomainLeaderboard,
  updateDomainLeaderboard
} from '../services'

export function registerGameApiRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Get game state
  app.get('/api/state', async (c) => {
    try {
      const userEmail = await getUserEmail(c)
      const dateParam = c.req.query('date')
      const { state, puzzle } = await getOrCreateGameState(c.env?.GAME_STATE_KV, userEmail, dateParam)

      return c.json(buildStatePayload(state, puzzle))
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
      const dateParam = c.req.query('date')
      const domain = extractDomain(userEmail)

      const { state, puzzle, stateKey } = await getOrCreateGameState(
        c.env?.GAME_STATE_KV,
        userEmail,
        dateParam
      )

      if (state.hasWon) {
        return c.json(buildStatePayload(state, puzzle))
      }

      const isSynonym = isPuzzleSynonym(puzzle, guess)

      if (!guess || (guess.length !== puzzle.word.length && !isSynonym)) {
        state.lastMessage = GAME_MESSAGES.invalidLength(puzzle.word.length)
        await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
        return c.json(buildStatePayload(state, puzzle, state.lastMessage))
      }

      const alreadyGuessed = (state.guessedWords || []).some(
        (w) => w.toUpperCase() === guess
      ) || (state.guessesHistory || []).some(
        (g) => g.guess.toUpperCase() === guess
      )

      if (alreadyGuessed) {
        state.lastMessage = GAME_MESSAGES.alreadyGuessed(guess)
        await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
        return c.json(buildStatePayload(state, puzzle, state.lastMessage))
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

        const leaderboardEntry: LeaderboardEntry = {
          email: userEmail,
          displayEmail: formatDisplayEmail(userEmail),
          score: state.score,
          guessCount: state.guessCount,
          hintsUsed: state.hintsUsed,
          wonAt: new Date().toISOString(),
        }

        const updatedLeaderboard = await updateDomainLeaderboard(
          c.env?.GAME_STATE_KV,
          domain,
          puzzle.date,
          leaderboardEntry
        )

        const rank = updatedLeaderboard.findIndex((e) => e.email === userEmail) + 1

        state.shareText = `Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)})\nSolved in ${state.guessCount} guess${state.guessCount > 1 ? 'es' : ''
          }!\nScore: ${state.score} pts | Org Rank: #${rank} (${domain})\n\nPlay at: https://inboxed.fun`
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

      await kvPut(c.env?.GAME_STATE_KV, stateKey, state)

      return c.json(buildStatePayload(state, puzzle))
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
      const dateParam = c.req.query('date')

      const { state, puzzle, stateKey } = await getOrCreateGameState(
        c.env?.GAME_STATE_KV,
        userEmail,
        dateParam
      )

      if (state.hasWon) {
        return c.json(buildStatePayload(state, puzzle))
      }

      const unrevealedIndices: number[] = []
      for (let i = 0; i < puzzle.word.length; i++) {
        if (state.letterMask[i] === '_') {
          unrevealedIndices.push(i)
        }
      }

      if (unrevealedIndices.length === 0) {
        state.lastMessage = GAME_MESSAGES.allLettersRevealed
        return c.json(buildStatePayload(state, puzzle))
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

      await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
      return c.json(buildStatePayload(state, puzzle))
    } catch (error: any) {
      console.error('Error revealing hint:', error)
      return c.json({ error: 'Failed to reveal hint' }, 500)
    }
  })

  // Endpoint to fetch domain leaderboard directly (with privacy filter check)
  app.get('/api/leaderboard', async (c) => {
    try {
      const userEmail = await getUserEmail(c)
      const domain = c.req.query('domain') || extractDomain(userEmail)
      const dateStr = c.req.query('date') || getDailyPuzzle().date
      const leaderboard = await getDomainLeaderboard(c.env?.GAME_STATE_KV, domain, dateStr)

      // Filter out users who chose to hide themselves from the leaderboard
      const visibleEntriesWithSettings = await Promise.all(
        leaderboard.map(async (entry) => {
          const userSettings = await getUserSettings(c.env?.GAME_STATE_KV, entry.email)
          return { entry, showOnLeaderboard: userSettings.showOnLeaderboard }
        })
      )

      const allItems = visibleEntriesWithSettings
        .filter(item => item.showOnLeaderboard)
        .map((item, index) => {
          const guessWord = item.entry.guessCount === 1 ? 'guess' : 'guesses'
          return {
            rank: index + 1,
            displayEmail: formatDisplayEmail(item.entry.email),
            score: `${item.entry.score} points • ${item.entry.guessCount} ${guessWord}`,
            email: item.entry.email,
            isCurrentPlayer: item.entry.email.toLowerCase() === userEmail.toLowerCase()
          }
        })

      const top5 = allItems.slice(0, 5)
      const currentPlayerItem = allItems.find(item => item.isCurrentPlayer)

      const items = [...top5]
      if (currentPlayerItem && !top5.some(item => item.email.toLowerCase() === userEmail.toLowerCase())) {
        items.push(currentPlayerItem)
      }

      const { state: userState } = await getOrCreateGameState(c.env?.GAME_STATE_KV, userEmail, dateStr)

      const payload = {
        domain,
        date: dateStr,
        hasWon: userState.hasWon,
        players: items
      }

      return c.json({
        items: [payload]
      })
    } catch (error: any) {
      return c.json({ items: [] })
    }
  })
}
