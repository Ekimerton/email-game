import type { Hono } from 'hono'
import { LOGO_PNG_BASE64, verifyConfirmationToken, getAccountUrl, type Bindings } from '../core'
import { getDailyPuzzle } from '../game'
import { addSubscriber, getUserEmail, extractDomain, recordUserActivity, getCoworkerCount, getPlayerCount } from '../services'
import { renderAmpGame, type EmailTheme } from '../email'
import {
  getSignupHtml,
  getPrivacyPolicyHtml,
  getInvalidConfirmationHtml,
  getConfirmationPageHtml,
  getAccountPageHtml,
  getFallbackHtml
} from '../views'

export function registerPageRoutes(app: Hono<{ Bindings: Bindings }>) {
  // Serve Email Signup Landing Page at root or AMP game if email query is present
  app.get('/', async (c) => {
    const hasEmailParam = Boolean(c.req.query('email'))
    const isExplicitSignup = c.req.query('signup') === 'true' || c.req.query('subscribed') === 'true'

    if (!hasEmailParam || isExplicitSignup) {
      return c.html(getSignupHtml(c))
    }

    return renderAmpGame(c)
  })

  // Serve static brand logo for email fallbacks & web
  app.get('/logo.png', (c) => {
    const binary = Uint8Array.from(atob(LOGO_PNG_BASE64), (ch) => ch.charCodeAt(0))
    return new Response(binary, {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  })

  // Serve static demo gameplay video recordings
  const serveVideo = async (c: any, filename: string, mimeType: string) => {
    if (c.env?.ASSETS) {
      try {
        const assetRes = await c.env.ASSETS.fetch(c.req.raw)
        if (assetRes.status !== 404) return assetRes
      } catch (_) {}
    }
    try {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.resolve('public', filename)
      if (fs.existsSync(filePath)) {
        const buffer = fs.readFileSync(filePath)
        return new Response(buffer, {
          headers: {
            'Content-Type': mimeType,
            'Cache-Control': 'public, max-age=31536000',
          },
        })
      }
    } catch (_) {}
    return c.notFound()
  }

  app.get('/demo-4.mp4', (c) => serveVideo(c, 'demo-4.mp4', 'video/mp4'))
  app.get('/demo.mp4', (c) => serveVideo(c, 'demo.mp4', 'video/mp4'))
  app.get('/inbox-row.png', (c) => serveVideo(c, 'inbox-row.png', 'image/png'))
  app.get('/og-image.png', (c) => serveVideo(c, 'og-image.png', 'image/png'))
  app.get('/inboxed-social-share-light.png', (c) => serveVideo(c, 'inboxed-social-share-light.png', 'image/png'))
  app.get('/favicon-upright-512x512.png', (c) => serveVideo(c, 'favicon-upright-512x512.png', 'image/png'))
  app.get('/favicon.png', (c) => serveVideo(c, 'favicon.png', 'image/png'))

  // Serve static SVG favicon based on the 'I' tile from the logo (Upright tile)
  const FAVICON_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect x="6" y="6" width="88" height="88" rx="20" fill="#D8FFC5" stroke="#18181b" stroke-width="7"/><text x="50" y="69" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" font-size="62" font-weight="900" fill="#18181b" text-anchor="middle">I</text></svg>`

  app.get('/favicon.svg', (c) => {
    return new Response(FAVICON_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  })

  app.get('/favicon.ico', (c) => {
    return new Response(FAVICON_SVG, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=86400',
      },
    })
  })

  // Serve Brand Assets showcase page (Favicon & Social Share Preview)
  app.get('/brand-assets', async (c) => {
    if (c.env?.ASSETS) {
      try {
        const assetRes = await c.env.ASSETS.fetch(new Request(new URL('/brand-assets.html', c.req.url).toString(), c.req.raw))
        if (assetRes.status !== 404) return assetRes
      } catch (_) {}
    }
    try {
      const fs = await import('fs')
      const path = await import('path')
      const filePath = path.resolve('public', 'brand-assets.html')
      if (fs.existsSync(filePath)) {
        return c.html(fs.readFileSync(filePath, 'utf-8'))
      }
    } catch (_) {}
    return c.notFound()
  })

  // Explicit Email Signup Landing Page route
  app.get('/signup', async (c) => {
    return c.html(getSignupHtml(c))
  })

  // Privacy Policy page route
  app.get('/privacy', (c) => {
    return c.html(getPrivacyPolicyHtml())
  })

  // Double Opt-In Email Confirmation route
  app.get('/confirm', async (c) => {
    const token = c.req.query('token')
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyConfirmationToken(token, authSecret)

    if (!verified) {
      return c.html(getInvalidConfirmationHtml(), 400)
    }

    // Persist directly to KV now that the user has confirmed their subscription
    await addSubscriber(c.env?.GAME_STATE_KV, verified.email)

    return c.html(getConfirmationPageHtml(c, verified.email, token || ''))
  })

  // Explicit Game Play / Preview routes
  app.get('/play', renderAmpGame)
  app.get('/preview', renderAmpGame)

  // Serve Light React Single Page App (SPA) for Account Preferences
  app.get('/account', async (c) => {
    return c.html(getAccountPageHtml())
  })

  // Fallback view route
  app.get('/fallback', async (c) => {
    const userEmail = await getUserEmail(c)
    const dateParam = c.req.query('date')
    const themeParam = c.req.query('theme') as EmailTheme | undefined
    const puzzle = getDailyPuzzle(dateParam)
    const domain = extractDomain(userEmail)
    const profile = await recordUserActivity(c.env?.GAME_STATE_KV, userEmail, puzzle.date)
    const coworkerCount = await getCoworkerCount(c.env?.GAME_STATE_KV, domain, userEmail)
    const playerCount = await getPlayerCount(c.env?.GAME_STATE_KV)
    const theme: EmailTheme = themeParam || profile.theme || 'light'

    const reqUrl = new URL(c.req.url)
    const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
    const forceHttps = c.req.query('forceHttps') === 'true'
    const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')

    const publicUrl = (isLocalHost && !forceHttps)
      ? reqUrl.origin
      : prodOrigin

    const playUrl = `${publicUrl}/?email=${encodeURIComponent(userEmail)}`
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const accountUrl = getAccountUrl(userEmail, publicUrl, authSecret)

    const html = getFallbackHtml({
      email: userEmail,
      domain,
      daysPlayed: profile.daysPlayed || 1,
      coworkerCount,
      playerCount,
      playUrl,
      accountUrl,
      theme,
    })

    return c.html(html)
  })
}
