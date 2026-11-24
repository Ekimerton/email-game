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
    expect(data1.shareText).toBe('Inboxed #1 🟩 1000pts https://inboxed.fun')

    // 2. Yahoo user solves puzzle 1
    const res2 = await app.request(`/api/guess?email=${encodeURIComponent(yahooUser)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })
    expect(res2.status).toBe(200)
    const data2 = (await res2.json()) as any
    expect(data2.hasWon).toBe(true)
    expect(data2.shareText).toBe('Inboxed #1 🟩 1000pts https://inboxed.fun')

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

  it('should build rich shareText with misses, synonyms, hints, score, and streak', async () => {
    const p1 = getDailyPuzzle(1)
    const p2 = getDailyPuzzle(2)
    const user = `share_trail_${Date.now()}@gmail.com`

    // Solve puzzle 1 so user has streak = 2 when solving puzzle 2
    await app.request(`/api/guess?email=${encodeURIComponent(user)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p1.word }).toString()
    })

    // On puzzle 2: 1 regular miss (same length), 1 synonym guess, 1 hint, then solve
    const wrongSameLen = 'Z'.repeat(p2.word.length)
    await app.request(`/api/guess?email=${encodeURIComponent(user)}&puzzle=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': wrongSameLen }).toString()
    })

    const syn = p2.synonyms && p2.synonyms[0] ? p2.synonyms[0] : 'CHANGE'
    await app.request(`/api/guess?email=${encodeURIComponent(user)}&puzzle=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': syn }).toString()
    })

    await app.request(`/api/hint?email=${encodeURIComponent(user)}&puzzle=2`, {
      method: 'POST'
    })

    const winRes = await app.request(`/api/guess?email=${encodeURIComponent(user)}&puzzle=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p2.word }).toString()
    })
    expect(winRes.status).toBe(200)
    const winData = (await winRes.json()) as any
    // Base 1000 - 100 (miss) - 25 (synonym) - 150 (hint) = 725pts, streak 2
    expect(winData.shareText).toBe('Inboxed #2 ⬜🟨💡🟩 725pts 🔥2 https://inboxed.fun')
  })

  it('should emit solo domain player nudge only when user is the sole player on a company domain leaderboard', async () => {
    const p1 = getDailyPuzzle(1)
    const soloDomain = `solo-${Date.now()}.com`
    const player1 = `alice@${soloDomain}`
    const player2 = `bob@${soloDomain}`
    const gmailPlayer = `solo_gmail_${Date.now()}@gmail.com`

    // 1. Alice solves on solo domain -> solo nudge enabled
    await app.request(`/api/guess?email=${encodeURIComponent(player1)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p1.word }).toString()
    })
    const lbSoloRes = await app.request(`/api/leaderboard?domain=${soloDomain}&email=${encodeURIComponent(player1)}&puzzle=1`)
    const lbSolo = (await lbSoloRes.json()) as any
    expect(lbSolo.isSoloDomainPlayer).toBe(true)
    expect(lbSolo.soloNudgeText).toContain(`You're #1 at ${soloDomain} (only player today)`)

    // 2. Bob also solves on same domain -> solo nudge turns off
    await app.request(`/api/guess?email=${encodeURIComponent(player2)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p1.word }).toString()
    })
    const lbTeamRes = await app.request(`/api/leaderboard?domain=${soloDomain}&email=${encodeURIComponent(player1)}&puzzle=1`)
    const lbTeam = (await lbTeamRes.json()) as any
    expect(lbTeam.isSoloDomainPlayer).toBe(false)
    expect(lbTeam.soloNudgeText).toBe('')

    // 3. Single gmail player on Global ('general') leaderboard -> never shows solo domain nudge
    await app.request(`/api/guess?email=${encodeURIComponent(gmailPlayer)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p1.word }).toString()
    })
    const lbGenRes = await app.request(`/api/leaderboard?domain=general&email=${encodeURIComponent(gmailPlayer)}&puzzle=1`)
    const lbGen = (await lbGenRes.json()) as any
    expect(lbGen.isSoloDomainPlayer).toBe(false)
  })
})
