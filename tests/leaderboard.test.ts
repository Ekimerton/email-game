import { describe, it, expect, beforeEach } from 'vitest'
import { app } from '../src/index'
import { MEMORY_STORE, kvPut } from '../src/core'
import { getDailyPuzzle } from '../src/game'
import { getDomainLeaderboard } from '../src/services/leaderboard'
import { getCoworkerCount } from '../src/services/userService'
import { resetUserDayState } from '../src/services/adminLogic'
import { addSubscriber } from '../src/services/subscribers'

describe('Unified General Leaderboard (gmail.com, googlemail.com, yahoo.com)', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  it('should save winning guesses for gmail, googlemail, and yahoo users to the general leaderboard', async () => {
    const puzzle = getDailyPuzzle(1)
    const gmailUser = 'player1@gmail.com'
    const yahooUser = 'player2@yahoo.com'
    const googlemailUser = 'player3@googlemail.com'

    // 1. Gmail user solves puzzle 1
    const res1 = await app.request(`/api/guess?email=${encodeURIComponent(gmailUser)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })
    expect(res1.status).toBe(200)
    const data1 = (await res1.json()) as any
    expect(data1.hasWon).toBe(true)
    expect(data1.shareText).toContain('(general)')
    expect(data1.shareText).not.toContain('(gmail.com)')

    // 2. Yahoo user solves puzzle 1
    const res2 = await app.request(`/api/guess?email=${encodeURIComponent(yahooUser)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })
    expect(res2.status).toBe(200)
    const data2 = (await res2.json()) as any
    expect(data2.hasWon).toBe(true)
    expect(data2.shareText).toContain('(general)')

    // 3. Googlemail user solves puzzle 1
    const res3 = await app.request(`/api/guess?email=${encodeURIComponent(googlemailUser)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })
    expect(res3.status).toBe(200)

    // Check kv storage directly: entries are in leaderboard:general:1
    const generalEntries = await getDomainLeaderboard(undefined, 'general', '1')
    expect(generalEntries.length).toBe(3)
    const emailsInLb = generalEntries.map(e => e.email.toLowerCase())
    expect(emailsInLb).toContain(gmailUser)
    expect(emailsInLb).toContain(yahooUser)
    expect(emailsInLb).toContain(googlemailUser)
  })

  it('should return domain: "general" and merged players when querying with gmail, yahoo, or googlemail', async () => {
    const puzzle = getDailyPuzzle(1)
    const gmailUser = 'tester@gmail.com'

    await app.request(`/api/guess?email=${encodeURIComponent(gmailUser)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })

    // Query with domain=gmail.com
    const resGmail = await app.request('/api/leaderboard?domain=gmail.com&puzzle=1')
    expect(resGmail.status).toBe(200)
    const dataGmail = (await resGmail.json()) as any
    const lbPayload1 = dataGmail.items[0]
    expect(lbPayload1.domain).toBe('general')
    expect(lbPayload1.players.some((p: any) => p.email === gmailUser)).toBe(true)

    // Query with domain=yahoo.com
    const resYahoo = await app.request('/api/leaderboard?domain=yahoo.com&puzzle=1')
    expect(resYahoo.status).toBe(200)
    const dataYahoo = (await resYahoo.json()) as any
    const lbPayload2 = dataYahoo.items[0]
    expect(lbPayload2.domain).toBe('general')
    expect(lbPayload2.players.some((p: any) => p.email === gmailUser)).toBe(true)

    // Query with domain=googlemail.com
    const resGooglemail = await app.request('/api/leaderboard?domain=googlemail.com&puzzle=1')
    expect(resGooglemail.status).toBe(200)
    const dataGooglemail = (await resGooglemail.json()) as any
    expect(dataGooglemail.items[0].domain).toBe('general')

    // Query with domain=general
    const resGeneral = await app.request('/api/leaderboard?domain=general&puzzle=1')
    expect(resGeneral.status).toBe(200)
    const dataGeneral = (await resGeneral.json()) as any
    expect(dataGeneral.items[0].domain).toBe('general')

    // Query with email=tester@gmail.com without specifying domain
    const resEmail = await app.request(`/api/leaderboard?email=${encodeURIComponent(gmailUser)}&puzzle=1`)
    expect(resEmail.status).toBe(200)
    const dataEmail = (await resEmail.json()) as any
    expect(dataEmail.items[0].domain).toBe('general')
  })

  it('should merge legacy leaderboard entries stored under gmail.com, googlemail.com, and yahoo.com', async () => {
    // Manually put entries under legacy keys
    await kvPut(undefined, 'leaderboard:gmail.com:1', [
      { email: 'oldgmail@gmail.com', displayEmail: 'oldgmail@gmail.com', score: 950, guessCount: 2, hintsUsed: 0 }
    ])
    await kvPut(undefined, 'leaderboard:yahoo.com:1', [
      { email: 'oldyahoo@yahoo.com', displayEmail: 'oldyahoo@yahoo.com', score: 900, guessCount: 3, hintsUsed: 0 }
    ])
    await kvPut(undefined, 'leaderboard:googlemail.com:1', [
      { email: 'oldgml@googlemail.com', displayEmail: 'oldgml@googlemail.com', score: 850, guessCount: 4, hintsUsed: 0 }
    ])

    const entries = await getDomainLeaderboard(undefined, 'general', '1')
    expect(entries.length).toBe(3)
    expect(entries.map(e => e.email)).toEqual([
      'oldgmail@gmail.com',
      'oldyahoo@yahoo.com',
      'oldgml@googlemail.com'
    ])
  })

  it('should calculate coworker count across general domains', async () => {
    await addSubscriber(undefined, 'sub1@gmail.com')
    await addSubscriber(undefined, 'sub2@yahoo.com')
    await addSubscriber(undefined, 'sub3@googlemail.com')
    await addSubscriber(undefined, 'other@corp.com')

    const count = await getCoworkerCount(undefined, 'gmail.com', 'sub1@gmail.com', 1)
    // sub1 is excluded; sub2 and sub3 are in 'general'; other is 'corp.com'
    expect(count).toBe(2)
  })

  it('should reset user day state and remove them from the general leaderboard', async () => {
    const puzzle = getDailyPuzzle(1)
    const user = 'reset_test@gmail.com'

    await app.request(`/api/guess?email=${encodeURIComponent(user)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })

    const before = await getDomainLeaderboard(undefined, 'general', '1')
    expect(before.some(e => e.email === user)).toBe(true)

    const resetResult = await resetUserDayState(undefined, user, '1')
    expect(resetResult.success).toBe(true)
    expect(resetResult.details.removedFromLeaderboard).toBe(true)

    const after = await getDomainLeaderboard(undefined, 'general', '1')
    expect(after.some(e => e.email === user)).toBe(false)
  })
})
