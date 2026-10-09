import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  app,
  getUserStreak,
  recordUserSubmission,
  isSubscriberInactive,
  processInactiveSubscribers,
  sendDailyPuzzleEmails,
  renderInactivityUnsubscribeEmailHtml,
  renderInactivityUnsubscribeEmailText,
} from '../src/index'
import { addSubscriber, getSubscribers, getUserSettings, updateUserSettings } from '../src/services'
import { getDailyPuzzle } from '../src/game'
import { kvPut, MEMORY_STORE } from '../src/core'

describe('Streaks Feature', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  it('should calculate streak based on consecutive game numbers, not dates', async () => {
    const testEmail = `streak_calc_${Date.now()}@example.com`
    const storage: any = {}

    // Game 1
    await recordUserSubmission(storage, testEmail, '1')
    expect(await getUserStreak(storage, testEmail, '1')).toBe(1)

    // Game 2
    await recordUserSubmission(storage, testEmail, '2')
    expect(await getUserStreak(storage, testEmail, '2')).toBe(2)

    // Game 3
    await recordUserSubmission(storage, testEmail, '3')
    expect(await getUserStreak(storage, testEmail, '3')).toBe(3)

    // Game 4
    await recordUserSubmission(storage, testEmail, '4')
    expect(await getUserStreak(storage, testEmail, '4')).toBe(4)
  })

  it('should reset streak when game numbers are not consecutive', async () => {
    const testEmail = `broken_streak_${Date.now()}@example.com`
    const storage: any = {}

    // User played Game 1 and Game 2, but skipped Game 3 and played Game 4
    await recordUserSubmission(storage, testEmail, '1')
    await recordUserSubmission(storage, testEmail, '2')
    await recordUserSubmission(storage, testEmail, '4')

    // At game 4, only game 4 is consecutive (game 3 is missing)
    expect(await getUserStreak(storage, testEmail, '4')).toBe(1)
  })

  it('should handle game numbers out of order', async () => {
    const testEmail = `out_of_order_${Date.now()}@example.com`
    const storage: any = {}

    // Played in random order: 3, 1, 2
    await recordUserSubmission(storage, testEmail, '3')
    await recordUserSubmission(storage, testEmail, '1')
    await recordUserSubmission(storage, testEmail, '2')

    expect(await getUserStreak(storage, testEmail, '3')).toBe(3)
  })

  it('should display streak badge only for current player when streak >= 3', async () => {
    const domain = 'acmecorp.com'
    const playerA = `player_a_${Date.now()}@${domain}`
    const playerB = `player_b_${Date.now()}@${domain}`

    const p1 = getDailyPuzzle('1')
    const p2 = getDailyPuzzle('2')
    const p3 = getDailyPuzzle('3')

    // Player A plays 3 consecutive games (1, 2, 3)
    await recordUserSubmission(undefined, playerA, p1.id)
    await recordUserSubmission(undefined, playerA, p2.id)
    await recordUserSubmission(undefined, playerA, p3.id)

    // Player B plays only game 3
    await recordUserSubmission(undefined, playerB, p3.id)

    // Both players solve game 3 to enter leaderboard
    await app.request(`/api/guess?email=${encodeURIComponent(playerA)}&puzzle=3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p3.word }).toString(),
    })
    await app.request(`/api/guess?email=${encodeURIComponent(playerB)}&puzzle=3`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p3.word }).toString(),
    })

    // 1. When Player A views leaderboard for game 3:
    // Player A (current player) should have badge "🔥 3", Player B should NOT have a badge
    const lbResA = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(playerA)}&puzzle=3`)
    expect(lbResA.status).toBe(200)
    const lbDataA = await lbResA.json() as any

    const itemA_viewedByA = lbDataA.players.find((p: any) => p.email.toLowerCase() === playerA.toLowerCase())
    const itemB_viewedByA = lbDataA.players.find((p: any) => p.email.toLowerCase() === playerB.toLowerCase())

    expect(itemA_viewedByA).toBeDefined()
    expect(itemA_viewedByA.isCurrentPlayer).toBe(true)
    expect(itemA_viewedByA.streak).toBe(3)
    expect(itemA_viewedByA.streakBadge).toBe('🔥 3')
    expect(itemA_viewedByA.score).toMatch(/^\d+ points$/)
    expect(itemA_viewedByA.score).not.toContain('guess')

    expect(itemB_viewedByA).toBeDefined()
    expect(itemB_viewedByA.isCurrentPlayer).toBe(false)
    expect(itemB_viewedByA.streakBadge).toBeUndefined()
    expect(itemB_viewedByA.score).toMatch(/^\d+ points$/)
    expect(itemB_viewedByA.score).not.toContain('guess')

    // 2. When Player B views leaderboard:
    // Player B has streak = 1 (< 3), so neither should have a badge displayed
    const lbResB = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(playerB)}&puzzle=3`)
    const lbDataB = await lbResB.json() as any

    const itemB_viewedByB = lbDataB.players.find((p: any) => p.email.toLowerCase() === playerB.toLowerCase())
    expect(itemB_viewedByB.isCurrentPlayer).toBe(true)
    expect(itemB_viewedByB.streakBadge).toBeUndefined()
  })

  it('should not display badge if streak is less than 3', async () => {
    const domain = 'streaktest.com'
    const player = `player_short_${Date.now()}@${domain}`
    const p1 = getDailyPuzzle('1')
    const p2 = getDailyPuzzle('2')

    // Played games 1 and 2 (streak = 2)
    await recordUserSubmission(undefined, player, p1.id)
    await recordUserSubmission(undefined, player, p2.id)

    await app.request(`/api/guess?email=${encodeURIComponent(player)}&puzzle=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p2.word }).toString(),
    })

    const lbRes = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(player)}&puzzle=2`)
    const lbData = await lbRes.json() as any
    const playerItem = lbData.players.find((p: any) => p.email.toLowerCase() === player.toLowerCase())

    expect(playerItem).toBeDefined()
    expect(playerItem.streakBadge).toBeUndefined()
  })
})

describe('Inactivity Unsubscribe Feature (7 Days in a Row)', () => {
  it('should identify a subscriber as inactive when they miss 7 consecutive games', async () => {
    const testEmail = `inactive_sub_${Date.now()}@test.com`
    const storage: any = {}

    // Subscribed at Game 1 (2026-08-17)
    const subscriber = {
      email: testEmail,
      domain: 'test.com',
      subscribedAt: '2026-08-17T12:00:00Z',
      status: 'active' as const
    }

    // User submitted only for Game 1, 2, 3
    await recordUserSubmission(storage, testEmail, '1')
    await recordUserSubmission(storage, testEmail, '2')
    await recordUserSubmission(storage, testEmail, '3')

    // Current is Game 10:
    // Window: games 3, 4, 5, 6, 7, 8, 9 (7 games).
    // User played Game 3, so not inactive at Game 10!
    expect(await isSubscriberInactive(storage, testEmail, 10, subscriber)).toBe(false)

    // Current is Game 11:
    // Window: games 4, 5, 6, 7, 8, 9, 10 (7 games).
    // User submitted for none of these games -> Inactive!
    expect(await isSubscriberInactive(storage, testEmail, 11, subscriber)).toBe(true)
  })

  it('should not mark a user inactive if they submitted in the last 7 games', async () => {
    const testEmail = `active_player_${Date.now()}@test.com`
    const storage: any = {}

    const subscriber = {
      email: testEmail,
      domain: 'test.com',
      subscribedAt: '2026-08-17T12:00:00Z',
      status: 'active' as const
    }

    // Current is Game 15. Window is 8..14. User submitted for Game 10.
    await recordUserSubmission(storage, testEmail, '10')

    expect(await isSubscriberInactive(storage, testEmail, 15, subscriber)).toBe(false)
  })

  it('should not unsubscribe recent subscribers who joined less than 7 games ago', async () => {
    const testEmail = `new_sub_${Date.now()}@test.com`
    const storage: any = {}

    // Joined on Game 12 (2026-08-28)
    const subscriber = {
      email: testEmail,
      domain: 'test.com',
      subscribedAt: '2026-08-28T12:00:00Z',
      status: 'active' as const
    }

    // Today is Game 15. User hasn't submitted, but joined only 3 games ago
    expect(await isSubscriberInactive(storage, testEmail, 15, subscriber)).toBe(false)
  })

  it('should process inactive subscribers, unsubscribe them, and send notification email', async () => {
    const storage: any = {}
    const inactiveEmail = `to_unsub_${Date.now()}@testfirm.com`
    const activeEmail = `to_keep_${Date.now()}@testfirm.com`

    // Subscribed early (Game 1: 2026-08-17)
    await addSubscriber(storage, inactiveEmail)
    await addSubscriber(storage, activeEmail)

    // Override subscribedAt to early date
    const subs = await getSubscribers(storage)
    const subInactive = subs.find(s => s.email === inactiveEmail)!
    const subActive = subs.find(s => s.email === activeEmail)!
    subInactive.subscribedAt = '2026-08-17T09:00:00Z'
    subActive.subscribedAt = '2026-08-17T09:00:00Z'
    await kvPut(storage, 'subscribers:list', subs)

    // Active user submitted for Game 10
    await recordUserSubmission(storage, activeEmail, '10')

    // Today is Game 15
    const result = await processInactiveSubscribers(storage, 15, {
      isDryRun: false,
      origin: 'https://inboxed.fun',
    })

    expect(result.unsubscribedCount).toBe(1)
    expect(result.unsubscribedEmails).toContain(inactiveEmail)
    expect(result.unsubscribedEmails).not.toContain(activeEmail)

    // Verify subscriber status in storage
    const updatedSubs = await getSubscribers(storage)
    const unsubEntry = updatedSubs.find(s => s.email === inactiveEmail)
    const activeEntry = updatedSubs.find(s => s.email === activeEmail)

    expect(unsubEntry?.status).toBe('unsubscribed')
    expect(activeEntry?.status).toBe('active')
  })

  it('should exclude inactive subscribers from daily puzzle email dispatch', async () => {
    const storage: any = {}
    const inactiveUser = `daily_inactive_${Date.now()}@corp.com`
    const activeUser = `daily_active_${Date.now()}@corp.com`

    await addSubscriber(storage, inactiveUser)
    await addSubscriber(storage, activeUser)

    const subs = await getSubscribers(storage)
    subs.find(s => s.email === inactiveUser)!.subscribedAt = '2026-08-17T09:00:00Z'
    subs.find(s => s.email === activeUser)!.subscribedAt = '2026-08-17T09:00:00Z'
    await kvPut(storage, 'subscribers:list', subs)

    // Active user submitted on Game 14
    await recordUserSubmission(storage, activeUser, '14')

    // Run daily send for Game 15
    const dispatchResult = await sendDailyPuzzleEmails(
      { DB: storage, PUBLIC_HTTPS_URL: 'https://inboxed.fun' },
      { puzzleId: 15, mode: 'subscribers' }
    )

    expect(dispatchResult.recipients).toContain(activeUser)
    expect(dispatchResult.recipients).not.toContain(inactiveUser)
    expect(dispatchResult.unsubscribedDueToInactivity).toContain(inactiveUser)
  })

  it('should render clean notification email HTML and Text for inactivity unsubscription', () => {
    const html = renderInactivityUnsubscribeEmailHtml({ origin: 'https://inboxed.fun' })
    const text = renderInactivityUnsubscribeEmailText({ origin: 'https://inboxed.fun' })

    expect(html).toContain("You've been unsubscribed")
    expect(html).toContain("haven't played Inboxed for the last 7 days")
    expect(html).toContain('https://inboxed.fun')

    expect(text).toContain("You've been unsubscribed from Inboxed")
    expect(text).toContain("haven't played Inboxed for the last 7 days")
    expect(text).toContain('https://inboxed.fun')
  })

  it('should not unsubscribe inactive subscribers in dry run mode', async () => {
    const storage: any = {}
    const inactiveEmail = `dry_inactive_${Date.now()}@corp.com`

    await addSubscriber(storage, inactiveEmail)
    const subs = await getSubscribers(storage)
    subs.find(s => s.email === inactiveEmail)!.subscribedAt = '2026-08-17T09:00:00Z'
    await kvPut(storage, 'subscribers:list', subs)

    const result = await processInactiveSubscribers(storage, 15, {
      isDryRun: true,
      origin: 'https://inboxed.fun',
    })

    expect(result.unsubscribedCount).toBe(1)
    expect(result.unsubscribedEmails).toContain(inactiveEmail)

    // Verify subscriber status remains active in storage
    const updatedSubs = await getSubscribers(storage)
    const subEntry = updatedSubs.find(s => s.email === inactiveEmail)
    expect(subEntry?.status).toBe('active')
  })

  it('should record user submission when letter hint is requested via POST /api/hint', async () => {
    const testEmail = `hint_sub_${Date.now()}@corp.com`
    const p1 = getDailyPuzzle('1')

    const res = await app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&puzzle=1`, {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const settings = await getUserSettings(undefined, testEmail)
    expect(settings.submittedPuzzles).toContain('1')
  })

  it('should render streak and score Mustache binding in compiled email HTML', async () => {
    const { EMAIL_HTML } = await import('../src/email/emailHtml')
    expect(EMAIL_HTML).toContain('.streak-text')
    expect(EMAIL_HTML).toContain('{{#hasStreak}}<span class="streak-text">{{streakBadge}}</span> {{/hasStreak}}{{score}}')
  })
})
