import { describe, it, expect } from 'vitest'
import { getDailyPuzzle } from '../src/puzzleLogic'
import { app, getFallbackHtml, calculateScore, isPuzzleSynonym } from '../src/index'
import { EMAIL_HTML } from '../src/emailHtml'

describe('Hono App & Layout Calculations', () => {
  it('should generate valid daily puzzle data for today', () => {
    const puzzle = getDailyPuzzle()
    expect(puzzle).toBeDefined()
    expect(puzzle.word.length).toBeGreaterThan(0)
    expect(puzzle.definitions.length).toBeGreaterThan(0)
  })

  it('should render the fallback invitation and compatibility help in a game-style card', () => {
    const html = getFallbackHtml({
      email: 'testuser@nvidia.engineering',
      domain: 'nvidia.engineering',
      daysPlayed: 5,
      coworkerCount: 12,
      playerCount: 30,
      playUrl: 'https://email-game.teamify.workers.dev/?email=testuser%40nvidia.engineering',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('WORD GAME')
    expect(html).toContain('testuser@nvidia.engineering')
    expect(html).toContain('is inviting you to play Word Game, the daily word game in your inbox.')
    expect(html).toContain('Join 12 coworkers playing in the nvidia.engineering org.')
    expect(html).toContain('Sign up to play →')
    expect(html).toContain('Seeing this while trying to load the game?')
    expect(html).toContain('Your email client might not be supported.')
    expect(html).toContain('This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.')
    expect(html).toContain('update your account preferences')
    expect(html).toContain('https://email-game.teamify.workers.dev')
    expect(html).toContain('background-color: #ffffff')
    expect(html).toContain('background-color: #f4f4f5')
    expect(html).toContain('border: 1px solid #e4e4e7')
    expect(html).toContain('border-top: 1px solid #e4e4e7')
    expect(html).toContain('update your account preferences')
  })

  it('should show the player count for invitations from common email providers', () => {
    const html = getFallbackHtml({
      email: 'you@gmail.com',
      domain: 'gmail.com',
      daysPlayed: 1,
      coworkerCount: 0,
      playerCount: 30,
      playUrl: 'https://email-game.teamify.workers.dev/',
    })

    expect(html).toContain('Join 30 players playing the game today.')
    expect(html).not.toContain('coworkers playing')
  })

  it('should use the public HTTPS origin for fallback links when forceHttps is enabled', async () => {
    const response = await app.request('/fallback?email=player@example.com&forceHttps=true')
    const html = await response.text()

    expect(html).toContain('https://email-game.teamify.workers.dev/')
    expect(html).not.toContain('http://localhost')
  })

  it('should include the daily word game header in h4 and ticket stub divider in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('<h4 class="game-header">Word Game #1</h4>')
    expect(EMAIL_HTML).toContain('ticket-stub-divider')
    expect(EMAIL_HTML).toContain("Have someone you think would like this game? Forward this email to them!")
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

describe('Synonym Guess Scoring & Feedback System', () => {
  it('should calculate scores accurately with -25 penalty for synonyms instead of -100', () => {
    // 1st guess solve: no penalty
    expect(calculateScore(1, 0, 0, true)).toBe(1000)

    // 2 guesses: 1 regular wrong (-100)
    expect(calculateScore(2, 0, 0, true)).toBe(900)

    // 2 guesses: 1 synonym wrong (-25 instead of -100)
    expect(calculateScore(2, 0, 1, true)).toBe(975)

    // 3 guesses: 1 regular wrong (-100), 1 synonym (-25) -> 875
    expect(calculateScore(3, 0, 1, true)).toBe(875)

    // 3 guesses: 2 synonyms (-50) -> 950
    expect(calculateScore(3, 0, 2, true)).toBe(950)

    // 3 guesses: 2 synonyms (-50), 1 hint (-150) -> 800
    expect(calculateScore(3, 1, 2, true)).toBe(800)

    // Lower bound floor at 100
    expect(calculateScore(20, 10, 0, true)).toBe(100)
  })

  it('should apply -150 point penalty when revealing letter hint via /api/hint', async () => {
    const testEmail = 'hint-test@company.com'
    const puzzleDate = '2026-08-05'

    const hintRes = await app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    expect(hintRes.status).toBe(200)
    const hintData = await hintRes.json() as any
    expect(hintData.hintsUsed).toBe(1)
    expect(hintData.score).toBe(850) // 1000 - 150 = 850
    expect(hintData.lastMessage).toBe('Revealed letter #1: "F"! -150 points')
  })

  it('should detect puzzle synonyms case-insensitively', () => {
    const mockPuzzle = {
      id: '99',
      date: '2026-09-01',
      word: 'LOAD',
      definitions: ['def 1'],
      synonyms: ['cargo', 'burden', 'freight']
    }

    expect(isPuzzleSynonym(mockPuzzle, 'cargo')).toBe(true)
    expect(isPuzzleSynonym(mockPuzzle, 'CARGO')).toBe(true)
    expect(isPuzzleSynonym(mockPuzzle, 'burden')).toBe(true)
    expect(isPuzzleSynonym(mockPuzzle, 'random')).toBe(false)
  })

  it('should give -25 penalty feedback when a synonym is guessed in /api/guess and apply only -25 upon winning', async () => {
    const testEmail = `synonym_player_${Date.now()}@example.com`
    // Use date 2026-08-17 which is LOAD with synonym "CHARGE" and "ONUS"
    const puzzleDate = '2026-08-17'
    const puzzle = getDailyPuzzle(puzzleDate)
    expect(puzzle.word).toBe('LOAD')
    expect(puzzle.synonyms).toBeDefined()
    expect(puzzle.synonyms!.length).toBeGreaterThan(0)

    const knownSynonym = puzzle.synonyms![0] // e.g. "charge"

    // 1. Submit the synonym guess
    const synGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': knownSynonym }).toString(),
    })
    expect(synGuessRes.status).toBe(200)
    const synData = await synGuessRes.json() as any
    expect(synData.guessCount).toBe(1)
    expect(synData.score).toBe(975)
    expect(synData.lastMessage).toContain('is a synonym!')
    expect(synData.lastMessage).toContain('-25 pts')

    // 2. Submit the winning guess
    const winGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(testEmail)}&date=${puzzleDate}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString(),
    })
    expect(winGuessRes.status).toBe(200)
    const winData = await winGuessRes.json() as any
    expect(winData.hasWon).toBe(true)
    expect(winData.guessCount).toBe(2)
    // Score must be 975 (1000 - 25), NOT 900 (1000 - 100)
    expect(winData.score).toBe(975)
    expect(winData.lastMessage).toContain('Solved "LOAD" in 2 guesses! 975 pts')
  })
})

