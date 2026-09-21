import type { Hono } from 'hono'
import { generateConfirmationToken, generateAccountToken, kvPut, type Bindings, type SubscriberEntry } from '../core'
import { buildPuzzleEmailContent } from '../email'
import { getUserEmail, getSubscribers, addSubscriber, unsubscribeUser } from '../services'
import {
  getDevWorkbenchHtml,
  getDevSubscribersPageHtml,
  getSignupHtml,
  getConfirmationPageHtml,
  getInvalidConfirmationHtml,
  getPrivacyPolicyHtml,
  getAccountPageHtml,
} from '../views'

export function isDevelopment(c: any): boolean {
  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1' || reqUrl.hostname.endsWith('.localhost')
  const isDevEnv = c.env?.ENVIRONMENT === 'development' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
  return isLocalHost || isDevEnv
}

export function registerDevRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Development-only interactive workbench to inspect rendered game and HTML
  app.get('/dev', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const dateParam = c.req.query('date')
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)

    return c.html(getDevWorkbenchHtml({
      ampHtml: content.ampHtml,
      fallbackHtml: content.fallbackHtml,
      subject: content.subject,
      puzzle: content.puzzle,
      userEmail,
      currentOrigin,
    }))
  })

  // Development-only alias
  app.get('/dev/preview', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    const queryString = c.req.url.includes('?') ? c.req.url.slice(c.req.url.indexOf('?')) : ''
    return c.redirect('/dev' + queryString)
  })

  // Development-only direct render of the game HTML in browser
  app.get('/dev/render', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const dateParam = c.req.query('date')
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)
    return c.html(content.ampHtml)
  })

  // Development-only raw text output of page HTML
  app.get('/dev/raw', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const page = c.req.query('page') || 'game'
    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const dateParam = c.req.query('date')
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    let html = ''

    if (page === 'confirmed') {
      const token = generateConfirmationToken(userEmail, authSecret)
      html = getConfirmationPageHtml(c, userEmail, token)
    } else if (page === 'signup') {
      html = getSignupHtml(c)
    } else if (page === 'account') {
      html = getAccountPageHtml()
    } else if (page === 'fallback') {
      const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)
      html = content.fallbackHtml
    } else if (page === 'invalid') {
      html = getInvalidConfirmationHtml()
    } else if (page === 'privacy') {
      html = getPrivacyPolicyHtml()
    } else if (page === 'subscribers') {
      const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
      const sourceParam = c.req.query('source') || 'prod'
      let subscribers: SubscriberEntry[] = []
      let dataSource: 'prod' | 'local' = sourceParam === 'local' ? 'local' : 'prod'
      let fetchError = ''
      if (sourceParam !== 'local') {
        try {
          const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`
          const prodRes = await fetch(`${prodOrigin}/api/subscribers`, { headers })
          if (prodRes.ok) {
            const data = (await prodRes.json().catch(() => ({}))) as any
            subscribers = Array.isArray(data?.subscribers) ? data.subscribers : (Array.isArray(data) ? data : [])
          } else {
            throw new Error(`HTTP ${prodRes.status}`)
          }
        } catch (err: any) {
          subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
          dataSource = 'local'
          fetchError = err.message || 'offline'
        }
      } else {
        subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
      }
      html = getDevSubscribersPageHtml({
        subscribers,
        source: dataSource,
        prodOrigin,
        fetchError
      })
    } else {
      const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)
      html = content.ampHtml
    }

    return new Response(html, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  })

  // Development-only direct render of fallback email
  app.get('/dev/fallback', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const dateParam = c.req.query('date')
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)
    return c.html(content.fallbackHtml)
  })

  // Development-only direct render of sub-pages
  app.get('/dev/page/signup', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    return c.html(getSignupHtml(c))
  })

  app.get('/dev/page/confirmed', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const token = generateConfirmationToken(userEmail, authSecret)
    return c.html(getConfirmationPageHtml(c, userEmail, token))
  })

  app.get('/dev/page/invalid', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    return c.html(getInvalidConfirmationHtml())
  })

  app.get('/dev/page/privacy', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    return c.html(getPrivacyPolicyHtml())
  })

  app.get('/dev/page/account', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const token = generateAccountToken(userEmail, authSecret)
    return c.redirect(`/account?token=${encodeURIComponent(token)}`)
  })

  // Development-only direct render of subscribers directory (fetches from production by default)
  app.get('/dev/page/subscribers', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const sourceParam = c.req.query('source') || 'prod'
    const isLocalSource = sourceParam === 'local'

    let subscribers: SubscriberEntry[] = []
    let dataSource: 'prod' | 'local' = isLocalSource ? 'local' : 'prod'
    let fetchError = ''

    if (!isLocalSource) {
      try {
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = {
          'Accept': 'application/json'
        }
        if (adminSecret) {
          headers['Authorization'] = `Bearer ${adminSecret}`
        }
        const prodRes = await fetch(`${prodOrigin}/api/subscribers`, { headers })
        if (prodRes.ok) {
          const data = (await prodRes.json().catch(() => ({}))) as any
          subscribers = Array.isArray(data?.subscribers)
            ? data.subscribers
            : (Array.isArray(data) ? data : [])
          dataSource = 'prod'
        } else {
          throw new Error(`HTTP ${prodRes.status}`)
        }
      } catch (err: any) {
        subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
        dataSource = 'local'
        fetchError = `Could not reach ${prodOrigin} (${err.message || 'offline'}). Showing local KV.`
      }
    } else {
      subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
    }

    return c.html(getDevSubscribersPageHtml({
      subscribers,
      source: dataSource,
      prodOrigin,
      fetchError
    }))
  })

  // Development-only API to remove/purge a subscriber from either prod or local KV
  app.all('/dev/api/subscribers/remove', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      let email = c.req.query('email')
      let target = c.req.query('target') || 'local'
      let purge = c.req.query('purge') !== 'false'

      if (c.req.method === 'POST') {
        const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
        email = body.email || email
        target = body.target || target
        if (body.purge !== undefined) purge = Boolean(body.purge)
      }

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      const cleanEmail = email.toLowerCase().trim()

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
        if (adminSecret) {
          headers['Authorization'] = `Bearer ${adminSecret}`
        }

        const prodRes = await fetch(`${prodOrigin}/api/admin/unsubscribe?email=${encodeURIComponent(cleanEmail)}&purge=${purge}`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email: cleanEmail, purge })
        })

        const prodData = (await prodRes.json().catch(() => ({}))) as any
        if (!prodRes.ok) {
          throw new Error(prodData.error || `Production returned HTTP ${prodRes.status}`)
        }

        // Also remove from local KV in case local store was in sync
        await unsubscribeUser(c.env?.GAME_STATE_KV, cleanEmail, purge)

        return c.json({
          success: true,
          target: 'prod',
          message: `Successfully ${purge ? 'purged' : 'unsubscribed'} ${cleanEmail} from production!`,
          result: prodData
        })
      } else {
        // Remove from local KV
        const result = await unsubscribeUser(c.env?.GAME_STATE_KV, cleanEmail, purge)
        return c.json({
          success: true,
          target: 'local',
          message: `Successfully ${purge ? 'purged' : 'unsubscribed'} ${cleanEmail} from local KV!`,
          result
        })
      }
    } catch (err: any) {
      console.error('[dev/api/subscribers/remove] Error:', err)
      return c.json({ success: false, error: err.message || 'Failed to remove subscriber' }, 500)
    }
  })

  // Development-only API to quickly add a subscriber
  app.post('/dev/api/subscribers/add', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
        const userToken = generateAccountToken(email, authSecret)

        const prodRes = await fetch(`${prodOrigin}/api/account/toggle-subscription`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: userToken, subscribed: true })
        })

        if (!prodRes.ok) {
          const errorData = (await prodRes.json().catch(() => ({}))) as any
          throw new Error(errorData.message || errorData.error || `Production returned HTTP ${prodRes.status}`)
        }

        await addSubscriber(c.env?.GAME_STATE_KV, email)

        return c.json({
          success: true,
          target: 'prod',
          message: `Added ${email} to production subscribers!`
        })
      } else {
        const subscribers = await addSubscriber(c.env?.GAME_STATE_KV, email)
        return c.json({
          success: true,
          target: 'local',
          message: `Added ${email} to subscribers!`,
          total: subscribers.length,
          activeCount: subscribers.filter(s => s.status === 'active').length,
          subscribers
        })
      }
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to add subscriber' }, 500)
    }
  })

  // Development-only API to toggle a subscriber's active/unsubscribed status
  app.post('/dev/api/subscribers/toggle', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email) {
        return c.json({ success: false, error: 'Email is required.' }, 400)
      }

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

        let isCurrentlyActive = true
        try {
          const prodRes = await fetch(`${prodOrigin}/api/subscribers`, { headers })
          if (prodRes.ok) {
            const listData = (await prodRes.json().catch(() => ({}))) as any
            const subList = Array.isArray(listData?.subscribers) ? listData.subscribers : []
            const found = subList.find((s: any) => s.email.toLowerCase() === email)
            if (found) {
              isCurrentlyActive = found.status === 'active'
            }
          }
        } catch (_) {}

        const nextStatus = isCurrentlyActive ? 'unsubscribed' : 'active'

        if (nextStatus === 'unsubscribed') {
          const unsubHeaders: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
          if (adminSecret) unsubHeaders['Authorization'] = `Bearer ${adminSecret}`
          const unsubRes = await fetch(`${prodOrigin}/api/admin/unsubscribe?email=${encodeURIComponent(email)}&purge=false`, {
            method: 'POST',
            headers: unsubHeaders,
            body: JSON.stringify({ email, purge: false })
          })
          if (!unsubRes.ok) {
            const errorData = (await unsubRes.json().catch(() => ({}))) as any
            throw new Error(errorData.error || `Production returned HTTP ${unsubRes.status}`)
          }
        } else {
          const userToken = generateAccountToken(email, authSecret)
          const toggleRes = await fetch(`${prodOrigin}/api/account/toggle-subscription`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: userToken, subscribed: true })
          })
          if (!toggleRes.ok) {
            const errorData = (await toggleRes.json().catch(() => ({}))) as any
            throw new Error(errorData.message || errorData.error || `Production returned HTTP ${toggleRes.status}`)
          }
        }

        return c.json({
          success: true,
          target: 'prod',
          email,
          status: nextStatus,
          message: `Updated ${email} status to ${nextStatus} on production!`
        })
      } else {
        const subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
        const idx = subscribers.findIndex(s => s.email === email)
        if (idx < 0) {
          return c.json({ success: false, error: 'Subscriber not found.' }, 404)
        }
        const newStatus = subscribers[idx].status === 'active' ? 'unsubscribed' : 'active'
        subscribers[idx].status = newStatus
        await kvPut(c.env?.GAME_STATE_KV, 'subscribers:list', subscribers)
        return c.json({
          success: true,
          target: 'local',
          email,
          status: newStatus,
          message: `Set ${email} status to ${newStatus}.`,
          total: subscribers.length,
          activeCount: subscribers.filter(s => s.status === 'active').length,
        })
      }
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to toggle subscriber status' }, 500)
    }
  })

  // Development-only API to seed demo subscribers for rapid testing
  app.post('/dev/api/subscribers/seed', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const demoEmails = [
        'alex@stripe.com',
        'sarah@figma.com',
        'taylor@vercel.com',
        'sam@linear.app',
        'player@company.com'
      ]
      for (const email of demoEmails) {
        await addSubscriber(c.env?.GAME_STATE_KV, email)
      }
      const subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
      return c.json({
        success: true,
        message: `Seeded ${demoEmails.length} demo subscribers!`,
        total: subscribers.length,
        activeCount: subscribers.filter(s => s.status === 'active').length,
        subscribers
      })
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to seed demo subscribers' }, 500)
    }
  })
}
