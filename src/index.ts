import { Hono } from 'hono'
import { OAuth2Client } from 'google-auth-library'
import { DailyPuzzle } from './puzzles'
import { getDailyPuzzle, formatPrettyDate } from './puzzleLogic'
import {
  generateAccountToken,
  verifyAccountToken,
  getAccountUrl,
  extractEmailDomain,
  generateConfirmationToken,
  verifyConfirmationToken
} from './auth'
import { GAME_MESSAGES } from './gameMessages'
import { sendMailgunEmail, renderConfirmationEmailHtml, renderConfirmationEmailText } from './emailService'
import { LOGO_PNG_BASE64 } from './logoData'
import { EmailTheme } from './emailThemes'
import type {
  LetterStatus,
  GuessResult,
  LeaderboardEntry,
  SubscriberEntry,
  UserSettings,
  GameState,
  Bindings,
  DailyEmailDispatchResult
} from './types'
import {
  extractDomain,
  formatDisplayEmail,
  kvGet,
  kvPut,
  kvDelete,
  getUserSettings,
  updateUserSettings,
  recordUserActivity,
  getDomainLeaderboard,
  updateDomainLeaderboard,
  getSubscribers,
  addSubscriber,
  removeSubscriber,
  unsubscribeUser,
  ensureSubscribedOnOpen,
  getCoworkerCount,
  getPlayerCount,
  getOrCreateGameState,
  resetUserDayState
} from './storage'
import {
  evaluateGuess,
  createInitialMask,
  isPuzzleSynonym,
  calculateScore,
  getRedactedText,
  buildStatePayload
} from './gameLogic'
import {
  calculateStateListHeight,
  buildPuzzleEmailContent,
  sendDailyPuzzleEmails
} from './emailBuilder'
import { escapeHtml } from './templates/htmlUtils'
import { getFallbackHtml } from './templates/fallbackHtml'
import { getSignupHtml } from './templates/signupHtml'
import { getConfirmationPageHtml, getInvalidConfirmationHtml } from './templates/confirmationHtml'
import { getPrivacyPolicyHtml } from './templates/privacyHtml'
import { getDevWorkbenchHtml } from './templates/workbenchHtml'
import { getAccountPageHtml } from './templates/accountHtml'

// Re-export public APIs for backward compatibility with tests & scripts
export type {
  LetterStatus,
  GuessResult,
  LeaderboardEntry,
  SubscriberEntry,
  UserSettings,
  GameState,
  Bindings,
  DailyEmailDispatchResult
}
export {
  getFallbackHtml,
  calculateScore,
  isPuzzleSynonym,
  resetUserDayState,
  unsubscribeUser,
  removeSubscriber,
  kvDelete,
  buildPuzzleEmailContent,
  sendDailyPuzzleEmails,
  getConfirmationPageHtml,
  getInvalidConfirmationHtml,
  getPrivacyPolicyHtml,
  getDevWorkbenchHtml,
  getAccountPageHtml,
  getSignupHtml
}

export const app = new Hono<{ Bindings: Bindings }>()
const client = new OAuth2Client()

// User identification helper (supports AMP Google Auth ID Token OR dev query/body/header)
async function getUserEmail(c: any, parsedBody?: Record<string, any>): Promise<string> {
  let emailParam = c.req.query('email') || c.req.header('x-user-email') || parsedBody?.['email']

  if (!emailParam) {
    const ampSourceOrigin = c.req.query('__amp_source_origin')
    if (ampSourceOrigin && ampSourceOrigin.includes('@') && !ampSourceOrigin.includes('amp@gmail.dev')) {
      emailParam = ampSourceOrigin
    }
  }

  if (!emailParam) {
    try {
      const body = await c.req.parseBody()
      emailParam = body['email'] as string
    } catch (_) { }
  }

  if (emailParam && typeof emailParam === 'string' && emailParam.includes('@')) {
    return emailParam.toLowerCase().trim()
  }

  const authHeader = c.req.header('Authorization')
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const token = authHeader.split(' ')[1]
      const ticket = await client.verifyIdToken({
        idToken: token,
      })
      const payload = ticket.getPayload()
      if (payload?.email) {
        return payload.email.toLowerCase().trim()
      }
    } catch (error) {
      console.warn('Token verification failed, falling back to default dev user:', error)
    }
  }

  return 'player@company.com'
}

// Serve AMP HTML preview page helper
async function renderAmpGame(c: any) {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const themeParam = c.req.query('theme') as EmailTheme | undefined
  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
  const forceHttps = c.req.query('forceHttps') === 'true'
  const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
  const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

  const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret, themeParam)
  return c.html(content.ampHtml)
}

// Serve Email Signup Landing Page at root
app.get('/', async (c) => {
  const hasEmailParam = Boolean(c.req.query('email'))
  const isExplicitSignup = c.req.query('signup') === 'true' || c.req.query('subscribed') === 'true'

  // If visiting root index without email query, or explicitly asking for signup: serve signup landing page
  if (!hasEmailParam || isExplicitSignup) {
    return c.html(getSignupHtml(c))
  }

  // If email parameter is provided (e.g. daily email fallback link or tests), render game
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

// Development-only environment check
export function isDevelopment(c: any): boolean {
  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1' || reqUrl.hostname.endsWith('.localhost')
  const isDevEnv = c.env?.ENVIRONMENT === 'development' || (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development')
  return isLocalHost || isDevEnv
}

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
  } else {
    // default: 'game'
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

// Serve non-AMP Fallback HTML with personalized engagement stats & CTA
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

// Secure REST API for React SPA Account Preferences
app.get('/api/account', async (c) => {
  const token = c.req.query('token') || c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
  const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
  const verified = verifyAccountToken(token, authSecret)

  if (!verified) {
    return c.json({ success: false, message: 'Invalid or missing authentication token.' }, 401)
  }

  const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
  const subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
  const isSubscribed = subscribers.some(s => s.email.toLowerCase() === verified.email.toLowerCase() && s.status === 'active')
  const theme = userProfile.theme || 'light'

  return c.json({
    success: true,
    email: userProfile.email,
    domain: userProfile.domain,
    token,
    isSubscribed,
    showOnLeaderboard: userProfile.showOnLeaderboard,
    theme,
    darkMode: theme === 'dark'
  })
})

// React API Endpoint: Toggle Subscription (AJAX)
app.post('/api/account/toggle-subscription', async (c) => {
  try {
    const body = await c.req.json()
    const token = body?.token
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyAccountToken(token, authSecret)

    if (!verified) {
      return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
    }

    const targetSubscribed = Boolean(body.subscribed)
    if (targetSubscribed) {
      await addSubscriber(c.env?.GAME_STATE_KV, verified.email)
    } else {
      await removeSubscriber(c.env?.GAME_STATE_KV, verified.email)
    }

    return c.json({
      success: true,
      isSubscribed: targetSubscribed,
      message: targetSubscribed ? '🎉 Subscribed to daily 9:00 AM PST emails!' : 'Unsubscribed from daily emails.'
    })
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to update subscription.' }, 500)
  }
})

// React API Endpoint: Toggle Leaderboard Privacy (AJAX)
app.post('/api/account/toggle-privacy', async (c) => {
  try {
    const body = await c.req.json()
    const token = body?.token
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyAccountToken(token, authSecret)

    if (!verified) {
      return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
    }

    const targetShow = Boolean(body.showOnLeaderboard)
    const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
    userProfile.showOnLeaderboard = targetShow
    await updateUserSettings(c.env?.GAME_STATE_KV, userProfile)

    return c.json({
      success: true,
      showOnLeaderboard: targetShow,
      message: targetShow ? '🏆 Visibility enabled on domain leaderboard.' : 'Hidden from domain leaderboard.'
    })
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to update privacy preference.' }, 500)
  }
})

// React API Endpoint: Toggle Dark Mode Theme (AJAX)
app.post('/api/account/toggle-theme', async (c) => {
  try {
    const body = await c.req.json()
    const token = body?.token
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyAccountToken(token, authSecret)

    if (!verified) {
      return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
    }

    const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
    let nextTheme: EmailTheme = 'light'

    if (body.theme === 'dark' || body.theme === 'light') {
      nextTheme = body.theme
    } else if (typeof body.darkMode === 'boolean') {
      nextTheme = body.darkMode ? 'dark' : 'light'
    } else {
      nextTheme = userProfile.theme === 'dark' ? 'light' : 'dark'
    }

    userProfile.theme = nextTheme
    await updateUserSettings(c.env?.GAME_STATE_KV, userProfile)

    return c.json({
      success: true,
      theme: nextTheme,
      darkMode: nextTheme === 'dark',
      message: nextTheme === 'dark'
        ? '🌙 Dark mode enabled for your daily emails!'
        : '☀️ Light mode enabled for your daily emails!'
    })
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to update theme preference.' }, 500)
  }
})

// Serve Light React Single Page App (SPA) for Account Preferences
app.get('/account', async (c) => {
  return c.html(getAccountPageHtml())
})

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

  const targetEmails = emailParam ? emailParam.split(/[,;\s]+/).map(e => e.trim()).filter(Boolean) : undefined
  const result = await sendDailyPuzzleEmails(c.env || {}, {
    targetEmails,
    dateStr: dateParam,
    isDryRun: dryRun
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

  return c.html(`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Unsubscribed - Inboxed</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; margin: 0; background: #fafafa; }
    .card { background: white; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px 24px; text-align: center; max-width: 420px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); }
    h1 { font-size: 20px; color: #18181b; margin-bottom: 8px; }
    p { font-size: 14px; color: #71717a; line-height: 1.5; margin-bottom: 20px; }
    a { display: inline-block; background: #14532d; color: white; padding: 10px 20px; border-radius: 8px; font-weight: 600; text-decoration: none; font-size: 14px; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Unsubscribed</h1>
    <p>${email ? `<strong>${escapeHtml(email)}</strong> has been unsubscribed from daily Inboxed puzzles.` : 'You have been unsubscribed from daily Inboxed puzzles.'}</p>
    <a href="/">Back to Inboxed</a>
  </div>
</body>
</html>`)
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

// Get game state
app.get('/api/state', async (c) => {
  try {
    const userEmail = await getUserEmail(c)
    const dateParam = c.req.query('date')
    const { state, puzzle } = await getOrCreateGameState(c.env?.GAME_STATE_KV, userEmail, dateParam)

    return c.json(buildStatePayload(state, puzzle))
  } catch (error: any) {
    console.error('Error fetching game state:', error)
    return c.json({ error: 'Failed to fetch game state' }, 500)
  }
})

// Submit guess
app.post('/api/guess', async (c) => {
  try {
    const body = await c.req.parseBody()
    const userEmail = await getUserEmail(c, body)
    const guess = (body['user-guess'] as string || '').toUpperCase().trim()
    const dateParam = c.req.query('date')
    const domain = extractDomain(userEmail)

    const { state, puzzle, stateKey } = await getOrCreateGameState(
      c.env?.GAME_STATE_KV,
      userEmail,
      dateParam
    )

    if (state.hasWon) {
      return c.json(buildStatePayload(state, puzzle))
    }

    const isSynonym = isPuzzleSynonym(puzzle, guess)

    if (!guess || (guess.length !== puzzle.word.length && !isSynonym)) {
      state.lastMessage = GAME_MESSAGES.invalidLength(puzzle.word.length)
      await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
      return c.json(buildStatePayload(state, puzzle, state.lastMessage))
    }

    const alreadyGuessed = (state.guessedWords || []).some(
      (w) => w.toUpperCase() === guess
    ) || (state.guessesHistory || []).some(
      (g) => g.guess.toUpperCase() === guess
    )

    if (alreadyGuessed) {
      state.lastMessage = GAME_MESSAGES.alreadyGuessed(guess)
      await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
      return c.json(buildStatePayload(state, puzzle, state.lastMessage))
    }

    const statuses = evaluateGuess(puzzle.word, guess)
    const isCorrect = guess === puzzle.word.toUpperCase()

    const newMask = [...state.letterMask]
    for (let i = 0; i < puzzle.word.length; i++) {
      if (statuses[i] === 'correct') {
        newMask[i] = puzzle.word[i]
      }
    }

    state.guessCount += 1
    if (isSynonym) {
      state.synonymGuessesCount = (state.synonymGuessesCount || 0) + 1
    }
    state.guessesHistory.push({ guess, statuses })
    if (!state.guessedWords) {
      state.guessedWords = []
    }
    state.guessedWords.push(guess)
    state.letterMask = newMask

    if (isCorrect) {
      state.hasWon = true
      state.revealedCount = puzzle.definitions.length
      state.score = calculateScore(
        state.guessCount,
        state.hintsUsed,
        state.synonymGuessesCount || 0,
        true
      )
      state.letterMask = puzzle.word.split('')
      state.lastMessage = GAME_MESSAGES.puzzleSolved(puzzle.word, state.guessCount, state.score)

      const leaderboardEntry: LeaderboardEntry = {
        email: userEmail,
        displayEmail: formatDisplayEmail(userEmail),
        score: state.score,
        guessCount: state.guessCount,
        hintsUsed: state.hintsUsed,
        wonAt: new Date().toISOString(),
      }

      const updatedLeaderboard = await updateDomainLeaderboard(
        c.env?.GAME_STATE_KV,
        domain,
        puzzle.date,
        leaderboardEntry
      )

      const rank = updatedLeaderboard.findIndex((e) => e.email === userEmail) + 1

      state.shareText = `Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)})\nSolved in ${state.guessCount} guess${state.guessCount > 1 ? 'es' : ''
        }!\nScore: ${state.score} pts | Org Rank: #${rank} (${domain})\n\nPlay at: https://inboxed.fun`
    } else {
      if (state.revealedCount < puzzle.definitions.length) {
        state.revealedCount += 1
      }
      state.score = calculateScore(
        state.guessCount,
        state.hintsUsed,
        state.synonymGuessesCount || 0,
        false
      )
      if (isSynonym) {
        state.lastMessage = GAME_MESSAGES.synonymGuess(guess)
      } else {
        state.lastMessage = GAME_MESSAGES.incorrectGuess(guess)
      }
    }

    await kvPut(c.env?.GAME_STATE_KV, stateKey, state)

    return c.json(buildStatePayload(state, puzzle))
  } catch (error: any) {
    console.error('Error submitting guess:', error)
    return c.json({ error: 'Failed to process guess' }, 500)
  }
})

// Request Letter Hint
app.post('/api/hint', async (c) => {
  try {
    const body = await c.req.parseBody()
    const userEmail = await getUserEmail(c, body)
    const dateParam = c.req.query('date')

    const { state, puzzle, stateKey } = await getOrCreateGameState(
      c.env?.GAME_STATE_KV,
      userEmail,
      dateParam
    )

    if (state.hasWon) {
      return c.json(buildStatePayload(state, puzzle))
    }

    const unrevealedIndices: number[] = []
    for (let i = 0; i < puzzle.word.length; i++) {
      if (state.letterMask[i] === '_') {
        unrevealedIndices.push(i)
      }
    }

    if (unrevealedIndices.length === 0) {
      state.lastMessage = GAME_MESSAGES.allLettersRevealed
      return c.json(buildStatePayload(state, puzzle))
    }

    const targetIdx = unrevealedIndices[0]
    const updatedMask = [...state.letterMask]
    updatedMask[targetIdx] = puzzle.word[targetIdx]

    state.hintsUsed += 1
    state.letterMask = updatedMask
    state.score = calculateScore(
      state.guessCount,
      state.hintsUsed,
      state.synonymGuessesCount || 0,
      state.hasWon
    )
    state.lastMessage = GAME_MESSAGES.hintRevealed(targetIdx + 1, puzzle.word[targetIdx])

    await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
    return c.json(buildStatePayload(state, puzzle))
  } catch (error: any) {
    console.error('Error revealing hint:', error)
    return c.json({ error: 'Failed to reveal hint' }, 500)
  }
})

// Endpoint to fetch domain leaderboard directly (with privacy filter check)
app.get('/api/leaderboard', async (c) => {
  try {
    const userEmail = await getUserEmail(c)
    const domain = c.req.query('domain') || extractDomain(userEmail)
    const dateStr = c.req.query('date') || getDailyPuzzle().date
    const leaderboard = await getDomainLeaderboard(c.env?.GAME_STATE_KV, domain, dateStr)

    // Filter out users who chose to hide themselves from the leaderboard
    const visibleEntriesWithSettings = await Promise.all(
      leaderboard.map(async (entry) => {
        const userSettings = await getUserSettings(c.env?.GAME_STATE_KV, entry.email)
        return { entry, showOnLeaderboard: userSettings.showOnLeaderboard }
      })
    )

    const allItems = visibleEntriesWithSettings
      .filter(item => item.showOnLeaderboard)
      .map((item, index) => {
        const guessWord = item.entry.guessCount === 1 ? 'guess' : 'guesses'
        return {
          rank: index + 1,
          displayEmail: formatDisplayEmail(item.entry.email),
          score: `${item.entry.score} points • ${item.entry.guessCount} ${guessWord}`,
          email: item.entry.email,
          isCurrentPlayer: item.entry.email.toLowerCase() === userEmail.toLowerCase()
        }
      })

    const top5 = allItems.slice(0, 5)
    const currentPlayerItem = allItems.find(item => item.isCurrentPlayer)

    const items = [...top5]
    if (currentPlayerItem && !top5.some(item => item.email.toLowerCase() === userEmail.toLowerCase())) {
      items.push(currentPlayerItem)
    }

    const { state: userState } = await getOrCreateGameState(c.env?.GAME_STATE_KV, userEmail, dateStr)

    const payload = {
      domain,
      date: dateStr,
      hasWon: userState.hasWon,
      players: items
    }

    return c.json({
      items: [payload]
    })
  } catch (error: any) {
    return c.json({ items: [] })
  }
})

// Cloudflare Worker export supporting fetch & scheduled 9:00 AM PST Cron Handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log(`[Cloudflare Cron] Executing daily 9:00 AM PST Cron Dispatch at ${event.scheduledTime} (cron: "${event.cron}")`)
    await sendDailyPuzzleEmails(env)
  }
}
