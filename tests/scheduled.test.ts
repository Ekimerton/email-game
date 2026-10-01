import { describe, it, expect } from 'vitest'
import worker, { app, sendDailyPuzzleEmails, getPuzzleDateForSendCron, getSignupHtml } from '../src/index'
import { getDailyPuzzle } from '../src/game'

describe('Cloudflare Daily Cron & Email Dispatch', () => {
  it('should dispatch daily puzzle emails to test emails when dry-run is requested', async () => {
    const result = await sendDailyPuzzleEmails(
      {
        PUBLIC_HTTPS_URL: 'https://inboxed.fun',
        TEST_EMAILS: 'test1@example.com, test2@example.com',
      },
      {
        isDryRun: true,
      }
    )

    expect(result.total).toBe(2)
    expect(result.sent).toBe(2)
    expect(result.failed).toBe(0)
    expect(result.recipients).toContain('test1@example.com')
    expect(result.recipients).toContain('test2@example.com')
  })

  it('should fallback to ekim0252@gmail.com if no subscribers or test emails exist', async () => {
    const result = await sendDailyPuzzleEmails(
      {
        PUBLIC_HTTPS_URL: 'https://inboxed.fun',
        TEST_EMAILS: '',
      },
      {
        isDryRun: true,
      }
    )

    expect(result.total).toBe(1)
    expect(result.recipients).toContain('ekim0252@gmail.com')
    expect(result.sent).toBe(1)
  })

  it('should trigger daily cron via admin endpoint /api/admin/trigger-daily-cron with dryRun flag', async () => {
    const res = await app.request('/api/admin/trigger-daily-cron?dryRun=true&email=player@company.com')
    expect(res.status).toBe(200)

    const data = await res.json() as any
    expect(data.success).toBe(true)
    expect(data.recipients).toContain('player@company.com')
    expect(data.sent).toBe(1)
    expect(data.failed).toBe(0)
  })

  it('should enforce ADMIN_SECRET on /api/admin/trigger-daily-cron when configured in env', async () => {
    const origEnv = process.env.ADMIN_SECRET
    process.env.ADMIN_SECRET = 'secret123'
    try {
      const unauthRes = await app.request('/api/admin/trigger-daily-cron?dryRun=true')
      expect(unauthRes.status).toBe(401)

      const authRes = await app.request('/api/admin/trigger-daily-cron?dryRun=true', {
        headers: { 'Authorization': 'Bearer secret123' }
      })
      expect(authRes.status).toBe(200)
    } finally {
      process.env.ADMIN_SECRET = origEnv
    }
  })

  it('should dispatch only to test emails when mode is test', async () => {
    const result = await sendDailyPuzzleEmails(
      {
        PUBLIC_HTTPS_URL: 'https://inboxed.fun',
        TEST_EMAILS: 'test1@example.com, test2@example.com',
      },
      {
        isDryRun: true,
        mode: 'test',
      }
    )

    expect(result.total).toBe(2)
    expect(result.recipients).toEqual(['test1@example.com', 'test2@example.com'])
  })

  it('should not dispatch to test emails when mode is subscribers and no subscribers exist', async () => {
    const result = await sendDailyPuzzleEmails(
      {
        PUBLIC_HTTPS_URL: 'https://inboxed.fun',
        TEST_EMAILS: 'tester@example.com',
      },
      {
        isDryRun: true,
        mode: 'subscribers',
      }
    )

    expect(result.total).toBe(0)
    expect(result.sent).toBe(0)
    expect(result.recipients).toEqual([])
  })

  it('should not dispatch puzzle emails to unsubscribed users', async () => {
    const { addSubscriber, removeSubscriber } = await import('../src/services')
    const testStorage: any = {}

    // Add subscribers and unsubscribe one of them
    await addSubscriber(testStorage, 'active_user@example.com')
    await addSubscriber(testStorage, 'unsub_user@example.com')
    await removeSubscriber(testStorage, 'unsub_user@example.com')

    const result = await sendDailyPuzzleEmails(
      {
        DB: testStorage,
        PUBLIC_HTTPS_URL: 'https://inboxed.fun',
      },
      {
        isDryRun: true,
        mode: 'subscribers',
      }
    )

    expect(result.recipients).toContain('active_user@example.com')
    expect(result.recipients).not.toContain('unsub_user@example.com')
    expect(result.total).toBe(1)
  })

  it('should execute scheduled handler for daily cron (0 15 * * *) to send exclusively to subscribers', async () => {
    const mockEvent = {
      cron: '0 15 * * *',
      scheduledTime: Date.now(),
      type: 'cron',
    } as any

    const mockEnv = {
      GAME_STATE_KV: undefined as any,
      PUBLIC_HTTPS_URL: 'https://inboxed.fun',
      TEST_EMAILS: 'tester@example.com',
    }

    const mockCtx = {
      waitUntil: (promise: Promise<any>) => promise,
      passThroughOnException: () => {},
    } as any

    await expect(worker.scheduled(mockEvent, mockEnv, mockCtx)).resolves.not.toThrow()
  })

  it('should dispatch dark mode CSS when user has dark theme enabled in settings', async () => {
    const darkUser = 'darkmode_player@example.com'
    const { generateAccountToken } = await import('../src/core')
    const token = generateAccountToken(darkUser)

    // Set user theme to dark
    const toggleRes = await app.request('/api/account/toggle-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, theme: 'dark' }),
    })
    expect(toggleRes.status).toBe(200)

    // Build email content for user
    const { buildPuzzleEmailContent } = await import('../src/index')
    const content = await buildPuzzleEmailContent(undefined, darkUser)
    expect(content.theme).toBe('dark')
    expect(content.ampHtml).toContain('background-color: #121212')
    expect(content.ampHtml).toContain('color: #f4f4f5')
    expect(content.fallbackHtml).toContain('background-color: #121212')
  })

  describe('Puzzle Switchover (5 Minutes Before Daily Send Cron)', () => {
    it('should compute correct puzzle date 5 minutes before 15:00 UTC send cron', () => {
      // 14:54 UTC on Sept 25 -> Still on Sept 24 puzzle
      expect(getPuzzleDateForSendCron(new Date('2026-09-25T14:54:00Z'))).toBe('2026-09-24')
      expect(getPuzzleDateForSendCron(new Date('2026-09-25T14:54:59.999Z'))).toBe('2026-09-24')

      // 14:55 UTC on Sept 25 -> Switches over to Sept 25 puzzle (5 mins before 15:00 UTC cron)
      expect(getPuzzleDateForSendCron(new Date('2026-09-25T14:55:00Z'))).toBe('2026-09-25')

      // 15:00 UTC on Sept 25 -> Cron dispatch fires with Sept 25 puzzle
      expect(getPuzzleDateForSendCron(new Date('2026-09-25T15:00:00Z'))).toBe('2026-09-25')

      // Next morning at 08:00 UTC on Sept 26 -> Still Sept 25 puzzle until 14:55 UTC
      expect(getPuzzleDateForSendCron(new Date('2026-09-26T08:00:00Z'))).toBe('2026-09-25')
      expect(getPuzzleDateForSendCron(new Date('2026-09-26T14:54:59Z'))).toBe('2026-09-25')

      // 14:55 UTC on Sept 26 -> Switches over to Sept 26 puzzle
      expect(getPuzzleDateForSendCron(new Date('2026-09-26T14:55:00Z'))).toBe('2026-09-26')
    })

    it('should switch over puzzle email dispatch at exactly 5 minutes before cron', async () => {
      const puzzle24 = getDailyPuzzle('2026-09-24')
      const puzzle25 = getDailyPuzzle('2026-09-25')

      // 14:54 UTC -> Dispatches Sept 24 puzzle
      const preResult = await sendDailyPuzzleEmails(
        { PUBLIC_HTTPS_URL: 'https://inboxed.fun', TEST_EMAILS: 'test@example.com' },
        { isDryRun: true, now: new Date('2026-09-25T14:54:00Z'), mode: 'test' }
      )
      expect(preResult.puzzleDate).toBe('2026-09-24')
      expect(preResult.puzzleId).toBe(puzzle24.id)

      // 14:55 UTC -> Dispatches Sept 25 puzzle
      const postResult = await sendDailyPuzzleEmails(
        { PUBLIC_HTTPS_URL: 'https://inboxed.fun', TEST_EMAILS: 'test@example.com' },
        { isDryRun: true, now: new Date('2026-09-25T14:55:00Z'), mode: 'test' }
      )
      expect(postResult.puzzleDate).toBe('2026-09-25')
      expect(postResult.puzzleId).toBe(puzzle25.id)
    })

    it('should switch over index landing page preview at exactly 5 minutes before cron', () => {
      const puzzle24 = getDailyPuzzle('2026-09-24')
      const puzzle25 = getDailyPuzzle('2026-09-25')

      const mockCtx = { req: { query: () => '' }, env: { SEND_CRON: '0 15 * * *' } }

      // 14:54 UTC -> Index page shows Puzzle 24 teaser
      const preHtml = getSignupHtml(mockCtx, undefined, new Date('2026-09-25T14:54:00Z'))
      expect(preHtml).toContain(`Puzzle #${puzzle24.id}`)
      expect(preHtml).toContain(puzzle24.definitions[0])

      // 14:55 UTC -> Index page switches over to Puzzle 25 teaser
      const postHtml = getSignupHtml(mockCtx, undefined, new Date('2026-09-25T14:55:00Z'))
      expect(postHtml).toContain(`Puzzle #${puzzle25.id}`)
      expect(postHtml).toContain(puzzle25.definitions[0])
    })
  })
})

