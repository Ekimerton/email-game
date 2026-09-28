import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/index'
import { MEMORY_STORE, generateAccountToken } from '../src/core'
import { getDailyPuzzle } from '../src/game'
import { getDevTesters, isDevTester, addDevTester, removeDevTester } from '../src/services'
import { buildPuzzleEmailContent } from '../src/email'

describe('Dev Prescreen & Public Launch Schedule Reset', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  describe('Puzzle Schedule & Dev Offset', () => {
    it('should assign Puzzle #42 to all users on pre-launch day (2026-09-27)', () => {
      const standardPuzzle = getDailyPuzzle('2026-09-27')
      expect(standardPuzzle.id).toBe('42')
      expect(standardPuzzle.word).toBe('BROWSE')
      expect(standardPuzzle.date).toBe('2026-09-27')
    })

    it('should assign Puzzle #1 to standard subscribers on launch day (2026-09-28)', () => {
      const standardPuzzle = getDailyPuzzle('2026-09-28')
      expect(standardPuzzle.id).toBe('1')
      expect(standardPuzzle.word).toBe('LOAD')
      expect(standardPuzzle.date).toBe('2026-09-28')
    })

    it('should assign Puzzle #43 (DIGEST) to dev testers on launch day (2026-09-28)', () => {
      const devPuzzle = getDailyPuzzle('2026-09-28', { isDev: true })
      expect(devPuzzle.id).toBe('43')
      expect(devPuzzle.word).toBe('DIGEST')
      expect(devPuzzle.date).toBe('2026-09-28')
    })

    it('should advance standard subscribers to Puzzle #2 on 2026-09-29', () => {
      const standardPuzzle = getDailyPuzzle('2026-09-29')
      expect(standardPuzzle.id).toBe('2')
      expect(standardPuzzle.word).toBe('CONVERT')
      expect(standardPuzzle.date).toBe('2026-09-29')
    })

    it('should advance dev testers to Puzzle #44 on 2026-09-29', () => {
      const devPuzzle = getDailyPuzzle('2026-09-29', { isDev: true })
      expect(devPuzzle.id).toBe('44')
      expect(devPuzzle.word).toBe('CODE')
      expect(devPuzzle.date).toBe('2026-09-29')
    })

    it('should advance standard subscribers to Puzzle #3 on 2026-09-30', () => {
      const standardPuzzle = getDailyPuzzle('2026-09-30')
      expect(standardPuzzle.id).toBe('3')
      expect(standardPuzzle.word).toBe('ENTRANCE')
      expect(standardPuzzle.date).toBe('2026-09-30')
    })
  })

  describe('Central Dev Testers Service (Option 1)', () => {
    it('should add, check, and remove dev testers from central list', async () => {
      const testEmail = 'tester@inboxed.fun'

      expect(await isDevTester(undefined, testEmail)).toBe(false)
      expect(await getDevTesters(undefined)).toEqual([])

      // Add to dev list
      const listAfterAdd = await addDevTester(undefined, testEmail)
      expect(listAfterAdd).toContain(testEmail)
      expect(await isDevTester(undefined, testEmail)).toBe(true)

      // Deduplicate when adding same email
      const listAfterDup = await addDevTester(undefined, 'TESTER@inboxed.fun ')
      expect(listAfterDup.length).toBe(1)

      // Remove from dev list
      const listAfterRemove = await removeDevTester(undefined, testEmail)
      expect(listAfterRemove).not.toContain(testEmail)
      expect(await isDevTester(undefined, testEmail)).toBe(false)
    })
  })

  describe('Dev Prescreen Management in Subscribed Emails Tab', () => {
    it('should not expose dev controls in user-facing GET /api/account', async () => {
      const userEmail = 'devuser@company.com'
      const token = generateAccountToken(userEmail)
      const res = await app.request(`/api/account?token=${encodeURIComponent(token)}`)
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.isDev).toBeUndefined()
      expect(data.devTesters).toBeUndefined()
    })

    it('should list dev testers via GET /dev/api/dev-testers', async () => {
      const res = await app.request('/dev/api/dev-testers')
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.devTesters).toEqual([])
    })

    it('should add dev testers via POST /dev/api/dev-testers/add', async () => {
      const tester = 'tester1@domain.com'
      const res = await app.request('/dev/api/dev-testers/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tester })
      })
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.devTesters).toContain(tester)
      expect(await isDevTester(undefined, tester)).toBe(true)
    })

    it('should toggle dev testers on and off via POST /dev/api/dev-testers/toggle', async () => {
      const tester = 'tester2@domain.com'
      // 1. Toggle ON
      const res1 = await app.request('/dev/api/dev-testers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tester })
      })
      expect(res1.status).toBe(200)
      const data1 = await res1.json() as any
      expect(data1.success).toBe(true)
      expect(data1.isDev).toBe(true)
      expect(data1.devTesters).toContain(tester)

      // 2. Toggle OFF
      const res2 = await app.request('/dev/api/dev-testers/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tester })
      })
      expect(res2.status).toBe(200)
      const data2 = await res2.json() as any
      expect(data2.success).toBe(true)
      expect(data2.isDev).toBe(false)
      expect(data2.devTesters).not.toContain(tester)
    })

    it('should remove dev testers via POST /dev/api/dev-testers/remove', async () => {
      const tester = 'tester3@domain.com'
      await addDevTester(undefined, tester)

      const res = await app.request('/dev/api/dev-testers/remove', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: tester })
      })
      expect(res.status).toBe(200)
      const data = await res.json() as any
      expect(data.success).toBe(true)
      expect(data.devTesters).not.toContain(tester)
      expect(await isDevTester(undefined, tester)).toBe(false)
    })

    it('should render the Dev Prescreen Team Management Card in /dev/page/subscribers', async () => {
      const devEmail = 'prescreener@domain.com'
      await addDevTester(undefined, devEmail)

      const res = await app.request('/dev/page/subscribers?source=local')
      expect(res.status).toBe(200)
      const html = await res.text()
      expect(html).toContain('Dev Tester Prescreen Team')
      expect(html).toContain('42 Days Ahead')
      expect(html).toContain(devEmail)
      expect(html).toContain('removeDevTester')
      expect(html).toContain('toggleDevStatus')
    })
  })

  describe('Production Admin Dev Testers API (/api/admin/dev-testers)', () => {
    it('should enforce ADMIN_SECRET when set', async () => {
      const origSecret = process.env.ADMIN_SECRET
      try {
        process.env.ADMIN_SECRET = 'supersecret'

        // Without auth header
        const resUnauthorized = await app.request('/api/admin/dev-testers')
        expect(resUnauthorized.status).toBe(401)

        // With valid auth header
        const resAuthorized = await app.request('/api/admin/dev-testers', {
          headers: { 'Authorization': 'Bearer supersecret' }
        })
        expect(resAuthorized.status).toBe(200)
      } finally {
        process.env.ADMIN_SECRET = origSecret
      }
    })

    it('should manage dev testers via /api/admin/dev-testers endpoints', async () => {
      const tester = 'admin-managed@domain.com'
      const adminSecret = process.env.ADMIN_SECRET
      const headers: Record<string, string> = { 'Content-Type': 'application/json' }
      if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

      // 1. Add
      const addRes = await app.request('/api/admin/dev-testers/add', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: tester })
      })
      expect(addRes.status).toBe(200)
      const addData = await addRes.json() as any
      expect(addData.success).toBe(true)
      expect(addData.devTesters).toContain(tester)

      // 2. Get
      const getRes = await app.request('/api/admin/dev-testers', { headers })
      expect(getRes.status).toBe(200)
      const getData = await getRes.json() as any
      expect(getData.devTesters).toContain(tester)

      // 3. Toggle (turns off)
      const toggleOffRes = await app.request('/api/admin/dev-testers/toggle', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: tester })
      })
      expect(toggleOffRes.status).toBe(200)
      const toggleOffData = await toggleOffRes.json() as any
      expect(toggleOffData.isDev).toBe(false)
      expect(toggleOffData.devTesters).not.toContain(tester)

      // 4. Toggle (turns on)
      const toggleOnRes = await app.request('/api/admin/dev-testers/toggle', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: tester })
      })
      expect(toggleOnRes.status).toBe(200)
      const toggleOnData = await toggleOnRes.json() as any
      expect(toggleOnData.isDev).toBe(true)
      expect(toggleOnData.devTesters).toContain(tester)

      // 5. Remove
      const removeRes = await app.request('/api/admin/dev-testers/remove', {
        method: 'POST',
        headers,
        body: JSON.stringify({ email: tester })
      })
      expect(removeRes.status).toBe(200)
      const removeData = await removeRes.json() as any
      expect(removeData.devTesters).not.toContain(tester)
    })
  })

  describe('Gameplay with Dev Tester Prescreen', () => {
    it('should serve Puzzle #1 (LOAD) to standard user and Puzzle #43 (DIGEST) to dev tester on launch day', async () => {
      const standardUser = 'standard@firm.com'
      const devUser = 'dev@firm.com'
      await addDevTester(undefined, devUser)

      // 1. GET /api/state for both users on 2026-09-28
      const stdStateRes = await app.request(`/api/state?email=${encodeURIComponent(standardUser)}&date=2026-09-28`)
      expect(stdStateRes.status).toBe(200)
      const stdState = await stdStateRes.json() as any
      expect(stdState.wordLength).toBe(4) // LOAD = 4 letters

      const devStateRes = await app.request(`/api/state?email=${encodeURIComponent(devUser)}&date=2026-09-28`)
      expect(devStateRes.status).toBe(200)
      const devState = await devStateRes.json() as any
      expect(devState.wordLength).toBe(6) // DIGEST = 6 letters

      // 2. Submit guess for standard user (LOAD)
      const stdGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(standardUser)}&date=2026-09-28`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'LOAD' }).toString()
      })
      const stdGuessData = await stdGuessRes.json() as any
      expect(stdGuessData.hasWon).toBe(true)

      // 3. Submit guess for dev tester (DIGEST)
      // Check leaderboard before winning: must be locked (hasWon: false)
      const lbBeforeRes = await app.request(`/api/leaderboard?domain=firm.com&email=${encodeURIComponent(devUser)}&date=2026-09-28`)
      expect(lbBeforeRes.status).toBe(200)
      const lbBefore = await lbBeforeRes.json() as any
      expect(lbBefore.hasWon).toBe(false)

      const devGuessRes = await app.request(`/api/guess?email=${encodeURIComponent(devUser)}&date=2026-09-28`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': 'DIGEST' }).toString()
      })
      const devGuessData = await devGuessRes.json() as any
      expect(devGuessData.hasWon).toBe(true)
      expect(devGuessData.revealedCount).toBe(devGuessData.definitions.length)
      // Verify all definitions are unredacted and include index property
      for (let i = 0; i < devGuessData.definitions.length; i++) {
        const def = devGuessData.definitions[i]
        expect(def.isRevealed).toBe(true)
        expect(def.index).toBe(i)
        expect(def.text).not.toContain('•')
      }

      // Check leaderboard after winning: must reveal for dev tester (hasWon: true)
      const lbAfterRes = await app.request(`/api/leaderboard?domain=firm.com&email=${encodeURIComponent(devUser)}&date=2026-09-28`)
      expect(lbAfterRes.status).toBe(200)
      const lbAfter = await lbAfterRes.json() as any
      expect(lbAfter.hasWon).toBe(true)
      expect(lbAfter.players.some((p: any) => p.email === devUser && p.isCurrentPlayer)).toBe(true)
    })
  })

  describe('Email Content & Dispatch with Dev List', () => {
    it('should build Puzzle #1 email for standard user and Puzzle #43 email for dev tester on launch day', async () => {
      const stdUser = 'std_email@firm.com'
      const devUser = 'dev_email@firm.com'
      await addDevTester(undefined, devUser)

      const stdEmail = await buildPuzzleEmailContent(undefined, stdUser, '2026-09-28')
      expect(stdEmail.puzzle.id).toBe('1')
      expect(stdEmail.puzzle.word).toBe('LOAD')
      expect(stdEmail.subject).toContain('Inboxed #1')

      const devEmail = await buildPuzzleEmailContent(undefined, devUser, '2026-09-28')
      expect(devEmail.puzzle.id).toBe('43')
      expect(devEmail.puzzle.word).toBe('DIGEST')
      expect(devEmail.subject).toContain('Inboxed #43')
    })
  })

  describe('Landing Page Normal Track Puzzle Display', () => {
    it('should display Puzzle #1 (LOAD) on the landing page and not dev prescreen puzzles', async () => {
      const resRoot = await app.request('/')
      expect(resRoot.status).toBe(200)
      const htmlRoot = await resRoot.text()
      expect(htmlRoot).toContain('Puzzle #1')
      expect(htmlRoot).toContain('The volume of work required to be performed.')
      expect(htmlRoot).not.toContain('Puzzle #42')
      expect(htmlRoot).not.toContain('Puzzle #43')

      const resSignup = await app.request('/signup')
      expect(resSignup.status).toBe(200)
      const htmlSignup = await resSignup.text()
      expect(htmlSignup).toContain('Puzzle #1')
      expect(htmlSignup).not.toContain('Puzzle #42')
      expect(htmlSignup).not.toContain('Puzzle #43')
    })
  })
})
