import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/index'
import { MEMORY_STORE, type GameState, type SubscriberEntry } from '../src/core'
import { getDailyPuzzle } from '../src/game'

describe('Live Production Analytics Dashboard (/dev/dashboard & /api/admin/dashboard-data)', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  describe('Security & Access Controls', () => {
    it('should serve /dev/dashboard on localhost in development', async () => {
      const res = await app.request('http://localhost:8787/dev/dashboard')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('Live Production Analytics &amp; Scores')
      expect(html).toContain('ANALYTICS DASHBOARD')
      expect(html).toContain('kpi-grid')
      expect(html).toContain('scores-table')
    })

    it('should serve /dev/page/dashboard on localhost in development', async () => {
      const res = await app.request('http://localhost:8787/dev/page/dashboard')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('Live Production Analytics &amp; Scores')
    })

    it('should block /dev/dashboard with 404 on production domain (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev/dashboard')
      expect(res.status).toBe(404)
    })

    it('should block /dev/page/dashboard with 404 on production domain (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev/page/dashboard')
      expect(res.status).toBe(404)
    })

    it('should block /dev/api/dashboard-data with 404 on production domain (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev/api/dashboard-data')
      expect(res.status).toBe(404)
    })
  })

  describe('Admin Production API (/api/admin/dashboard-data)', () => {
    it('should enforce ADMIN_SECRET when configured', async () => {
      const origSecret = process.env.ADMIN_SECRET
      try {
        process.env.ADMIN_SECRET = 'supersecretadmin'

        // 1. Without auth header -> 401
        const unauthRes = await app.request('/api/admin/dashboard-data')
        expect(unauthRes.status).toBe(401)
        const unauthJson = await unauthRes.json() as any
        expect(unauthJson.error).toBe('Unauthorized')

        // 2. With wrong auth header -> 401
        const wrongRes = await app.request('/api/admin/dashboard-data', {
          headers: { 'Authorization': 'Bearer wrongsecret' }
        })
        expect(wrongRes.status).toBe(401)

        // 3. With correct auth header -> 200
        const authRes = await app.request('/api/admin/dashboard-data', {
          headers: { 'Authorization': 'Bearer supersecretadmin' }
        })
        expect(authRes.status).toBe(200)
        const data = await authRes.json() as any
        expect(data.success).toBe(true)
        expect(data.todayPuzzle).toBeDefined()
        expect(data.subscribers).toBeDefined()
      } finally {
        if (origSecret === undefined) {
          delete process.env.ADMIN_SECRET
        } else {
          process.env.ADMIN_SECRET = origSecret
        }
      }
    })

    it('should accurately aggregate subscribers, today plays, and individual player scores', async () => {
      const todayPuzzle = getDailyPuzzle()

      // Seed 2 subscribers
      const subscribers: SubscriberEntry[] = [
        {
          email: 'alice@google.com',
          domain: 'google.com',
          subscribedAt: '2026-09-28T10:00:00.000Z',
          status: 'active'
        },
        {
          email: 'bob@apple.com',
          domain: 'apple.com',
          subscribedAt: '2026-09-28T11:00:00.000Z',
          status: 'active'
        },
        {
          email: 'charlie@google.com',
          domain: 'google.com',
          subscribedAt: '2026-09-28T12:00:00.000Z',
          status: 'unsubscribed'
        }
      ]
      MEMORY_STORE.set('subscribers:list', subscribers)

      // Seed Alice's game (won today's puzzle in 2 guesses with score 975)
      const aliceState: Partial<GameState> = {
        puzzleId: todayPuzzle.id,
        date: todayPuzzle.date,
        guessCount: 2,
        guessedWords: ['TRADE', todayPuzzle.word],
        score: 975,
        hasWon: true,
        hintsUsed: 0,
        revealedCount: 1,
        updatedAt: '2026-09-29T14:30:00.000Z'
      }
      MEMORY_STORE.set(`game:${todayPuzzle.date}:alice@google.com`, aliceState)

      // Seed Bob's game (in progress, 3 guesses with score 500)
      const bobState: Partial<GameState> = {
        puzzleId: todayPuzzle.id,
        date: todayPuzzle.date,
        guessCount: 3,
        guessedWords: ['WRONG', 'GUESS', 'TESTS'],
        score: 500,
        hasWon: false,
        hintsUsed: 1,
        revealedCount: 2,
        updatedAt: '2026-09-29T15:00:00.000Z'
      }
      MEMORY_STORE.set(`game:${todayPuzzle.date}:bob@apple.com`, bobState)

      const res = await app.request('/api/admin/dashboard-data')
      expect(res.status).toBe(200)
      const data = await res.json() as any

      expect(data.success).toBe(true)

      // Verify Subscriber metrics
      expect(data.subscribers.total).toBe(3)
      expect(data.subscribers.activeCount).toBe(2)
      expect(data.subscribers.unsubscribedCount).toBe(1)
      expect(data.subscribers.uniqueDomainsCount).toBe(2)

      // Verify Today's Gameplay metrics
      expect(data.todayStats.totalPlayers).toBe(2)
      expect(data.todayStats.totalWon).toBe(1)
      expect(data.todayStats.totalPlaying).toBe(1)
      expect(data.todayStats.winRate).toBe(50)
      expect(data.todayStats.topScore).toBe(975)
      expect(data.todayStats.topPlayer).toBe('alice@google.com')

      // Verify Individual Player Score Records
      expect(data.selectedPlays.length).toBe(2)
      const aliceRecord = data.selectedPlays.find((p: any) => p.email === 'alice@google.com')
      expect(aliceRecord).toBeDefined()
      expect(aliceRecord.score).toBe(975)
      expect(aliceRecord.hasWon).toBe(true)
      expect(aliceRecord.guessCount).toBe(2)
      expect(aliceRecord.guesses).toEqual(['TRADE', todayPuzzle.word])
      expect(aliceRecord.domain).toBe('google.com')

      const bobRecord = data.selectedPlays.find((p: any) => p.email === 'bob@apple.com')
      expect(bobRecord).toBeDefined()
      expect(bobRecord.score).toBe(500)
      expect(bobRecord.hasWon).toBe(false)
      expect(bobRecord.status).toBe('playing')
      expect(bobRecord.hintsUsed).toBe(1)

      // Verify Domain rankings
      const googleDomain = data.domainRankings.find((d: any) => d.domain === 'google.com')
      expect(googleDomain).toBeDefined()
      expect(googleDomain.playerCount).toBe(1)
      expect(googleDomain.subscriberCount).toBe(2)
      expect(googleDomain.topScore).toBe(975)
    })

    it('should support filtering scores and stats by specific puzzle number', async () => {
      // Seed puzzle #1 play
      const p1State: Partial<GameState> = {
        puzzleId: '1',
        date: '2026-09-28',
        guessCount: 1,
        guessedWords: ['LOAD'],
        score: 1000,
        hasWon: true,
        updatedAt: '2026-09-28T09:15:00.000Z'
      }
      MEMORY_STORE.set('game:2026-09-28:winner@corp.com', p1State)

      const res = await app.request('/api/admin/dashboard-data?puzzle=1')
      expect(res.status).toBe(200)
      const data = await res.json() as any

      expect(data.selectedPuzzle.id).toBe('1')
      expect(data.selectedPlays.length).toBe(1)
      expect(data.selectedPlays[0].email).toBe('winner@corp.com')
      expect(data.selectedPlays[0].score).toBe(1000)
      expect(data.selectedPuzzleStats.totalWon).toBe(1)
      expect(data.selectedPuzzleStats.topScore).toBe(1000)
    })

    it('should pull strictly by game number and never duplicate or merge different puzzles played on the same date', async () => {
      // User played Puzzle #2 (CONVERT) on 2026-09-29
      const p2State: Partial<GameState> = {
        puzzleId: '2',
        date: '2026-09-29',
        guessCount: 2,
        guessedWords: ['REPLACE', 'CONVERT'],
        score: 900,
        hasWon: true,
        updatedAt: '2026-09-29T08:04:00.000Z'
      }
      MEMORY_STORE.set('game:2026-09-29:player1@corp.com', p2State)

      // User also played Puzzle #44 (CODE) on the same date 2026-09-29
      const p44State: Partial<GameState> = {
        puzzleId: '44',
        date: '2026-09-29',
        guessCount: 4,
        guessedWords: ['GIST', 'SECT', 'CLAS', 'CODE'],
        score: 550,
        hasWon: true,
        updatedAt: '2026-09-29T09:40:00.000Z'
      }
      MEMORY_STORE.set('game:2026-09-29:dev:player1@corp.com', p44State)

      // Leaderboard also has player1 for puzzle 2
      MEMORY_STORE.set('leaderboard:corp.com:2', [
        {
          email: 'player1@corp.com',
          displayEmail: 'pl•••1@corp.com',
          score: 900,
          guessCount: 2,
          hintsUsed: 0,
          wonAt: '2026-09-29T08:04:00.000Z'
        }
      ])

      // Query Puzzle #2
      const resP2 = await app.request('/api/admin/dashboard-data?puzzle=2')
      expect(resP2.status).toBe(200)
      const dataP2 = await resP2.json() as any
      expect(dataP2.selectedPuzzle.id).toBe('2')
      // Player 1 must appear only ONCE under Puzzle #2
      const player1Entries = dataP2.selectedPlays.filter((p: any) => p.email === 'player1@corp.com')
      expect(player1Entries.length).toBe(1)
      expect(player1Entries[0].score).toBe(900)
      expect(player1Entries[0].guesses).toEqual(['REPLACE', 'CONVERT'])

      // Query Puzzle #44
      const resP44 = await app.request('/api/admin/dashboard-data?puzzle=44')
      expect(resP44.status).toBe(200)
      const dataP44 = await resP44.json() as any
      expect(dataP44.selectedPuzzle.id).toBe('44')
      const p44Plays = dataP44.selectedPlays.filter((p: any) => p.email === 'player1@corp.com')
      expect(p44Plays.length).toBe(1)
      expect(p44Plays[0].score).toBe(550)
      expect(p44Plays[0].guesses).toEqual(['GIST', 'SECT', 'CLAS', 'CODE'])
    })

    it('should isolate legacy word guesses from current puzzle word and length', async () => {
      // Puzzle #2 in PUZZLES is "CONVERT" (7 letters)
      // Legacy test play had puzzleId '2', but word was 'SPRING' (6 letters)
      const legacyState: Partial<GameState> = {
        puzzleId: '2',
        date: '2026-08-05',
        guessCount: 2,
        guessedWords: ['SPRUNG', 'SPRING'],
        score: 900,
        hasWon: true,
        updatedAt: '2026-08-05T01:17:00.000Z'
      }
      MEMORY_STORE.set('game:2:dev:legacy@corp.com', legacyState)
      MEMORY_STORE.set('leaderboard:corp.com:2', [
        {
          email: 'legacy@corp.com',
          displayEmail: 'le•••y@corp.com',
          score: 900,
          guessCount: 2,
          hintsUsed: 0,
          wonAt: '2026-08-05T01:17:00.000Z'
        }
      ])

      // Real play on Puzzle #2 with "CONVERT"
      const realState: Partial<GameState> = {
        puzzleId: '2',
        date: '2026-08-18',
        guessCount: 1,
        guessedWords: ['CONVERT'],
        score: 1000,
        hasWon: true,
        updatedAt: '2026-08-18T08:39:00.000Z'
      }
      MEMORY_STORE.set('game:2:molly@corp.com', realState)

      // Query Puzzle #2
      const res = await app.request('/api/admin/dashboard-data?puzzle=2')
      expect(res.status).toBe(200)
      const data = await res.json() as any

      // Molly must be present
      const mollyPlay = data.selectedPlays.find((p: any) => p.email === 'molly@corp.com')
      expect(mollyPlay).toBeDefined()
      expect(mollyPlay.guesses).toEqual(['CONVERT'])

      // Legacy player with SPRING must NOT appear under Puzzle #2 (CONVERT)
      const legacyPlay = data.selectedPlays.find((p: any) => p.email === 'legacy@corp.com')
      expect(legacyPlay).toBeUndefined()
    })
  })

  describe('Dev API Proxy (/dev/api/dashboard-data)', () => {
    it('should return dashboard data JSON on localhost', async () => {
      const res = await app.request('http://localhost:8787/dev/api/dashboard-data?source=local')
      expect(res.status).toBe(200)
      const json = await res.json() as any
      expect(json.success).toBe(true)
      expect(json.todayPuzzle).toBeDefined()
      expect(json.subscribers).toBeDefined()
    })

    it('should return specific puzzle scores when puzzle param is passed to /dev/dashboard', async () => {
      // Seed play for puzzle 1
      MEMORY_STORE.set('game:1:p1@corp.com', {
        puzzleId: '1',
        guessCount: 1,
        guessedWords: ['LOAD'],
        score: 1000,
        hasWon: true
      })

      const res = await app.request('http://localhost:8787/dev/dashboard?puzzle=1&source=local')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('p1@corp.com')
      expect(html).toContain('Puzzle #1')
    })
  })

  describe('User Settings & Profile Inspector (/api/admin/user-settings & /dev/page/settings)', () => {
    it('should include consolidated userProfiles in /api/admin/dashboard-data', async () => {
      // Seed a subscriber
      const subscribers: SubscriberEntry[] = [
        {
          email: 'profiletest@acme.com',
          domain: 'acme.com',
          subscribedAt: '2026-09-28T10:00:00.000Z',
          status: 'active'
        }
      ]
      MEMORY_STORE.set('subscribers:list', subscribers)

      // Seed custom profile preferences in storage
      MEMORY_STORE.set('user:profile:profiletest@acme.com', {
        email: 'profiletest@acme.com',
        domain: 'acme.com',
        showOnLeaderboard: false,
        theme: 'dark',
        daysPlayed: 1,
        playedDates: ['2026-09-28'],
        playedPuzzles: ['1']
      })

      const res = await app.request('/api/admin/dashboard-data')
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(Array.isArray(data.userProfiles)).toBe(true)

      const user = data.userProfiles.find((u: any) => u.email === 'profiletest@acme.com')
      expect(user).toBeDefined()
      expect(user.domain).toBe('acme.com')
      expect(user.showOnLeaderboard).toBe(false)
      expect(user.theme).toBe('dark')
      expect(user.isSubscribed).toBe(true)
      expect(user.isDev).toBe(false)
      expect(user.daysPlayed).toBe(1)
      expect(user.accountToken).toBeDefined()
    })

    it('should enforce ADMIN_SECRET on POST /api/admin/user-settings when configured', async () => {
      const origSecret = process.env.ADMIN_SECRET
      try {
        process.env.ADMIN_SECRET = 'adminsecretkey'

        // 1. Without auth header -> 401
        const unauthRes = await app.request('/api/admin/user-settings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: 'user@test.com', theme: 'dark' })
        })
        expect(unauthRes.status).toBe(401)

        // 2. With valid auth header -> 200
        const authRes = await app.request('/api/admin/user-settings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer adminsecretkey'
          },
          body: JSON.stringify({ email: 'user@test.com', theme: 'dark' })
        })
        expect(authRes.status).toBe(200)
        const json = await authRes.json() as any
        expect(json.success).toBe(true)
        expect(json.profile.theme).toBe('dark')
      } finally {
        if (origSecret === undefined) {
          delete process.env.ADMIN_SECRET
        } else {
          process.env.ADMIN_SECRET = origSecret
        }
      }
    })

    it('should update showOnLeaderboard and theme via POST /api/admin/user-settings', async () => {
      const email = 'alex@techfirm.com'
      const res = await app.request('/api/admin/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          showOnLeaderboard: false,
          theme: 'dark'
        })
      })
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.profile.email).toBe(email)
      expect(data.profile.showOnLeaderboard).toBe(false)
      expect(data.profile.theme).toBe('dark')

      // Verify toggle back
      const toggleRes = await app.request('/api/admin/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          showOnLeaderboard: true,
          theme: 'light'
        })
      })
      const toggleData = await toggleRes.json() as any
      expect(toggleData.success).toBe(true)
      expect(toggleData.profile.showOnLeaderboard).toBe(true)
      expect(toggleData.profile.theme).toBe('light')
    })

    it('should update subscription status and dev tester track via POST /api/admin/user-settings', async () => {
      const email = 'sam@startup.io'

      // Set active and dev
      const res = await app.request('/api/admin/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          status: 'active',
          isDev: true
        })
      })
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.profile.isSubscribed).toBe(true)
      expect(data.profile.isDev).toBe(true)

      // Unsubscribe and remove dev
      const unsubRes = await app.request('/api/admin/user-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          status: 'unsubscribed',
          isDev: false
        })
      })
      const unsubData = await unsubRes.json() as any
      expect(unsubData.profile.isSubscribed).toBe(false)
      expect(unsubData.profile.isDev).toBe(false)
    })

    it('should update user settings via POST /dev/api/user-settings/update locally', async () => {
      const email = 'localdev@test.com'
      const res = await app.request('http://localhost:8787/dev/api/user-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          target: 'local',
          theme: 'dark',
          showOnLeaderboard: false
        })
      })
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.target).toBe('local')
      expect(data.profile.theme).toBe('dark')
      expect(data.profile.showOnLeaderboard).toBe(false)
    })

    it('should block POST /dev/api/user-settings/update on production domain (inboxed.fun)', async () => {
      const res = await app.request('https://inboxed.fun/dev/api/user-settings/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'test@example.com' })
      })
      expect(res.status).toBe(404)
    })

    it('should serve /dev/dashboard?tab=settings and /dev/page/settings in development', async () => {
      const res = await app.request('http://localhost:8787/dev/dashboard?tab=settings&source=local')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('User Settings &amp; Profiles')
      expect(html).toContain('section-user-settings')
      expect(html).toContain('user-inspector-card')
      expect(html).toContain('users-directory-table')

      const pageRes = await app.request('http://localhost:8787/dev/page/settings?source=local')
      expect(pageRes.status).toBe(200)
      const pageHtml = await pageRes.text()
      expect(pageHtml).toContain('section-user-settings')
    })
  })
})
