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
  })
})
