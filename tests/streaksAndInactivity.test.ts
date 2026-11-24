import { describe, it, expect, vi, beforeEach } from 'vitest'
import {
  app,
  getUserStreak,
  recordUserSubmission,
  isSubscriberInactive,
  getSubscriberInactivityStatus,
  processInactiveSubscribers,
  sendDailyPuzzleEmails,
  renderInactivityWarningEmailHtml,
  renderInactivityWarningEmailText,
  renderInactivityUnsubscribeEmailHtml,
  renderInactivityUnsubscribeEmailText,
} from '../src/index'
import {
  addSubscriber,
  getSubscribers,
  getUserSettings,
  updateUserSettings,
  updateSubscriberDeliveryPreferences,
  INACTIVITY_WARNING_DAYS,
  INACTIVITY_UNSUBSCRIBE_DAYS,
} from '../src/services'
import { getDailyPuzzle, getDateForPuzzleId } from '../src/game'
import { kvPut, MEMORY_STORE, generateAccountToken } from '../src/core'

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

  it('should forgive 1 missed puzzle per 5 puzzles (1 workweek) without counting the missed day', async () => {
    const testEmail = `soft_streak_single_${Date.now()}@example.com`
    const storage: any = {}

    // Played 1, 2, skipped 3, played 4 -> grace day bridges 3, streak = 3 (1, 2, 4)
    await recordUserSubmission(storage, testEmail, '1')
    await recordUserSubmission(storage, testEmail, '2')
    await recordUserSubmission(storage, testEmail, '4')

    expect(await getUserStreak(storage, testEmail, '4')).toBe(3)
  })

  it('should reset streak when missing 2 consecutive games', async () => {
    const testEmail = `broken_streak_2consec_${Date.now()}@example.com`
    const storage: any = {}

    // Played 1, skipped 2 and 3, played 4 -> breaks at 3 & 2
    await recordUserSubmission(storage, testEmail, '1')
    await recordUserSubmission(storage, testEmail, '4')

    expect(await getUserStreak(storage, testEmail, '4')).toBe(1)
  })

  it('should enforce at most 1 grace day per 5 puzzles and allow another grace day >= 5 puzzles later', async () => {
    const testEmail = `soft_streak_window_${Date.now()}@example.com`
    const storage: any = {}

    // Play 1, skip 2, play 3, 4, skip 5, play 6:
    // At 6: misses 5 (distance to next miss 2 is 5-2 = 3 < 5) -> breaks at 2, so streak counts 6, 4, 3 = 3
    for (const id of ['1', '3', '4', '6']) {
      await recordUserSubmission(storage, testEmail, id)
    }
    expect(await getUserStreak(storage, testEmail, '6')).toBe(3)

    // Now play 7, 8, 9, 10, skip 11, play 12:
    // Distance between misses 11 and 5 is 11 - 5 = 6 >= 5 -> both misses forgiven!
    for (const id of ['7', '8', '9', '10', '12']) {
      await recordUserSubmission(storage, testEmail, id)
    }
    // Streak from 12 down to 3 (skipping 11 and 5, breaking at 2): puzzles 12,10,9,8,7,6,4,3 = 8
    expect(await getUserStreak(storage, testEmail, '12')).toBe(8)
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

  it('should display streak badge for all visible players when streak >= 2 and omit when streak < 2', async () => {
    const domain = 'acmecorp.com'
    const playerA = `player_a_${Date.now()}@${domain}`
    const playerB = `player_b_${Date.now()}@${domain}`

    const p1 = getDailyPuzzle('1')
    const p2 = getDailyPuzzle('2')
    const p3 = getDailyPuzzle('3')

    // Player A plays 3 consecutive games (1, 2, 3) -> streak 3
    await recordUserSubmission(undefined, playerA, p1.id)
    await recordUserSubmission(undefined, playerA, p2.id)
    await recordUserSubmission(undefined, playerA, p3.id)

    // Player B plays 2 consecutive games (2, 3) -> streak 2
    await recordUserSubmission(undefined, playerB, p2.id)
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

    // Player A views leaderboard -> sees BOTH 🔥 3 (self) and 🔥 2 (Player B)
    const lbResA = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(playerA)}&puzzle=3`)
    expect(lbResA.status).toBe(200)
    const lbDataA = await lbResA.json() as any

    const itemA_viewedByA = lbDataA.players.find((p: any) => p.email.toLowerCase() === playerA.toLowerCase())
    const itemB_viewedByA = lbDataA.players.find((p: any) => p.email.toLowerCase() === playerB.toLowerCase())

    expect(itemA_viewedByA).toBeDefined()
    expect(itemA_viewedByA.isCurrentPlayer).toBe(true)
    expect(itemA_viewedByA.streak).toBe(3)
    expect(itemA_viewedByA.streakBadge).toBe('🔥 3')

    expect(itemB_viewedByA).toBeDefined()
    expect(itemB_viewedByA.isCurrentPlayer).toBe(false)
    expect(itemB_viewedByA.streak).toBe(2)
    expect(itemB_viewedByA.streakBadge).toBe('🔥 2')
  })

  it('should not display badge if streak is less than 2', async () => {
    const domain = 'streaktest.com'
    const player = `player_short_${Date.now()}@${domain}`
    const p1 = getDailyPuzzle('1')

    await recordUserSubmission(undefined, player, p1.id)

    await app.request(`/api/guess?email=${encodeURIComponent(player)}&puzzle=1`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': p1.word }).toString(),
    })

    const lbRes = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(player)}&puzzle=1`)
    const lbData = await lbRes.json() as any
    const playerItem = lbData.players.find((p: any) => p.email.toLowerCase() === player.toLowerCase())

    expect(playerItem).toBeDefined()
    expect(playerItem.streakBadge).toBeUndefined()
  })

  it('should render pre-play streak banner in email when user has an incoming streak and omit when 0', async () => {
    const player = `email_banner_${Date.now()}@corp.com`

    // No prior plays on puzzle 3 -> no banner
    const resNoStreak = await app.request(`/?email=${encodeURIComponent(player)}&puzzle=3&forceHttps=true`)
    const htmlNoStreak = await resNoStreak.text()
    expect(htmlNoStreak).not.toContain('<div class="streak-banner">')

    // Play puzzle 1 and 2 -> puzzle 3 email shows 2-day incoming streak banner
    await recordUserSubmission(undefined, player, '1')
    await recordUserSubmission(undefined, player, '2')

    const resWithStreak = await app.request(`/?email=${encodeURIComponent(player)}&puzzle=3&forceHttps=true`)
    const htmlWithStreak = await resWithStreak.text()
    expect(htmlWithStreak).toContain('<div class="streak-banner">🔥 2-day streak — keep it alive today!</div>')
  })
})

describe('Inactivity Check-In (14 Days) & Auto-Unsubscribe (21 Days) Feature', () => {
  beforeEach(() => {
    MEMORY_STORE.clear()
  })

  it('should warn at 14 consecutive missed games and mark inactive at 21 consecutive missed games', async () => {
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

    expect(INACTIVITY_WARNING_DAYS).toBe(14)
    expect(INACTIVITY_UNSUBSCRIBE_DAYS).toBe(21)

    // Current is Game 17 -> missed Games 4..16 (13 games). Still active!
    expect(await getSubscriberInactivityStatus(storage, testEmail, 17, subscriber)).toBe('active')
    expect(await isSubscriberInactive(storage, testEmail, 17, subscriber)).toBe(false)

    // Current is Game 18 -> missed Games 4..17 (14 games). Trigger check-in warning, NOT unsubscribe!
    expect(await getSubscriberInactivityStatus(storage, testEmail, 18, subscriber)).toBe('warn')
    expect(await isSubscriberInactive(storage, testEmail, 18, subscriber)).toBe(false)

    // After warning is sent on Game 18, Games 19..24 stay in 'warned' (no duplicate warning emails)
    const warnedSubscriber = { ...subscriber, inactivityWarningSentForPuzzle: '18' }
    expect(await getSubscriberInactivityStatus(storage, testEmail, 19, warnedSubscriber)).toBe('warned')
    expect(await getSubscriberInactivityStatus(storage, testEmail, 24, warnedSubscriber)).toBe('warned')
    expect(await isSubscriberInactive(storage, testEmail, 24, warnedSubscriber)).toBe(false)

    // Current is Game 25 -> missed Games 4..24 (21 games). Now eligible for auto-unsubscribe!
    expect(await getSubscriberInactivityStatus(storage, testEmail, 25, warnedSubscriber)).toBe('unsubscribe')
    expect(await isSubscriberInactive(storage, testEmail, 25, warnedSubscriber)).toBe(true)
  })

  it('should not mark a user inactive if they submitted in the last 14 games', async () => {
    const testEmail = `active_player_${Date.now()}@test.com`
    const storage: any = {}

    const subscriber = {
      email: testEmail,
      domain: 'test.com',
      subscribedAt: '2026-08-17T12:00:00Z',
      status: 'active' as const
    }

    // Current is Game 25. Window is 11..24 for warning, 4..24 for unsub. User submitted for Game 15.
    await recordUserSubmission(storage, testEmail, '15')

    expect(await getSubscriberInactivityStatus(storage, testEmail, 25, subscriber)).toBe('active')
    expect(await isSubscriberInactive(storage, testEmail, 25, subscriber)).toBe(false)
  })

  it('should not warn or unsubscribe recent subscribers who joined less than 14 games ago', async () => {
    const testEmail = `new_sub_${Date.now()}@test.com`
    const storage: any = {}

    // Joined on Game 12 (2026-08-28)
    const subscriber = {
      email: testEmail,
      domain: 'test.com',
      subscribedAt: '2026-08-28T12:00:00Z',
      status: 'active' as const
    }

    // Today is Game 22. User joined 10 games ago (< 14).
    expect(await getSubscriberInactivityStatus(storage, testEmail, 22, subscriber)).toBe('active')
    expect(await isSubscriberInactive(storage, testEmail, 22, subscriber)).toBe(false)
  })

  it('should send a Day-14 check-in warning once without unsubscribing, then unsubscribe at Day 21', async () => {
    const storage: any = {}
    const inactiveEmail = `to_warn_then_unsub_${Date.now()}@testfirm.com`
    const activeEmail = `to_keep_${Date.now()}@testfirm.com`

    await addSubscriber(storage, inactiveEmail)
    await addSubscriber(storage, activeEmail)

    const subs = await getSubscribers(storage)
    subs.find(s => s.email === inactiveEmail)!.subscribedAt = '2026-08-17T09:00:00Z'
    subs.find(s => s.email === activeEmail)!.subscribedAt = '2026-08-17T09:00:00Z'
    await kvPut(storage, 'subscribers:list', subs)

    // Active user submitted on Game 14
    await recordUserSubmission(storage, activeEmail, '14')

    // Day 15 (missed Games 1..14 = 14 games): should send check-in warning, keep subscriber active
    const warnResult = await processInactiveSubscribers(storage, 15, {
      isDryRun: false,
      origin: 'https://inboxed.fun',
    })
    expect(warnResult.warnedCount).toBe(1)
    expect(warnResult.warnedEmails).toContain(inactiveEmail)
    expect(warnResult.unsubscribedCount).toBe(0)

    const subsAfterWarn = await getSubscribers(storage)
    const warnedEntry = subsAfterWarn.find(s => s.email === inactiveEmail)!
    expect(warnedEntry.status).toBe('active')
    expect(warnedEntry.inactivityWarningSentForPuzzle).toBe('15')

    // Day 16: already warned, should NOT warn again or unsubscribe
    const day16Result = await processInactiveSubscribers(storage, 16, {
      isDryRun: false,
      origin: 'https://inboxed.fun',
    })
    expect(day16Result.warnedCount).toBe(0)
    expect(day16Result.unsubscribedCount).toBe(0)

    // Day 22 (missed Games 1..21 = 21 games): should now unsubscribe inactiveEmail
    await recordUserSubmission(storage, activeEmail, '20')
    const unsubResult = await processInactiveSubscribers(storage, 22, {
      isDryRun: false,
      origin: 'https://inboxed.fun',
    })
    expect(unsubResult.unsubscribedCount).toBe(1)
    expect(unsubResult.unsubscribedEmails).toContain(inactiveEmail)
    expect(unsubResult.unsubscribedEmails).not.toContain(activeEmail)

    const updatedSubs = await getSubscribers(storage)
    expect(updatedSubs.find(s => s.email === inactiveEmail)?.status).toBe('unsubscribed')
    expect(updatedSubs.find(s => s.email === activeEmail)?.status).toBe('active')
  })

  it('should exclude unsubscribed, warned (on warning day), paused, and weekend-skipped weekday subscribers from daily puzzle dispatch', async () => {
    const storage: any = {}
    const inactiveUser = `daily_inactive_${Date.now()}@corp.com`
    const warningUser = `daily_warn_${Date.now()}@corp.com`
    const pausedUser = `daily_paused_${Date.now()}@corp.com`
    const weekdayUser = `daily_weekday_${Date.now()}@corp.com`
    const activeUser = `daily_active_${Date.now()}@corp.com`

    for (const em of [inactiveUser, warningUser, pausedUser, weekdayUser, activeUser]) {
      await addSubscriber(storage, em)
    }

    // Puzzle #27 is 2026-10-24 (Saturday)
    const satPuzzleId = 27
    const satDate = getDateForPuzzleId(satPuzzleId)
    expect(satDate).toBe('2026-10-24')

    const subs = await getSubscribers(storage)
    for (const s of subs) {
      s.subscribedAt = '2026-09-28T09:00:00Z'
    }
    // pausedUser is paused until 2026-11-05 (after Oct 24)
    subs.find(s => s.email === pausedUser)!.pausedUntil = '2026-11-05'
    // weekdayUser wants Mon-Fri only
    subs.find(s => s.email === weekdayUser)!.emailFrequency = 'weekdays'
    await kvPut(storage, 'subscribers:list', subs)

    // warningUser played on Game 12 (missed Games 13..26 = 14 games -> warn on Game 27)
    await recordUserSubmission(storage, warningUser, '12')
    // activeUser and weekdayUser played recently
    await recordUserSubmission(storage, activeUser, '26')
    await recordUserSubmission(storage, weekdayUser, '26')
    // inactiveUser never played (missed Games 1..26 -> unsubscribe on Game 27)

    const dispatchResult = await sendDailyPuzzleEmails(
      { DB: storage, PUBLIC_HTTPS_URL: 'https://inboxed.fun' },
      { puzzleId: satPuzzleId, mode: 'subscribers', isDryRun: true }
    )

    expect(dispatchResult.recipients).toContain(activeUser)
    expect(dispatchResult.recipients).not.toContain(inactiveUser)
    expect(dispatchResult.recipients).not.toContain(warningUser)
    expect(dispatchResult.recipients).not.toContain(pausedUser)
    expect(dispatchResult.recipients).not.toContain(weekdayUser)
    expect(dispatchResult.unsubscribedDueToInactivity).toContain(inactiveUser)
    expect(dispatchResult.warnedDueToInactivity).toContain(warningUser)
    expect(dispatchResult.skippedDueToSchedule).toContain(pausedUser)
    expect(dispatchResult.skippedDueToSchedule).toContain(weekdayUser)

    // Puzzle #29 is 2026-10-26 (Monday) -> weekdayUser SHOULD receive Monday's puzzle!
    const monDispatch = await sendDailyPuzzleEmails(
      { DB: storage, PUBLIC_HTTPS_URL: 'https://inboxed.fun' },
      { puzzleId: 29, mode: 'subscribers', isDryRun: true }
    )
    expect(monDispatch.recipients).toContain(weekdayUser)
    expect(monDispatch.recipients).not.toContain(pausedUser)
  })

  it('should render clean check-in warning and 21-day inactivity unsubscribe emails with signed action links', () => {
    const email = 'inactive_reader@corp.com'

    const warnHtml = renderInactivityWarningEmailHtml({
      origin: 'https://inboxed.fun',
      email,
    })
    const warnText = renderInactivityWarningEmailText({
      origin: 'https://inboxed.fun',
      email,
    })

    expect(warnHtml).toContain('Still want Inboxed puzzles?')
    expect(warnHtml).toContain("haven't played Inboxed for the last 14 puzzles")
    expect(warnHtml).toContain('Keep Getting Puzzles')
    expect(warnHtml).not.toContain('Switch to Weekdays Only')
    expect(warnHtml).toContain('Pause for 2 Weeks')
    expect(warnHtml).toContain('action=keep')
    expect(warnHtml).toContain('action=pause')

    expect(warnText).toContain('Still want Inboxed puzzles?')
    expect(warnText).toContain('action=keep')
    expect(warnText).toContain('action=pause')

    const html = renderInactivityUnsubscribeEmailHtml({
      origin: 'https://inboxed.fun',
      email,
    })
    const text = renderInactivityUnsubscribeEmailText({
      origin: 'https://inboxed.fun',
      email,
    })

    expect(html).toContain("You've been unsubscribed")
    expect(html).toContain("haven't played Inboxed for the last 21 puzzles")
    expect(html).toContain('Resubscribe')
    expect(html).toContain('https://inboxed.fun/account?token=')

    expect(text).toContain("You've been unsubscribed from Inboxed")
    expect(text).toContain("haven't played Inboxed for the last 21 puzzles")
    expect(text).toContain('https://inboxed.fun/account?token=')
  })

  it('should expose Check-In Email and Auto-Unsub Email preview tabs in /dev', async () => {
    const devRes = await app.request('http://localhost:8787/dev?email=player@corp.com')
    expect(devRes.status).toBe(200)
    const devHtml = await devRes.text()
    expect(devHtml).toContain('data-page="confirm-email"')
    expect(devHtml).toContain('✉️ Confirm Email')
    expect(devHtml).toContain('data-page="inactivity-check-in"')
    expect(devHtml).toContain('👋 Check-In Email')
    expect(devHtml).toContain('data-page="auto-unsub"')
    expect(devHtml).toContain('📭 Auto-Unsub Email')

    const checkInRes = await app.request('http://localhost:8787/dev/email/inactivity-check-in?email=player@corp.com')
    expect(checkInRes.status).toBe(200)
    const checkInHtml = await checkInRes.text()
    expect(checkInHtml).toContain('Still want Inboxed puzzles?')
    expect(checkInHtml).toContain('action=keep')

    const previewRes = await app.request('http://localhost:8787/dev/email/auto-unsub?email=player@corp.com')
    expect(previewRes.status).toBe(200)
    const previewHtml = await previewRes.text()
    expect(previewHtml).toContain("You've been unsubscribed")
    expect(previewHtml).toContain('Resubscribe')
    expect(previewHtml).toContain('background-color: #C4F7CA')
    expect(previewHtml).toContain('/account?token=')

    const rawRes = await app.request('http://localhost:8787/dev/raw?page=auto-unsub&email=player@corp.com')
    expect(rawRes.status).toBe(200)
    const rawHtml = await rawRes.text()
    expect(rawHtml).toContain("You've been unsubscribed")
  })

  it('should support keep, weekdays, pause, and resume actions via POST /api/account/delivery-preferences and reset inactivity grace window', async () => {
    const email = `delivery_prefs_${Date.now()}@corp.com`
    await addSubscriber(undefined, email)
    const subs = await getSubscribers(undefined)
    subs.find(s => s.email === email)!.subscribedAt = '2026-09-28T09:00:00Z'
    await kvPut(undefined, 'subscribers:list', subs)

    const token = generateAccountToken(email)

    // 1. Switch to weekdays via check-in action
    const wkRes = await app.request('/api/account/delivery-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'weekdays' }),
    })
    expect(wkRes.status).toBe(200)
    const wkData = await wkRes.json() as any
    expect(wkData.success).toBe(true)
    expect(wkData.emailFrequency).toBe('weekdays')
    expect(wkData.isPaused).toBe(false)

    // 2. Pause for 2 weeks
    const pauseRes = await app.request('/api/account/delivery-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'pause' }),
    })
    expect(pauseRes.status).toBe(200)
    const pauseData = await pauseRes.json() as any
    expect(pauseData.success).toBe(true)
    expect(pauseData.isPaused).toBe(true)
    expect(pauseData.pausedUntil).toMatch(/^\d{4}-\d{2}-\d{2}$/)

    // Verify GET /api/account reflects paused & weekdays state
    const acctRes = await app.request(`/api/account?token=${encodeURIComponent(token)}`)
    expect(acctRes.status).toBe(200)
    const acctData = await acctRes.json() as any
    expect(acctData.emailFrequency).toBe('weekdays')
    expect(acctData.isPaused).toBe(true)
    expect(acctData.pausedUntil).toBe(pauseData.pausedUntil)

    // 3. Resume emails now
    const resumeRes = await app.request('/api/account/delivery-preferences', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, action: 'resume' }),
    })
    expect(resumeRes.status).toBe(200)
    const resumeData = await resumeRes.json() as any
    expect(resumeData.isPaused).toBe(false)
    expect(resumeData.pausedUntil).toBeNull()

    // 4. Confirming active resets inactivity grace period so user is not marked inactive
    const updatedSubs = await getSubscribers(undefined)
    const entry = updatedSubs.find(s => s.email === email)!
    expect(entry.inactivityConfirmedAt).toBeTruthy()
    expect(await getSubscriberInactivityStatus(undefined, email, 30, entry)).toBe('active')
  })

  it('should give a fresh grace window after a 2-week pause ends', async () => {
    const email = `post_pause_${Date.now()}@corp.com`
    const storage: any = {}
    await addSubscriber(storage, email)
    await updateSubscriberDeliveryPreferences(storage, email, {
      pausedUntil: '2026-10-20', // Puzzle #23
    })
    const subs = await getSubscribers(storage)
    const entry = subs.find(s => s.email === email)!
    entry.subscribedAt = '2026-09-28T09:00:00Z' // Puzzle #1
    entry.inactivityConfirmedAt = null
    await kvPut(storage, 'subscribers:list', subs)

    // During pause (Puzzle #20 = 2026-10-17): active
    expect(await getSubscriberInactivityStatus(storage, email, 20, entry)).toBe('active')
    // Right after resume (Puzzle #25 = 2026-10-22, 2 days after resume): still active!
    expect(await getSubscriberInactivityStatus(storage, email, 25, entry)).toBe('active')
    // 14 games after resume (Puzzle #37 = 2026-11-03): now triggers check-in warning
    expect(await getSubscriberInactivityStatus(storage, email, 37, entry)).toBe('warn')
  })

  it('should allow an auto-unsubscribed user to resubscribe via User Preferences without being immediately unsubscribed next day', async () => {
    const inactiveEmail = `resub_after_inactivity_${Date.now()}@corp.com`

    await addSubscriber(undefined, inactiveEmail)
    const subs = await getSubscribers(undefined)
    subs.find(s => s.email === inactiveEmail)!.subscribedAt = '2026-09-28T09:00:00Z'
    await kvPut(undefined, 'subscribers:list', subs)

    // Auto-unsubscribe on Game 25 (missed Games 4..24)
    const result = await processInactiveSubscribers(undefined, 25, {
      isDryRun: false,
      origin: 'https://inboxed.fun',
    })
    expect(result.unsubscribedEmails).toContain(inactiveEmail)

    // Extract the signed token from the generated inactivity email URL
    const html = renderInactivityUnsubscribeEmailHtml({
      origin: 'https://inboxed.fun',
      email: inactiveEmail,
    })
    const tokenMatch = html.match(/\/account\?token=([^"&]+)/)
    expect(tokenMatch).not.toBeNull()
    const token = decodeURIComponent(tokenMatch![1])

    // User opens User Preferences (/api/account?token=...) and sees isSubscribed: false
    const acctRes = await app.request(`/api/account?token=${encodeURIComponent(token)}`)
    expect(acctRes.status).toBe(200)
    const acctData = await acctRes.json() as any
    expect(acctData.isSubscribed).toBe(false)

    // User toggles subscription ON in User Preferences
    const toggleRes = await app.request('/api/account/toggle-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, subscribed: true }),
    })
    expect(toggleRes.status).toBe(200)
    const toggleData = await toggleRes.json() as any
    expect(toggleData.isSubscribed).toBe(true)

    // Verify subscribedAt was refreshed so the next day's cron does NOT immediately unsubscribe them
    const refreshedSubs = await getSubscribers(undefined)
    const refreshedEntry = refreshedSubs.find(s => s.email === inactiveEmail)!
    expect(refreshedEntry.status).toBe('active')
    expect(refreshedEntry.subscribedAt).not.toBe('2026-09-28T09:00:00Z')
    expect(await isSubscriberInactive(undefined, inactiveEmail, 26, refreshedEntry)).toBe(false)
  })

  it('should not unsubscribe inactive subscribers in dry run mode', async () => {
    const storage: any = {}
    const inactiveEmail = `dry_inactive_${Date.now()}@corp.com`

    await addSubscriber(storage, inactiveEmail)
    const subs = await getSubscribers(storage)
    subs.find(s => s.email === inactiveEmail)!.subscribedAt = '2026-08-17T09:00:00Z'
    await kvPut(storage, 'subscribers:list', subs)

    const result = await processInactiveSubscribers(storage, 25, {
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

    const res = await app.request(`/api/hint?email=${encodeURIComponent(testEmail)}&puzzle=1`, {
      method: 'POST',
    })
    expect(res.status).toBe(200)

    const settings = await getUserSettings(undefined, testEmail)
    expect(settings.submittedPuzzles).toContain('1')
  })

  it('should ignore legacy playedPuzzles and playedDates if the user has no actual submissions or game plays in the last 21 games', async () => {
    const testEmail = `legacy_activity_${Date.now()}@corp.com`
    const storage: any = {}

    const subscriber = {
      email: testEmail,
      domain: 'corp.com',
      subscribedAt: '2026-09-29T12:00:00Z',
      status: 'active' as const,
    }

    // Simulate legacy email-send recordUserActivity populating playedPuzzles and playedDates up to Game 11
    await updateUserSettings(storage, {
      email: testEmail,
      domain: 'corp.com',
      showOnLeaderboard: true,
      theme: 'light',
      playedPuzzles: ['2', '3', '4', '5', '6', '7', '8', '9', '10', '11'],
      playedDates: [
        '2026-09-29', '2026-09-30', '2026-10-01', '2026-10-02', '2026-10-03',
        '2026-10-04', '2026-10-05', '2026-10-06', '2026-10-07', '2026-10-08',
      ],
    })

    // User has no submittedPuzzles and no game:* records in games 5..25 -> should be inactive at Game 26
    expect(await isSubscriberInactive(storage, testEmail, 26, subscriber)).toBe(true)
  })

  it('should render streak and score Mustache binding in compiled email HTML', async () => {
    const { EMAIL_HTML } = await import('../src/email/emailHtml')
    expect(EMAIL_HTML).toContain('.streak-text')
    expect(EMAIL_HTML).toContain('{{#hasStreak}}<span class="streak-text">{{streakBadge}}</span> {{/hasStreak}}{{score}}')
  })
})
