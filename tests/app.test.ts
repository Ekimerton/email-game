import { describe, it, expect } from 'vitest'
import { getDailyPuzzle } from '../src/puzzles'
import { app, getFallbackHtml } from '../src/index'
import { EMAIL_HTML } from '../src/emailHtml'

describe('Hono App & Layout Calculations', () => {
  it('should generate valid daily puzzle data for today', () => {
    const puzzle = getDailyPuzzle()
    expect(puzzle).toBeDefined()
    expect(puzzle.word.length).toBeGreaterThan(0)
    expect(puzzle.definitions.length).toBeGreaterThan(0)
  })

  it('should render straightforward fallback HTML with invitation message and play link in a single card', () => {
    const html = getFallbackHtml({
      email: 'testuser@nvidia.engineering',
      domain: 'nvidia.engineering',
      daysPlayed: 5,
      coworkerCount: 12,
      playUrl: 'https://email-game.teamify.workers.dev/?email=testuser%40nvidia.engineering',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('WORD GAME')
    expect(html).toContain('testuser@nvidia.engineering')
    expect(html).toContain('is inviting you to play word game, the daily game you can play in your email. Click below to start playing.')
    expect(html).toContain('Play Word Game')
    expect(html).toContain('https://email-game.teamify.workers.dev')
    expect(html).toContain('background-color: #f4f4f5')
    expect(html).toContain('background: #ffffff')
    expect(html).toContain('border: 1px solid #e4e4e7')
    expect(html).toContain('Manage Account &amp; Preferences')
  })

  it('should include the daily word game header in h4 and ticket stub divider in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('<h4 class="game-header">Word Game #1</h4>')
    expect(EMAIL_HTML).toContain('ticket-stub-divider')
    expect(EMAIL_HTML).toContain("Have someone you think would make a good addition to the leaderboard? Forward this email to them!")
  })
})

describe('Duplicate Guess Feedback & State Handling', () => {
  it('should reject already guessed words without counting the guess and return an error feedback', async () => {
    const testEmail = `player_${Date.now()}@example.com`
    const puzzle = getDailyPuzzle()
    const wordLen = puzzle.word.length

    // Generate two incorrect dummy words of correct length
    const dummyWrongGuess1 = 'Z'.repeat(wordLen)
    const dummyWrongGuess2 = 'X'.repeat(wordLen)

    // 1. Check initial state
    const initStateRes = await app.request(`/api/state?email=${encodeURIComponent(testEmail)}`)
    expect(initStateRes.status).toBe(200)
    const initState = await initStateRes.json() as any
    expect(initState.guessCount).toBe(0)
    expect(initState.guessedWords).toEqual([])
    expect(initState.revealedCount).toBe(1)

    // 2. Submit first incorrect guess
    const firstGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': dummyWrongGuess1 }).toString(),
    })
    expect(firstGuessRes.status).toBe(200)
    const firstGuessData = await firstGuessRes.json() as any
    expect(firstGuessData.guessCount).toBe(1)
    expect(firstGuessData.revealedCount).toBe(2)
    expect(firstGuessData.guessedWords).toEqual([dummyWrongGuess1])
    expect(firstGuessData.lastMessage).toContain(`"${dummyWrongGuess1}" is incorrect`)

    // 3. Submit duplicate guess (exact same uppercase)
    const dupGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': dummyWrongGuess1 }).toString(),
    })
    expect(dupGuessRes.status).toBe(200)
    const dupGuessData = await dupGuessRes.json() as any
    expect(dupGuessData.guessCount).toBe(1) // Not incremented
    expect(dupGuessData.revealedCount).toBe(2) // Not incremented
    expect(dupGuessData.guessedWords).toEqual([dummyWrongGuess1]) // Not duplicated
    expect(dupGuessData.lastMessage).toBe(`You already guessed "${dummyWrongGuess1}".`)
    expect(dupGuessData.error).toBe(`You already guessed "${dummyWrongGuess1}".`)

    // 4. Submit duplicate guess in lowercase
    const dupLowerRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': dummyWrongGuess1.toLowerCase() }).toString(),
    })
    expect(dupLowerRes.status).toBe(200)
    const dupLowerData = await dupLowerRes.json() as any
    expect(dupLowerData.guessCount).toBe(1) // Still 1
    expect(dupLowerData.revealedCount).toBe(2) // Still 2
    expect(dupLowerData.guessedWords).toEqual([dummyWrongGuess1])
    expect(dupLowerData.lastMessage).toBe(`You already guessed "${dummyWrongGuess1}".`)

    // 5. Submit a new, different incorrect guess
    const secondGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': dummyWrongGuess2 }).toString(),
    })
    expect(secondGuessRes.status).toBe(200)
    const secondGuessData = await secondGuessRes.json() as any
    expect(secondGuessData.guessCount).toBe(2) // Incremented to 2
    expect(secondGuessData.revealedCount).toBe(3) // Incremented to 3
    expect(secondGuessData.guessedWords).toEqual([dummyWrongGuess1, dummyWrongGuess2])
    expect(secondGuessData.lastMessage).toContain(`"${dummyWrongGuess2}" is incorrect`)
  })
})


