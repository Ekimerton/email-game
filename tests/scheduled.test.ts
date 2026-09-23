import { describe, it, expect } from 'vitest'
import worker, { app, sendDailyPuzzleEmails } from '../src/index'

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

  it('should execute scheduled handler for daily cron (0 15 * * *) to send to subscribers and test emails', async () => {
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
})
