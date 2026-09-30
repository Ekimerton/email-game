import type { Hono } from 'hono'
import { generateConfirmationToken, generateAccountToken, kvPut, withKeyLock, type Bindings, type SubscriberEntry } from '../core'
import { buildPuzzleEmailContent, renderConfirmationEmailHtml } from '../email'
import { getUserEmail, getSubscribers, addSubscriber, unsubscribeUser, getDevTesters, addDevTester, removeDevTester, isDevTester, getDashboardStats, updateUserProfileSettings } from '../services'
import {
  getDevWorkbenchHtml,
  getDevSubscribersPageHtml,
  getDevDashboardPageHtml,
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
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
    const dateParam = c.req.query('date')
    const target = puzzleParam || dateParam
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env, userEmail, target, currentOrigin, authSecret)

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
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
    const dateParam = c.req.query('date')
    const target = puzzleParam || dateParam
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env, userEmail, target, currentOrigin, authSecret)
    return c.html(content.ampHtml)
  })

  // Development-only raw text output of page HTML
  app.get('/dev/raw', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const page = c.req.query('page') || 'game'
    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
    const dateParam = c.req.query('date')
    const target = puzzleParam || dateParam
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
      const content = await buildPuzzleEmailContent(c.env, userEmail, target, currentOrigin, authSecret)
      html = content.fallbackHtml
    } else if (page === 'confirm-email') {
      const token = generateConfirmationToken(userEmail, authSecret)
      const confirmUrl = `${currentOrigin}/confirm?token=${encodeURIComponent(token)}`
      html = renderConfirmationEmailHtml(confirmUrl)
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
          subscribers = await getSubscribers(c.env)
          dataSource = 'local'
          fetchError = err.message || 'offline'
        }
      } else {
        subscribers = await getSubscribers(c.env)
      }
      let devTesters: string[] = []
      if (dataSource === 'prod') {
        try {
          const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
          const headers: Record<string, string> = { 'Accept': 'application/json' }
          if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`
          const prodDevRes = await fetch(`${prodOrigin}/api/admin/dev-testers`, { headers })
          if (prodDevRes.ok) {
            const devData = (await prodDevRes.json().catch(() => ({}))) as any
            devTesters = Array.isArray(devData?.devTesters) ? devData.devTesters : []
          } else {
            devTesters = await getDevTesters(c.env)
          }
        } catch {
          devTesters = await getDevTesters(c.env)
        }
      } else {
        devTesters = await getDevTesters(c.env)
      }

      html = getDevSubscribersPageHtml({
        subscribers,
        source: dataSource,
        prodOrigin,
        fetchError,
        devTesters
      })
    } else if (page === 'dashboard') {
      const stats = await getDashboardStats(c.env, target)
      html = getDevDashboardPageHtml({ stats, source: 'local', prodOrigin })
    } else {
      const content = await buildPuzzleEmailContent(c.env, userEmail, target, currentOrigin, authSecret)
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
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')
    const dateParam = c.req.query('date')
    const target = puzzleParam || dateParam
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const content = await buildPuzzleEmailContent(c.env, userEmail, target, currentOrigin, authSecret)
    return c.html(content.fallbackHtml)
  })

  // Development-only direct render of confirmation email
  app.get('/dev/email/confirm', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const userEmail = (c.req.query('email') || await getUserEmail(c)).toLowerCase().trim()
    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

    const token = generateConfirmationToken(userEmail, authSecret)
    const confirmUrl = `${currentOrigin}/confirm?token=${encodeURIComponent(token)}`
    return c.html(renderConfirmationEmailHtml(confirmUrl))
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

  // Development-only Live Production Analytics Dashboard (with activeTab support)
  const handleDevDashboard = async (c: any, overrideTab?: 'gameplay' | 'subscribers' | 'settings') => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const sourceParam = c.req.query('source') || 'prod'
    const isLocalSource = sourceParam === 'local'
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id') || c.req.query('date')
    const activeTab = overrideTab || (
      c.req.query('tab') === 'subscribers' ? 'subscribers' :
      (c.req.query('tab') === 'settings' ? 'settings' : 'gameplay')
    )

    let stats: any = null
    let dataSource: 'prod' | 'local' = isLocalSource ? 'local' : 'prod'
    let fetchError = ''

    if (!isLocalSource) {
      try {
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (adminSecret) {
          headers['Authorization'] = `Bearer ${adminSecret}`
        }
        const queryStr = puzzleParam ? `?puzzle=${encodeURIComponent(puzzleParam)}` : ''
        const prodRes = await fetch(`${prodOrigin}/api/admin/dashboard-data${queryStr}`, { headers })
        if (prodRes.ok) {
          stats = await prodRes.json().catch(() => null)
          if (!stats || !stats.todayPuzzle) {
            throw new Error('Invalid dashboard payload from production')
          }
          dataSource = 'prod'
        } else {
          throw new Error(`Production API returned HTTP ${prodRes.status}`)
        }
      } catch (err: any) {
        dataSource = 'local'
        fetchError = `Could not reach ${prodOrigin} (${err.message || 'offline'}). Showing local dev database.`
        stats = await getDashboardStats(c.env, puzzleParam)
      }
    } else {
      stats = await getDashboardStats(c.env, puzzleParam)
    }

    return c.html(getDevDashboardPageHtml({
      stats,
      source: dataSource,
      prodOrigin,
      fetchError,
      activeTab,
    }))
  }

  app.get('/dev/dashboard', (c) => handleDevDashboard(c))
  app.get('/dev/page/dashboard', (c) => handleDevDashboard(c))
  app.get('/dev/page/subscribers', (c) => handleDevDashboard(c, 'subscribers'))
  app.get('/dev/page/settings', (c) => handleDevDashboard(c, 'settings'))

  // Dev API Proxy for asynchronous dashboard refreshes
  app.get('/dev/api/dashboard-data', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }

    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
    const sourceParam = c.req.query('source') || 'prod'
    const isLocalSource = sourceParam === 'local'
    const puzzleParam = c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id') || c.req.query('date')

    if (!isLocalSource) {
      try {
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Accept': 'application/json' }
        if (adminSecret) {
          headers['Authorization'] = `Bearer ${adminSecret}`
        }
        const queryStr = puzzleParam ? `?puzzle=${encodeURIComponent(puzzleParam)}` : ''
        const prodRes = await fetch(`${prodOrigin}/api/admin/dashboard-data${queryStr}`, { headers })
        if (prodRes.ok) {
          const data = await prodRes.json()
          return c.json(data)
        }
      } catch (err) {
        console.warn('[dev/api/dashboard-data] Proxy error, falling back to local:', err)
      }
    }

    const localStats = await getDashboardStats(c.env, puzzleParam)
    return c.json({ success: true, ...localStats })
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
        await unsubscribeUser(c.env, cleanEmail, purge)

        return c.json({
          success: true,
          target: 'prod',
          message: `Successfully ${purge ? 'purged' : 'unsubscribed'} ${cleanEmail} from production!`,
          result: prodData
        })
      } else {
        // Remove from local KV
        const result = await unsubscribeUser(c.env, cleanEmail, purge)
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

        await addSubscriber(c.env, email)

        return c.json({
          success: true,
          target: 'prod',
          message: `Added ${email} to production subscribers!`
        })
      } else {
        const subscribers = await addSubscriber(c.env, email)
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
        return await withKeyLock('subscribers:list', async () => {
          const subscribers = await getSubscribers(c.env)
          const idx = subscribers.findIndex(s => s.email === email)
          if (idx < 0) {
            return c.json({ success: false, error: 'Subscriber not found.' }, 404)
          }
          const newStatus = subscribers[idx].status === 'active' ? 'unsubscribed' : 'active'
          subscribers[idx].status = newStatus
          await kvPut(c.env, 'subscribers:list', subscribers)
          return c.json({
            success: true,
            target: 'local',
            email,
            status: newStatus,
            message: `Set ${email} status to ${newStatus}.`,
            total: subscribers.length,
            activeCount: subscribers.filter(s => s.status === 'active').length,
          })
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
        await addSubscriber(c.env, email)
      }
      const subscribers = await getSubscribers(c.env)
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

  // Development-only API to get all dev testers
  app.get('/dev/api/dev-testers', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    const target = c.req.query('target') || 'local'
    if (target === 'prod') {
      const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
      const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
      const headers: Record<string, string> = { 'Accept': 'application/json' }
      if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`
      try {
        const prodRes = await fetch(`${prodOrigin}/api/admin/dev-testers`, { headers })
        if (prodRes.ok) {
          const data = (await prodRes.json().catch(() => ({}))) as any
          return c.json({ success: true, target: 'prod', devTesters: data.devTesters || [] })
        }
      } catch (err: any) {
        return c.json({ success: false, error: err.message || 'Failed to fetch dev testers from prod' }, 500)
      }
    }
    const devTesters = await getDevTesters(c.env)
    return c.json({ success: true, target: 'local', devTesters })
  })

  // Development-only API to add an email to the dev prescreen list
  app.post('/dev/api/dev-testers/add', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || c.req.query('email') || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      let devTesters: string[] = []
      let message = `Added ${email} to Dev Prescreen list (41 days ahead)!`

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

        const prodRes = await fetch(`${prodOrigin}/api/admin/dev-testers/add`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email })
        })

        if (!prodRes.ok) {
          const errData = (await prodRes.json().catch(() => ({}))) as any
          throw new Error(errData.error || `Production returned HTTP ${prodRes.status}`)
        }

        const data = (await prodRes.json().catch(() => ({}))) as any
        devTesters = Array.isArray(data?.devTesters) ? data.devTesters : []
        message = data.message || `Added ${email} to Production Dev Prescreen list!`

        // Also update local KV for consistency
        await addDevTester(c.env, email)
      } else {
        devTesters = await addDevTester(c.env, email)
      }

      return c.json({
        success: true,
        target,
        message,
        devTesters
      })
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to add dev tester' }, 500)
    }
  })

  // Development-only API to remove an email from the dev prescreen list
  app.post('/dev/api/dev-testers/remove', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || c.req.query('email') || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      let devTesters: string[] = []
      let message = `Removed ${email} from Dev Prescreen list.`

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

        const prodRes = await fetch(`${prodOrigin}/api/admin/dev-testers/remove`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email })
        })

        if (!prodRes.ok) {
          const errData = (await prodRes.json().catch(() => ({}))) as any
          throw new Error(errData.error || `Production returned HTTP ${prodRes.status}`)
        }

        const data = (await prodRes.json().catch(() => ({}))) as any
        devTesters = Array.isArray(data?.devTesters) ? data.devTesters : []
        message = data.message || `Removed ${email} from Production Dev Prescreen list.`

        // Also update local KV for consistency
        await removeDevTester(c.env, email)
      } else {
        devTesters = await removeDevTester(c.env, email)
      }

      return c.json({
        success: true,
        target,
        message,
        devTesters
      })
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to remove dev tester' }, 500)
    }
  })

  // Development-only API to toggle dev prescreen status for any subscriber
  app.post('/dev/api/dev-testers/toggle', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || c.req.query('email') || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email) {
        return c.json({ success: false, error: 'Email is required.' }, 400)
      }

      let devTesters: string[] = []
      let isDev = false
      let message = ''

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

        const prodRes = await fetch(`${prodOrigin}/api/admin/dev-testers/toggle`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email })
        })

        if (!prodRes.ok) {
          const errData = (await prodRes.json().catch(() => ({}))) as any
          throw new Error(errData.error || `Production returned HTTP ${prodRes.status}`)
        }

        const data = (await prodRes.json().catch(() => ({}))) as any
        devTesters = Array.isArray(data?.devTesters) ? data.devTesters : []
        isDev = Boolean(data.isDev)
        message = data.message || (isDev ? `Added ${email} to Production Dev Prescreen list!` : `Removed ${email} from Production Dev Prescreen list.`)

        // Mirror locally
        if (isDev) {
          await addDevTester(c.env, email)
        } else {
          await removeDevTester(c.env, email)
        }
      } else {
        const currentlyDev = await isDevTester(c.env, email)
        if (currentlyDev) {
          devTesters = await removeDevTester(c.env, email)
        } else {
          devTesters = await addDevTester(c.env, email)
        }
        isDev = !currentlyDev
        message = isDev
          ? `🧪 Added ${email} to Dev Prescreen list (Puzzle #42 today, #43 tomorrow)!`
          : `Removed ${email} from Dev Prescreen list (Standard Puzzle #1 schedule).`
      }

      return c.json({
        success: true,
        target,
        isDev,
        message,
        devTesters
      })
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to toggle dev tester status' }, 500)
    }
  })

  // Development-only API to update user profile settings (privacy, theme, sub status, dev track)
  app.post('/dev/api/user-settings/update', async (c) => {
    if (!isDevelopment(c)) {
      return c.text('Not Found', 404)
    }
    try {
      const body = (await c.req.json().catch(() => ({}))) as Record<string, any>
      const email = (body.email as string || c.req.query('email') || '').toLowerCase().trim()
      const target = (body.target as string) || c.req.query('target') || 'local'

      if (!email || !email.includes('@')) {
        return c.json({ success: false, error: 'A valid email address is required.' }, 400)
      }

      const updates: {
        showOnLeaderboard?: boolean
        theme?: 'light' | 'dark'
        status?: 'active' | 'unsubscribed'
        isDev?: boolean
      } = {}

      if (body.showOnLeaderboard !== undefined) updates.showOnLeaderboard = Boolean(body.showOnLeaderboard)
      if (body.theme !== undefined) updates.theme = body.theme === 'dark' ? 'dark' : 'light'
      if (body.status !== undefined) updates.status = body.status === 'unsubscribed' ? 'unsubscribed' : 'active'
      if (body.isDev !== undefined) updates.isDev = Boolean(body.isDev)

      if (target === 'prod') {
        const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
        const adminSecret = c.env?.ADMIN_SECRET || process.env.ADMIN_SECRET
        const headers: Record<string, string> = { 'Content-Type': 'application/json', 'Accept': 'application/json' }
        if (adminSecret) headers['Authorization'] = `Bearer ${adminSecret}`

        const prodRes = await fetch(`${prodOrigin}/api/admin/user-settings`, {
          method: 'POST',
          headers,
          body: JSON.stringify({ email, ...updates })
        })

        if (!prodRes.ok) {
          const errData = (await prodRes.json().catch(() => ({}))) as any
          throw new Error(errData.error || `Production returned HTTP ${prodRes.status}`)
        }

        const prodData = (await prodRes.json().catch(() => ({}))) as any

        // Mirror locally for consistency
        await updateUserProfileSettings(c.env, email, updates)

        return c.json({
          success: true,
          target: 'prod',
          message: prodData.message || `Updated settings for ${email} on production!`,
          profile: prodData.profile
        })
      } else {
        const result = await updateUserProfileSettings(c.env, email, updates)
        if (!result.success) {
          return c.json({ success: false, error: result.error || 'Failed to update settings' }, 400)
        }
        return c.json({
          success: true,
          target: 'local',
          message: `Updated settings for ${email} in local database!`,
          profile: result.profile
        })
      }
    } catch (err: any) {
      return c.json({ success: false, error: err.message || 'Failed to update user settings' }, 500)
    }
  })
}
