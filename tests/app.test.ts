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
      playUrl: 'https://inboxed.fun/?email=testuser%40nvidia.engineering',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('INBOXED')
    expect(html).toContain('testuser@nvidia.engineering')
    expect(html).toContain('is inviting you to play Inboxed, the daily word game in your inbox.')
    expect(html).toContain('Join 12 coworkers playing in the nvidia.engineering org.')
    expect(html).toContain('Sign up to play →')
    expect(html).toContain('Seeing this while trying to load the game?')
    expect(html).toContain('Your email client might not be supported.')
    expect(html).toContain('This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.')
    expect(html).toContain('update your account preferences')
    expect(html).toContain('https://inboxed.fun')
    expect(html).toContain('background-color: #ffffff')
    expect(html).toContain('background-color: #f4f4f5')
    expect(html).toContain('border: 1px solid #e4e4e7')
    expect(html).toContain('border-top: 1px solid #e4e4e7')
    expect(html).toContain('logo.png')
    expect(html).toContain('alt="INBOXED"')
    expect(html).toContain('update your account preferences')
  })

  it('should show the player count for invitations from common email providers', () => {
    const html = getFallbackHtml({
      email: 'you@gmail.com',
      domain: 'gmail.com',
      daysPlayed: 1,
      coworkerCount: 0,
      playerCount: 30,
      playUrl: 'https://inboxed.fun/',
    })

    expect(html).toContain('Join 30 players playing the game today.')
    expect(html).not.toContain('coworkers playing')
  })

  it('should use the public HTTPS origin for fallback links when forceHttps is enabled', async () => {
    const response = await app.request('/fallback?email=player@example.com&forceHttps=true')
    const html = await response.text()

    expect(html).toContain('https://inboxed.fun/')
    expect(html).not.toContain('http://localhost')
  })

  it('should include the daily word game header in h4 and ticket stub divider in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('<h4 class="game-header" aria-label="Inboxed">')
    expect(EMAIL_HTML).toContain('class="logo-tiles"')
    expect(EMAIL_HTML).toContain('logo-tile rotate-pos')
    expect(EMAIL_HTML).toContain('logo-tile rotate-neg')
    expect(EMAIL_HTML).toContain('ticket-stub-divider')
    expect(EMAIL_HTML).toContain("Have someone you think would like this game? Forward this email to them!")
  })

  it('should include the mini tutorial within 40px height limit in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('mini-tutorial')
    expect(EMAIL_HTML).toContain('Misses unlock definitions &bull; Use Letter Hint for help &bull; Play within your email')
    expect(EMAIL_HTML).toContain('max-height: 40px;')
  })

  it('should bound guess input to puzzle word length via maxlength', async () => {
    const puzzle = getDailyPuzzle()
    const response = await app.request('/?email=test@example.com')
    const html = await response.text()
    expect(html).toContain(`maxlength="${puzzle.word.length}"`)
    expect(html).toContain(`[maxlength]="gameState.wordLength || ${puzzle.word.length}"`)
  })

  it('should not include focus stars or active square highlights around input', () => {
    expect(EMAIL_HTML).not.toContain('focus-star')
    expect(EMAIL_HTML).not.toContain('star-bg')
    expect(EMAIL_HTML).not.toContain('star-fg')
    expect(EMAIL_HTML).not.toContain('.mask-tile.tile-active')
    expect(EMAIL_HTML).not.toContain('tile-active')
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

describe('Email Signup Landing Page & Subscribe API', () => {
  it('should serve the email signup landing page at GET / by default', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('The Daily Word Game in Your Inbox')
    expect(html).toContain('action="/api/subscribe"')
    expect(html).toContain('Enter your email address')
    expect(html).toContain('Subscribe to Daily Puzzles')
    expect(html).toContain('logo-tiles')
  })

  it('should serve the email signup landing page at GET /signup', async () => {
    const res = await app.request('/signup')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('The Daily Word Game in Your Inbox')
    expect(html).toContain('action="/api/subscribe"')
  })

  it('should pre-fill email input when ?email= query param is provided to /signup', async () => {
    const res = await app.request('/signup?email=test%40company.com')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('value="test@company.com"')
  })

  it('should show subscribed success confirmation when subscribed=true on GET /', async () => {
    const res = await app.request('/?subscribed=true&email=user%40acme.com')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain("You're Subscribed!")
    expect(html).not.toContain("Play Today's Puzzle Online")
  })

  it('should include the AMP/Apple Mail disclaimer and omit quick habit feature and footer', async () => {
    const res = await app.request('/')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Inboxed does not currently support Apple Mail, Outlook, or other non-AMP clients.')
    expect(html).toContain('https://amp.dev/support/faq/email-support/')
    expect(html).not.toContain('⚠️')
    expect(html).not.toContain('Quick daily habit')
    expect(html).not.toContain('Free to play • No spam • One-click unsubscribe anytime')
  })

  it('should serve AMP game preview on GET /play', async () => {
    const res = await app.request('/play?email=testuser%40company.com')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('id="stateList"')
    expect(html).toContain('guess-form')
    expect(html).toContain('hint-form')
  })

  it('should trigger double opt-in confirmation email via POST /api/subscribe', async () => {
    const newEmail = `newuser_${Date.now()}@company.com`
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: newEmail }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.success).toBe(true)
    expect(data.pending).toBe(true)
    expect(data.token).toBeDefined()
    expect(data.message).toContain(newEmail)
  })

  it('should reject invalid email via POST /api/subscribe', async () => {
    const res = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'invalid-email-no-at' }),
    })
    expect(res.status).toBe(400)
    const data = await res.json() as any
    expect(data.success).toBe(false)
    expect(data.message).toContain('valid email')
  })

  it('should confirm subscription and show 9am PST notice with Receive Today button at GET /confirm', async () => {
    const testEmail = `confirmed_${Date.now()}@testfirm.com`
    const subRes = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    const { token } = await subRes.json() as any

    const confirmRes = await app.request(`/confirm?token=${encodeURIComponent(token)}`)
    expect(confirmRes.status).toBe(200)
    const html = await confirmRes.text()

    expect(html).toContain("You're Subscribed!")
    expect(html).toContain("You'll get emails at 9am PST every day.")
    expect(html).toContain("Receive Today's Puzzle Now")
    expect(html).toContain('send-today-btn')
  })

  it('should reject invalid token at GET /confirm', async () => {
    const res = await app.request('/confirm?token=invalid.token.here')
    expect(res.status).toBe(400)
    const html = await res.text()
    expect(html).toContain('Link Expired or Invalid')
  })

  it('should send today puzzle when authorized via POST /api/send-today', async () => {
    const testEmail = `instant_${Date.now()}@testfirm.com`
    const subRes = await app.request('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail }),
    })
    const { token } = await subRes.json() as any

    const sendRes = await app.request('/api/send-today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: testEmail, token }),
    })
    expect(sendRes.status).toBe(200)
    const data = await sendRes.json() as any
    expect(data.success).toBe(true)
    expect(data.message).toContain("Today's puzzle has been sent to your inbox!")
  })

  it('should reject unauthorized send-today request with invalid token', async () => {
    const res = await app.request('/api/send-today', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'hacker@test.com', token: 'bad-token' }),
    })
    expect(res.status).toBe(401)
  })

  it('should unsubscribe an email via GET /unsubscribe', async () => {
    const email = 'user_unsub@company.com'
    const res = await app.request(`/unsubscribe?email=${encodeURIComponent(email)}`)
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('Unsubscribed')
    expect(html).toContain(email)
  })

  it('should unsubscribe or purge user via POST /api/admin/unsubscribe', async () => {
    const email = 'admin_unsub@company.com'
    const res = await app.request('/api/admin/unsubscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, purge: true }),
    })
    expect(res.status).toBe(200)
    const data = await res.json() as any
    expect(data.success).toBe(true)
    expect(data.status).toBe('not_found')
  })

  it('should serve the logo image at GET /logo.png', async () => {
    const res = await app.request('/logo.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    const buffer = await res.arrayBuffer()
    expect(buffer.byteLength).toBe(18686)
  })

  it('should render the privacy policy at GET /privacy', async () => {
    const res = await app.request('/privacy')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toContain('text/html')
    const html = await res.text()
    expect(html).toContain('Privacy Policy')
    expect(html).toContain('game@inboxed.fun')
    expect(html).toContain('inboxed.fun')
  })

  it('should include link to privacy policy in signup landing page', async () => {
    const res = await app.request('/signup')
    expect(res.status).toBe(200)
    const html = await res.text()
    expect(html).toContain('href="/privacy"')
  })

  describe('Development-Only Game HTML Viewer', () => {
    it('should serve dev workbench with all page navigation tabs at GET /dev on localhost', async () => {
      const res = await app.request('http://localhost:8787/dev')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('Inboxed Dev Workbench')
      expect(html).toContain('DEV WORKBENCH')
      expect(html).toContain('Local Only')
      expect(html).toContain('game-iframe')
      expect(html).toContain('amp-source-code')
      expect(html).toContain('data-page="game"')
      expect(html).toContain('data-page="confirmed"')
      expect(html).toContain('data-page="signup"')
      expect(html).toContain('data-page="account"')
      expect(html).toContain('data-page="fallback"')
      expect(html).toContain('data-page="invalid"')
      expect(html).toContain('data-page="privacy"')
    })

    it('should serve direct game HTML render at GET /dev/render on localhost', async () => {
      const res = await app.request('http://localhost:8787/dev/render')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/html')
      const html = await res.text()
      expect(html).toContain('⚡4email')
      expect(html).toContain('Submit Guess')
    })

    it('should serve raw game HTML text at GET /dev/raw on localhost', async () => {
      const res = await app.request('http://localhost:8787/dev/raw')
      expect(res.status).toBe(200)
      expect(res.headers.get('content-type')).toContain('text/plain')
      const text = await res.text()
      expect(text).toContain('⚡4email')
    })

    it('should serve dev sub-pages at GET /dev/page/* on localhost', async () => {
      // Confirmed page
      const confRes = await app.request('http://localhost:8787/dev/page/confirmed?email=test%40example.com')
      expect(confRes.status).toBe(200)
      const confHtml = await confRes.text()
      expect(confHtml).toContain('Subscription Confirmed')
      expect(confHtml).toContain('test@example.com')

      // Signup page
      const signupRes = await app.request('http://localhost:8787/dev/page/signup')
      expect(signupRes.status).toBe(200)
      const signupHtml = await signupRes.text()
      expect(signupHtml).toContain('Subscribe to Daily Puzzles')

      // Invalid token page
      const invalidRes = await app.request('http://localhost:8787/dev/page/invalid')
      expect(invalidRes.status).toBe(200)
      const invalidHtml = await invalidRes.text()
      expect(invalidHtml).toContain('Link Expired or Invalid')

      // Privacy policy page
      const privRes = await app.request('http://localhost:8787/dev/page/privacy')
      expect(privRes.status).toBe(200)
      const privHtml = await privRes.text()
      expect(privHtml).toContain('Privacy Policy')

      // Fallback page
      const fallbackRes = await app.request('http://localhost:8787/dev/fallback?email=test%40example.com')
      expect(fallbackRes.status).toBe(200)
      const fallbackHtml = await fallbackRes.text()
      expect(fallbackHtml).toContain('Seeing this while trying to load the game?')

      // Account page redirect to /account?token=...
      const accountRes = await app.request('http://localhost:8787/dev/page/account?email=test%40example.com')
      expect(accountRes.status).toBe(302)
      expect(accountRes.headers.get('location')).toContain('/account?token=')
    })

    it('should serve raw text for all sub-pages via GET /dev/raw?page=...', async () => {
      const confRaw = await (await app.request('http://localhost:8787/dev/raw?page=confirmed&email=test%40example.com')).text()
      expect(confRaw).toContain('Subscription Confirmed')

      const signupRaw = await (await app.request('http://localhost:8787/dev/raw?page=signup')).text()
      expect(signupRaw).toContain('Subscribe to Daily Puzzles')

      const invalidRaw = await (await app.request('http://localhost:8787/dev/raw?page=invalid')).text()
      expect(invalidRaw).toContain('Link Expired or Invalid')

      const privRaw = await (await app.request('http://localhost:8787/dev/raw?page=privacy')).text()
      expect(privRaw).toContain('Privacy Policy')

      const accountRaw = await (await app.request('http://localhost:8787/dev/raw?page=account')).text()
      expect(accountRaw).toContain('Inboxed Account &amp; Preferences')

      const fallbackRaw = await (await app.request('http://localhost:8787/dev/raw?page=fallback&email=test%40example.com')).text()
      expect(fallbackRaw).toContain('Seeing this while trying to load the game?')
    })

    it('should block GET /dev on production host (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev')
      expect(res.status).toBe(404)
    })

    it('should block GET /dev/render on production host (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev/render')
      expect(res.status).toBe(404)
    })

    it('should block GET /dev/page/* on production host (inboxed.fun)', async () => {
      const res1 = await app.request('https://inboxed.fun/dev/page/confirmed')
      expect(res1.status).toBe(404)
      const res2 = await app.request('https://inboxed.fun/dev/page/signup')
      expect(res2.status).toBe(404)
      const res3 = await app.request('https://inboxed.fun/dev/page/account')
      expect(res3.status).toBe(404)
    })
  })
})

