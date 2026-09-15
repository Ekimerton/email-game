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

  it('should execute scheduled handler without errors', async () => {
    const mockEvent = {
      cron: '0 17 * * *',
      scheduledTime: Date.now(),
      type: 'cron',
    } as any

    const mockEnv = {
      GAME_STATE_KV: undefined as any,
      PUBLIC_HTTPS_URL: 'https://inboxed.fun',
      TEST_EMAILS: 'test@example.com',
    }

    const mockCtx = {
      waitUntil: (promise: Promise<any>) => promise,
      passThroughOnException: () => {},
    } as any

    await expect(worker.scheduled(mockEvent, mockEnv, mockCtx)).resolves.not.toThrow()
  })
})
