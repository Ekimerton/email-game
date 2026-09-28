import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/index'
import { MEMORY_STORE, withKeyLock } from '../src/core'
import { getDailyPuzzle } from '../src/game'
import { updateDomainLeaderboard, getDomainLeaderboard } from '../src/services/leaderboard'
import { addSubscriber, getSubscribers } from '../src/services/subscribers'
import { recordUserActivity, getUserSettings } from '../src/services/userService'

describe('Race Condition Resistance Across State Changes', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  it('should safely handle concurrent /api/guess and /api/hint without losing either state change', async () => {
    const testEmail = `race_user_${Date.now()}@firm.com`
    // Use puzzle date 2026-08-17 (target word: LOAD)
    const puzzleDate = '2026-08-17'
    const puzzle = getDailyPuzzle(puzzleDate)
    expect(puzzle.word).toBe('LOAD')

    // Submit a wrong guess ("SLOW") and request a letter hint simultaneously
    const [guessRes, hintRes] = await Promise.all([
      app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'SLOW' }).toString(),
      }),
      app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    ])

    expect(guessRes.status).toBe(200)
    expect(hintRes.status).toBe(200)

    const guessData = await guessRes.json() as any
    const hintData = await hintRes.json() as any

    expect(guessData.version).toBeGreaterThan(0)
    expect(hintData.version).toBeGreaterThan(0)

    // Now fetch the final persisted state
    const stateRes = await app.request(
      `/api/state?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`
    )
    expect(stateRes.status).toBe(200)
    const finalState = await stateRes.json() as any

    // 1. Both state changes must be preserved
    expect(finalState.guessCount).toBe(1)
    expect(finalState.guessesHistory.length).toBe(1)
    expect(finalState.guessesHistory[0].guess).toBe('SLOW')
    expect(finalState.guessedWords).toContain('SLOW')
    expect(finalState.hintsUsed).toBe(1)

    // 2. Score must reflect both the wrong guess (-100) and the hint (-150): 1000 - 100 - 150 = 750
    expect(finalState.score).toBe(750)

    // 3. Revealed clue count must reflect the wrong guess (unlocked clue #2)
    expect(finalState.revealedCount).toBe(2)

    // 4. Letter mask must contain the hint letter
    expect(finalState.letterMask).toContain('L')

    // 5. Version must have incremented twice (0 -> 1 -> 2)
    expect(finalState.version).toBe(2)
  })

  it('should safely handle hint requested right before guess is processed concurrently', async () => {
    const testEmail = `reverse_race_${Date.now()}@firm.com`
    const puzzleDate = '2026-08-17' // word: LOAD

    // Fire hint and guess in parallel
    const [hintRes, guessRes] = await Promise.all([
      app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
      app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'BOAT' }).toString(),
      }),
    ])

    expect(hintRes.status).toBe(200)
    expect(guessRes.status).toBe(200)

    const stateRes = await app.request(
      `/api/state?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`
    )
    const finalState = await stateRes.json() as any

    expect(finalState.guessCount).toBe(1)
    expect(finalState.hintsUsed).toBe(1)
    expect(finalState.guessesHistory.length).toBe(1)
    expect(finalState.guessesHistory[0].guess).toBe('BOAT')
    expect(finalState.score).toBe(750)
    expect(finalState.version).toBe(2)
  })

  it('should handle rapid duplicate guesses without counting the duplicate or double penalizing', async () => {
    const testEmail = `duplicate_race_${Date.now()}@firm.com`
    const puzzleDate = '2026-08-17' // word: LOAD

    // Simulate rapid double click on Submit Guess with the exact same guess
    const [firstRes, secondRes] = await Promise.all([
      app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'MINT' }).toString(),
      }),
      app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'MINT' }).toString(),
      }),
    ])

    expect(firstRes.status).toBe(200)
    expect(secondRes.status).toBe(200)

    const firstData = await firstRes.json() as any
    const secondData = await secondRes.json() as any

    // One of them is the actual guess, the second is caught as alreadyGuessed
    const results = [firstData, secondData]
    const alreadyGuessedResult = results.find(r => r.lastMessage && r.lastMessage.includes('already guessed'))
    expect(alreadyGuessedResult).toBeDefined()

    const stateRes = await app.request(
      `/api/state?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`
    )
    const finalState = await stateRes.json() as any

    // Guess count should strictly be 1, penalty only once (900 pts)
    expect(finalState.guessCount).toBe(1)
    expect(finalState.guessesHistory.length).toBe(1)
    expect(finalState.score).toBe(900)
  })

  it('should handle concurrent letter hint requests without revealing the same letter twice', async () => {
    const testEmail = `multi_hint_${Date.now()}@firm.com`
    const puzzleDate = '2026-08-17' // word: LOAD (4 letters)

    // Request two hints simultaneously
    const [hint1Res, hint2Res] = await Promise.all([
      app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
      app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }),
    ])

    expect(hint1Res.status).toBe(200)
    expect(hint2Res.status).toBe(200)

    const stateRes = await app.request(
      `/api/state?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`
    )
    const finalState = await stateRes.json() as any

    // Exactly 2 hints used, 2 letters revealed ('L' and 'O')
    expect(finalState.hintsUsed).toBe(2)
    expect(finalState.letterMask[0]).toBe('L')
    expect(finalState.letterMask[1]).toBe('O')
    expect(finalState.letterMask[2]).toBe('_')
    expect(finalState.letterMask[3]).toBe('_')
    expect(finalState.score).toBe(700) // 1000 - 300 = 700
    expect(finalState.version).toBe(2)
  })

  it('should prevent race conditions on concurrent domain leaderboard updates', async () => {
    const domain = 'acmecorp.com'
    const date = '2026-09-27'

    const entries = [
      {
        email: 'alice@acmecorp.com',
        displayEmail: 'alice@acmecorp.com',
        score: 950,
        guessCount: 2,
        hintsUsed: 0,
        wonAt: new Date().toISOString(),
      },
      {
        email: 'bob@acmecorp.com',
        displayEmail: 'bob@acmecorp.com',
        score: 900,
        guessCount: 3,
        hintsUsed: 0,
        wonAt: new Date().toISOString(),
      },
      {
        email: 'charlie@acmecorp.com',
        displayEmail: 'charlie@acmecorp.com',
        score: 850,
        guessCount: 2,
        hintsUsed: 1,
        wonAt: new Date().toISOString(),
      },
    ]

    // Simulate 3 coworkers solving the puzzle at the exact same moment
    await Promise.all(
      entries.map(entry => updateDomainLeaderboard(undefined, domain, date, entry))
    )

    const finalLeaderboard = await getDomainLeaderboard(undefined, domain, date)
    expect(finalLeaderboard.length).toBe(3)
    const emails = finalLeaderboard.map(e => e.email)
    expect(emails).toContain('alice@acmecorp.com')
    expect(emails).toContain('bob@acmecorp.com')
    expect(emails).toContain('charlie@acmecorp.com')
    // Should be sorted by score descending
    expect(finalLeaderboard[0].email).toBe('alice@acmecorp.com')
  })

  it('should prevent race conditions on concurrent subscriber additions', async () => {
    const emails = [
      'sub1@company.com',
      'sub2@company.com',
      'sub3@company.com',
      'sub4@company.com',
      'sub5@company.com',
    ]

    // Simulate 5 simultaneous double opt-in confirmations
    await Promise.all(
      emails.map(email => addSubscriber(undefined, email))
    )

    const subscribers = await getSubscribers(undefined)
    expect(subscribers.length).toBe(5)
    for (const email of emails) {
      const match = subscribers.find(s => s.email === email)
      expect(match).toBeDefined()
      expect(match?.status).toBe('active')
    }
  })

  it('should prevent race conditions on concurrent user activity tracking', async () => {
    const email = 'active_user@firm.com'
    const dates = ['2026-09-20', '2026-09-21', '2026-09-22', '2026-09-23']

    // Simulate concurrent activity tracking across multiple tabs / email opens
    await Promise.all(
      dates.map(date => recordUserActivity(undefined, email, date))
    )

    const profile = await getUserSettings(undefined, email)
    expect(profile.daysPlayed).toBe(4)
    for (const date of dates) {
      expect(profile.playedDates).toContain(date)
    }
  })

  it('should verify withKeyLock executes sequentially and releases properly on error', async () => {
    const order: number[] = []

    const p1 = withKeyLock('test-key', async () => {
      await new Promise(r => setTimeout(r, 50))
      order.push(1)
    })

    const p2 = withKeyLock('test-key', async () => {
      order.push(2)
      throw new Error('Task 2 failed')
    })

    const p3 = withKeyLock('test-key', async () => {
      order.push(3)
    })

    await p1
    await expect(p2).rejects.toThrow('Task 2 failed')
    await p3

    expect(order).toEqual([1, 2, 3])
  })
})
