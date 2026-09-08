import { describe, it, expect } from 'vitest'
import { app, resetUserDayState } from '../src/index'
import { getDailyPuzzle } from '../src/puzzleLogic'

describe('Reset User Day Helper & Endpoint', () => {
  it('should reset user game state back to initial state after guesses have been made', async () => {
    const testEmail = `reset_test_${Date.now()}@example.com`
    const puzzle = getDailyPuzzle()
    const wrongGuess = 'Z'.repeat(puzzle.word.length)

    // 1. Submit an incorrect guess to change state
    const guessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': wrongGuess }).toString(),
    })
    expect(guessRes.status).toBe(200)
    const guessData = (await guessRes.json()) as any
    expect(guessData.guessCount).toBe(1)
    expect(guessData.guessedWords).toContain(wrongGuess)

    // Verify state endpoint shows 1 guess
    const stateBefore = await (await app.request(`/api/state?email=${encodeURIComponent(testEmail)}`)).json() as any
    expect(stateBefore.guessCount).toBe(1)

    // 2. Call reset endpoint via POST
    const resetRes = await app.request('/api/admin/reset-user-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, date: puzzle.date }),
    })
    expect(resetRes.status).toBe(200)
    const resetData = (await resetRes.json()) as any
    expect(resetData.success).toBe(true)
    expect(resetData.details.gameStateDeleted).toBe(true)

    // 3. Verify state endpoint now returns fresh initial state
    const stateAfter = await (await app.request(`/api/state?email=${encodeURIComponent(testEmail)}`)).json() as any
    expect(stateAfter.guessCount).toBe(0)
    expect(stateAfter.guessedWords).toEqual([])
    expect(stateAfter.revealedCount).toBe(1)
    expect(stateAfter.hasWon).toBe(false)
  })

  it('should remove user from domain leaderboard and profile played dates upon reset', async () => {
    const testEmail = `winner_${Date.now()}@testcorp.com`
    const puzzle = getDailyPuzzle()

    // 1. Solve the puzzle to win and enter domain leaderboard
    const winRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString(),
    })
    expect(winRes.status).toBe(200)
    const winData = (await winRes.json()) as any
    expect(winData.hasWon).toBe(true)

    // Check leaderboard contains this user
    const lbBeforeRes = await app.request(`/api/leaderboard?domain=testcorp.com&date=${puzzle.date}`)
    const lbBefore = (await lbBeforeRes.json()) as any
    const inLbBefore = lbBefore.items?.[0]?.players?.some((e: any) => e.email === testEmail)
    expect(inLbBefore).toBe(true)

    // 2. Reset user day using resetUserDayState
    const resetResult = await resetUserDayState(undefined, testEmail, puzzle.date)
    expect(resetResult.success).toBe(true)
    expect(resetResult.details.removedFromLeaderboard).toBe(true)

    // 3. Verify leaderboard no longer contains user
    const lbAfterRes = await app.request(`/api/leaderboard?domain=testcorp.com&date=${puzzle.date}`)
    const lbAfter = (await lbAfterRes.json()) as any
    const inLbAfter = lbAfter.items?.[0]?.players?.some((e: any) => e.email === testEmail)
    expect(inLbAfter).toBe(false)
  })

  it('should support reset via GET query parameters as well', async () => {
    const testEmail = `get_reset_${Date.now()}@test.org`
    const puzzle = getDailyPuzzle()

    const res = await app.request(`/api/admin/reset-user-day?email=${encodeURIComponent(testEmail)}&date=${puzzle.date}`)
    expect(res.status).toBe(200)
    const data = (await res.json()) as any
    expect(data.success).toBe(true)
    expect(data.email).toBe(testEmail)
    expect(data.date).toBe(puzzle.date)
  })

  it('should reject requests without a valid email', async () => {
    const res = await app.request('/api/admin/reset-user-day', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    })
    expect(res.status).toBe(400)
    const data = (await res.json()) as any
    expect(data.success).toBe(false)
    expect(data.error).toContain('valid email')
  })
})
