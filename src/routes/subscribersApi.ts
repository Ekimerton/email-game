import type { Hono } from 'hono'
import { generateConfirmationToken, verifyConfirmationToken, type Bindings } from '../core'
import { sendMailgunEmail, renderConfirmationEmailHtml, renderConfirmationEmailText, buildPuzzleEmailContent, sendDailyPuzzleEmails } from '../email'
import { getSubscribers, addSubscriber, removeSubscriber, unsubscribeUser, ensureSubscribedOnOpen, getUserEmail, resetUserDayState } from '../services'
import { getDailyPuzzle } from '../game'
import { getUnsubscribeHtml } from '../views'

export function registerSubscribersApiRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Subscribe Endpoint (Double Opt-In Email Confirmation Dispatch)
  app.post('/api/subscribe', async (c) => {
    try {
      let email = c.req.query('email')
      if (!email) {
        const contentType = c.req.header('Content-Type') || ''
        if (contentType.includes('application/json')) {
          const jsonBody = (await c.req.json().catch(() => ({}))) as Record<string, any>
          email = jsonBody.email || jsonBody.subscriberEmail
        } else {
          const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>
          email = (body['email'] as string) || (body['subscriberEmail'] as string)
        }
      }

      if (!email || !email.includes('@')) {
        return c.json({ success: false, message: '⚠️ Please provide a valid email address.' }, 400)
      }

      const cleanEmail = email.toLowerCase().trim()
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const token = generateConfirmationToken(cleanEmail, authSecret)

      const reqUrl = new URL(c.req.url)
      const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
      const forceHttps = c.req.query('forceHttps') === 'true'
      const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
      const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin

      const confirmUrl = `${currentOrigin}/confirm?token=${encodeURIComponent(token)}`
      const confirmHtml = renderConfirmationEmailHtml(confirmUrl)
      const confirmText = renderConfirmationEmailText(confirmUrl)

      await sendMailgunEmail({
        apiKey: c.env?.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY,
        domain: c.env?.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || 'inboxed.fun',
        from: c.env?.SENDER_EMAIL || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>',
        to: cleanEmail,
        subject: 'Confirm your subscription to Inboxed',
        html: confirmHtml,
        text: confirmText,
      })

      const acceptHeader = c.req.header('Accept') || ''
      const isHtmlReq = acceptHeader.includes('text/html') && !c.req.header('x-requested-with')
      if (isHtmlReq) {
        return c.redirect('/?pending=true&email=' + encodeURIComponent(cleanEmail))
      }

      return c.json({
        success: true,
        pending: true,
        message: `✉️ Confirmation link sent to ${cleanEmail}! Please check your email to activate your subscription.`,
        email: cleanEmail,
        token,
      })
    } catch (error: any) {
      return c.json({ success: false, message: '⚠️ Failed to process subscription.' }, 500)
    }
  })

  // Send Today's Puzzle Endpoint (Triggered from confirmation page)
  app.post('/api/send-today', async (c) => {
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || '').toLowerCase().trim()
      const token = body.token as string || ''
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

      const verified = verifyConfirmationToken(token, authSecret, 7 * 24 * 60 * 60 * 1000)
      if (!verified || verified.email !== email) {
        return c.json({ success: false, message: 'Invalid or expired confirmation token.' }, 401)
      }

      // Ensure subscriber is persisted in KV
      await addSubscriber(c.env?.GAME_STATE_KV, email)

      const reqUrl = new URL(c.req.url)
      const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
      const forceHttps = c.req.query('forceHttps') === 'true'
      const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
      const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin

      const emailContent = await buildPuzzleEmailContent(
        c.env?.GAME_STATE_KV,
        email,
        undefined,
        currentOrigin,
        authSecret
      )

      await sendMailgunEmail({
        apiKey: c.env?.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY,
        domain: c.env?.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || 'inboxed.fun',
        from: c.env?.SENDER_EMAIL || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>',
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.fallbackHtml,
        ampHtml: emailContent.ampHtml,
        headers: {
          'List-Unsubscribe': `<${prodOrigin}/unsubscribe?email=${encodeURIComponent(email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Feedback-ID': 'word-game-daily:mailgun',
          'X-Entity-Ref-ID': `puzzle-${emailContent.puzzle.id}-${emailContent.puzzle.date}`,
        },
      })

      return c.json({
        success: true,
        message: "Today's puzzle has been sent to your inbox!"
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to send today\'s puzzle.' }, 500)
    }
  })

  // Get Subscribers Endpoint
  app.get('/api/subscribers', async (c) => {
    try {
      const subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
      return c.json({
        total: subscribers.length,
        activeCount: subscribers.filter(s => s.status === 'active').length,
        subscribers
      })
    } catch (error: any) {
      return c.json({ error: 'Failed to fetch subscribers' }, 500)
    }
  })

  // Get subscription status
  app.get('/api/sub-status', async (c) => {
    try {
      const userEmail = await getUserEmail(c)
      const isSubscribed = await ensureSubscribedOnOpen(c.env?.GAME_STATE_KV, userEmail)
      const payload = { isSubscribed, userEmail }
      return c.json({ items: [payload], ...payload })
    } catch (error: any) {
      const fallback = { isSubscribed: true, userEmail: 'player@company.com' }
      return c.json({ items: [fallback], ...fallback })
    }
  })

  // Admin endpoint to reset a user's save state for a given day
  const handleResetUserDay = async (c: any) => {
    try {
      const authHeader = c.req.header('Authorization')
      const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
      if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
        return c.json({ success: false, error: 'Unauthorized' }, 401)
      }

      let email = c.req.query('email')
      let date = c.req.query('date')

      if (c.req.method === 'POST') {
        try {
          const body = await c.req.json().catch(() => ({}))
          if (body && typeof body === 'object') {
            email = body.email || email
            date = body.date || date
          }
        } catch (_) {
          try {
            const form = await c.req.parseBody().catch(() => ({}))
            if (form) {
              email = (form['email'] as string) || email
              date = (form['date'] as string) || date
            }
          } catch (_) {}
        }
      }

      if (!email || typeof email !== 'string' || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email parameter is required' }, 400)
      }

      if (!date) {
        date = getDailyPuzzle().date
      }

      const result = await resetUserDayState(c.env?.GAME_STATE_KV, email, date)
      return c.json(result)
    } catch (error: any) {
      console.error('Error resetting user day state:', error)
      return c.json({ success: false, error: error.message || 'Failed to reset user day state' }, 500)
    }
  }

  app.post('/api/admin/reset-user-day', handleResetUserDay)
  app.get('/api/admin/reset-user-day', handleResetUserDay)

  // Admin endpoint to manually trigger the daily cron email dispatch
  app.all('/api/admin/trigger-daily-cron', async (c) => {
    const authHeader = c.req.header('Authorization')
    const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
    if (adminSecret && authHeader !== `Bearer ${adminSecret}`) {
      return c.json({ success: false, error: 'Unauthorized' }, 401)
    }

    const dryRun = c.req.query('dryRun') === 'true'
    const emailParam = c.req.query('email') || c.req.query('to')
    const dateParam = c.req.query('date')
    const modeParam = c.req.query('mode') as 'subscribers' | 'test' | 'all' | undefined

    const targetEmails = emailParam ? emailParam.split(/[,;\s]+/).map((e: string) => e.trim()).filter(Boolean) : undefined
    const result = await sendDailyPuzzleEmails(c.env || {}, {
      targetEmails,
      dateStr: dateParam,
      isDryRun: dryRun,
      mode: modeParam,
    })

    return c.json({ success: true, ...result })
  })

  // User-facing & RFC 8058 One-Click Unsubscribe route
  async function handleUnsubscribe(c: any) {
    let email = c.req.query('email')
    if (!email && c.req.method === 'POST') {
      const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>
      email = (body['email'] as string) || (body['subscriberEmail'] as string)
    }

    if (email && email.includes('@')) {
      await removeSubscriber(c.env?.GAME_STATE_KV, email.toLowerCase().trim())
    }

    const acceptHeader = c.req.header('Accept') || ''
    if (acceptHeader.includes('application/json') || c.req.header('content-type')?.includes('application/json')) {
      return c.json({ success: true, message: email ? `Unsubscribed ${email}` : 'Unsubscribed' })
    }

    return c.html(getUnsubscribeHtml(email))
  }

  app.get('/unsubscribe', handleUnsubscribe)
  app.post('/unsubscribe', handleUnsubscribe)

  // Admin Unsubscribe Endpoint (supports purge)
  app.all('/api/admin/unsubscribe', async (c) => {
    try {
      let email = c.req.query('email')
      let purge = c.req.query('purge') === 'true' || c.req.query('delete') === 'true'

      if (!email && c.req.method === 'POST') {
        const contentType = c.req.header('Content-Type') || ''
        if (contentType.includes('application/json')) {
          const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
          email = body.email
          if (body.purge !== undefined) purge = Boolean(body.purge)
        } else {
          const body = (await c.req.parseBody().catch(() => ({}))) as Record<string, any>
          email = body['email'] as string
          if (body['purge'] !== undefined) purge = body['purge'] === 'true'
        }
      }

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      const result = await unsubscribeUser(c.env?.GAME_STATE_KV, email, purge)
      return c.json(result)
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to unsubscribe user' }, 500)
    }
  })
}
