import { Hono } from 'hono'
import { OAuth2Client } from 'google-auth-library'
import { getDailyPuzzle, DailyPuzzle, formatPrettyDate } from './puzzles'
import { EMAIL_HTML } from './emailHtml'
import { generateAccountToken, verifyAccountToken, getAccountUrl, extractEmailDomain } from './auth'

export type LetterStatus = 'correct' | 'present' | 'absent'

export interface GuessResult {
  guess: string
  statuses: LetterStatus[]
}

export interface LeaderboardEntry {
  email: string
  displayEmail: string
  score: number
  guessCount: number
  hintsUsed: number
  wonAt: string
}

export interface SubscriberEntry {
  email: string
  domain: string
  subscribedAt: string
  status: 'active' | 'unsubscribed'
}

export interface UserSettings {
  email: string
  domain: string
  showOnLeaderboard: boolean
  daysPlayed?: number
  playedDates?: string[]
}

export interface GameState {
  puzzleId: string
  date: string
  letterMask: string[]
  guessesHistory: GuessResult[]
  guessCount: number
  hintsUsed: number
  score: number
  hasWon: boolean
  lastMessage: string
  shareText: string
  revealedCount: number
}

type Bindings = {
  GAME_STATE_KV: KVNamespace
  AUTH_SECRET?: string
}

export const app = new Hono<{ Bindings: Bindings }>()
const client = new OAuth2Client()
const REDACTED_DEF_TEXT = '████████████████████████████████'

// Persistent memory store for development fallback & 429 rate limit protection
const MEMORY_STORE = new Map<string, any>()

// Tunable constant height for non-definition UI elements (headers, letter clues grid, message banner, section margins/gaps)
const BASE_STATIC_STATE_LIST_HEIGHT = 136

// Calculate dynamic total amp-list height for pre-render (stable bounded height for clue stepper view)
function calculateStateListHeight(puzzle?: DailyPuzzle): number {
  return 180
}

async function kvGet(kv: KVNamespace | undefined, key: string): Promise<any> {
  if (kv) {
    try {
      const val = await kv.get(key, { type: 'json' })
      if (val !== null) {
        MEMORY_STORE.set(key, val)
        return val
      }
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed reading ${key} from KV, falling back to memory:`, err)
    }
  }
  return MEMORY_STORE.get(key) || null
}

async function kvPut(kv: KVNamespace | undefined, key: string, value: any): Promise<void> {
  MEMORY_STORE.set(key, value)
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value))
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed writing ${key} to KV:`, err)
    }
  }
}

// Helper to extract domain from email
function extractDomain(email: string): string {
  return extractEmailDomain(email)
}

// Display full uncensored email address in organization leaderboard
function formatDisplayEmail(email: string): string {
  return email ? email.toLowerCase().trim() : 'Anonymous'
}

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

async function getUserSettings(kv: KVNamespace | undefined, email: string): Promise<UserSettings> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractDomain(cleanEmail)
  const userKey = `user:profile:${cleanEmail}`
  const existing = await kvGet(kv, userKey)
  if (existing) {
    return {
      email: existing.email || cleanEmail,
      domain: existing.domain || domain,
      showOnLeaderboard: typeof existing.showOnLeaderboard === 'boolean' ? existing.showOnLeaderboard : true,
      daysPlayed: existing.daysPlayed,
      playedDates: existing.playedDates,
    }
  }

  return {
    email: cleanEmail,
    domain,
    showOnLeaderboard: true,
  }
}

async function updateUserSettings(kv: KVNamespace | undefined, settings: UserSettings): Promise<void> {
  const cleanEmail = settings.email.toLowerCase().trim()
  await kvPut(kv, `user:profile:${cleanEmail}`, settings)
}

async function recordUserActivity(
  kv: KVNamespace | undefined,
  email: string,
  dateStr: string
): Promise<UserSettings> {
  const profile = await getUserSettings(kv, email)

  if (!profile.playedDates) {
    profile.playedDates = [dateStr]
  } else if (!profile.playedDates.includes(dateStr)) {
    profile.playedDates.push(dateStr)
  }
  profile.daysPlayed = profile.playedDates.length

  await updateUserSettings(kv, profile)
  return profile
}

async function getCoworkerCount(
  kv: KVNamespace | undefined,
  domain: string,
  email: string
): Promise<number> {
  const subscribers = await getSubscribers(kv)
  const coworkerEmails = new Set<string>()

  for (const sub of subscribers) {
    if (sub.domain === domain) {
      coworkerEmails.add(sub.email.toLowerCase())
    }
  }

  const puzzle = getDailyPuzzle()
  const leaderboard = await getDomainLeaderboard(kv, domain, puzzle.date)
  for (const entry of leaderboard) {
    coworkerEmails.add(entry.email.toLowerCase())
  }

  coworkerEmails.delete(email.toLowerCase())
  return coworkerEmails.size
}

export function getFallbackHtml(options: {
  email: string
  domain: string
  daysPlayed: number
  coworkerCount: number
  playUrl: string
  accountUrl?: string
}): string {
  const { email, playUrl } = options
  const puzzle = getDailyPuzzle()

  // Use clean public URL without raw query string email parameters to pass Gmail security filters
  const cleanPlayUrl = playUrl.split('?')[0]
  const accountUrl = options.accountUrl || getAccountUrl(email, cleanPlayUrl)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <title>Word Game #${puzzle.id} - Daily Word Puzzle</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f4f4f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b; min-height: 100vh;">
  <div style="max-width: 480px; margin: 0 auto; padding: 20px 12px;">
    <!-- Single Card: White background, gray border -->
    <div style="background: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05); padding: 24px 20px; text-align: center;">
      <h1 style="font-size: 24px; font-weight: 900; letter-spacing: 3.5px; font-family: 'Righteous', 'Arial Rounded MT Bold', 'Impact', sans-serif; color: #18181b; text-transform: uppercase; margin: 0 0 14px 0; line-height: 1.2;">WORD GAME</h1>
      <p style="font-size: 14px; line-height: 1.6; color: #3f3f46; margin: 0 0 20px 0;">
        <strong style="color: #18181b;">${email}</strong> is inviting you to play word game, the daily game you can play in your email. Click below to start playing.
      </p>
      <div style="margin-bottom: 8px;">
        <a href="${cleanPlayUrl}" style="display: inline-block; background-color: #2563eb; color: #ffffff; font-size: 15px; font-weight: 700; text-decoration: none; padding: 12px 28px; border-radius: 8px; letter-spacing: 0.3px;">
          Play Word Game
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="padding: 12px 10px 16px; text-align: center; font-size: 11px; color: #71717a; font-weight: 500;">
      Word Game • The daily game you can play in your email<br>
      <a href="${accountUrl}" style="color: #14532d; text-decoration: underline; font-weight: 700; margin-top: 6px; display: inline-block;">Manage Account &amp; Preferences</a>
    </div>
  </div>
</body>
</html>`
}

// Evaluate Wordle-style letter matches
function evaluateGuess(target: string, guess: string): LetterStatus[] {
  const targetArr = target.toUpperCase().split('')
  const guessArr = guess.toUpperCase().split('')
  const len = targetArr.length
  const result: LetterStatus[] = new Array(len).fill('absent')
  const targetCounts: Record<string, number> = {}

  for (let i = 0; i < len; i++) {
    const char = targetArr[i]
    targetCounts[char] = (targetCounts[char] || 0) + 1
  }

  for (let i = 0; i < len; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct'
      targetCounts[guessArr[i]]--
    }
  }

  for (let i = 0; i < len; i++) {
    if (result[i] !== 'correct') {
      const char = guessArr[i]
      if (targetCounts[char] && targetCounts[char] > 0) {
        result[i] = 'present'
        targetCounts[char]--
      }
    }
  }

  return result
}

// Create initial empty letter mask
function createInitialMask(targetWord: string): string[] {
  return new Array(targetWord.length).fill('_')
}

// Calculate score based on performance
function calculateScore(guessCount: number, hintsUsed: number): number {
  const penalty = Math.max(0, (guessCount - 1) * 100) + hintsUsed * 75
  return Math.max(100, 1000 - penalty)
}

// Fetch domain leaderboard from KV or Memory
async function getDomainLeaderboard(
  kv: KVNamespace | undefined,
  domain: string,
  date: string
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${date}`
  const data = await kvGet(kv, key)
  return Array.isArray(data) ? data : []
}

// Save domain leaderboard entry to KV and Memory
async function updateDomainLeaderboard(
  kv: KVNamespace | undefined,
  domain: string,
  date: string,
  entry: LeaderboardEntry
): Promise<LeaderboardEntry[]> {
  const key = `leaderboard:${domain}:${date}`
  const list = (await getDomainLeaderboard(kv, domain, date)) || []

  const existingIdx = list.findIndex((item) => item.email === entry.email)
  if (existingIdx >= 0) {
    list[existingIdx] = entry
  } else {
    list.push(entry)
  }

  list.sort((a, b) => b.score - a.score || a.guessCount - b.guessCount)

  const topList = list.slice(0, 20)
  await kvPut(kv, key, topList)
  return topList
}

// Subscriber management helpers
async function getSubscribers(kv: KVNamespace | undefined): Promise<SubscriberEntry[]> {
  const data = await kvGet(kv, 'subscribers:list')
  return Array.isArray(data) ? data : []
}

async function addSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const domain = extractDomain(email)
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'active'
  } else {
    subscribers.push({
      email,
      domain,
      subscribedAt: new Date().toISOString(),
      status: 'active'
    })
  }

  await kvPut(kv, 'subscribers:list', subscribers)
  return subscribers
}

async function removeSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'unsubscribed'
    await kvPut(kv, 'subscribers:list', subscribers)
  }
  return subscribers
}

async function ensureSubscribedOnOpen(kv: KVNamespace | undefined, email: string): Promise<boolean> {
  const subscribers = await getSubscribers(kv)
  const existing = subscribers.find(s => s.email === email)

  if (!existing) {
    await addSubscriber(kv, email)
    return true
  }

  return existing.status === 'active'
}

// Helper to initialize or retrieve game state for a user and date
async function getOrCreateGameState(
  kv: KVNamespace | undefined,
  userEmail: string,
  dateStr?: string
): Promise<{ state: GameState; puzzle: DailyPuzzle; stateKey: string }> {
  const puzzle = getDailyPuzzle(dateStr)
  const domain = extractDomain(userEmail)
  const stateKey = `game:${puzzle.date}:${userEmail}`

  const stored = await kvGet(kv, stateKey)
  if (stored) {
    return { state: stored, puzzle, stateKey }
  }

  const initialState: GameState = {
    puzzleId: puzzle.id,
    date: puzzle.date,
    letterMask: createInitialMask(puzzle.word),
    guessesHistory: [],
    guessCount: 0,
    hintsUsed: 0,
    score: 0,
    hasWon: false,
    lastMessage: `Guess the ${puzzle.word.length}-letter word! Def #1 revealed.`,
    shareText: '',
    revealedCount: 1,
  }

  return { state: initialState, puzzle, stateKey }
}

// Enable CORS for AMP emails (Strict AMP for Email CORS header rules)
app.use('/api/*', async (c, next) => {
  const originHeader = c.req.header('Origin')
  const refererHeader = c.req.header('Referer')
  const ampSourceOrigin = c.req.query('__amp_source_origin')

  let refererOrigin = ''
  if (refererHeader) {
    try {
      refererOrigin = new URL(refererHeader).origin
    } catch (_) { }
  }

  let allowedOrigin = (originHeader && originHeader !== 'null') ? originHeader : (refererOrigin || 'https://mail.google.com')

  let sourceOrigin = ampSourceOrigin || ''
  if (!sourceOrigin) {
    if (originHeader && originHeader.includes('mail.google.com')) {
      sourceOrigin = 'https://mail.google.com'
    } else if (originHeader && (originHeader.includes('amp.dev') || originHeader.includes('gmail.dev'))) {
      sourceOrigin = 'amp@gmail.dev'
    } else if (originHeader) {
      try {
        sourceOrigin = new URL(originHeader).origin
      } catch (_) {
        sourceOrigin = 'https://mail.google.com'
      }
    } else {
      sourceOrigin = 'https://mail.google.com'
    }
  }

  c.header('Access-Control-Allow-Origin', allowedOrigin)
  c.header('Vary', 'Origin')
  c.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, AMP-Same-Origin, Authorization, x-user-email')
  c.header('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin')
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('AMP-Access-Control-Allow-Source-Origin', sourceOrigin)
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

// Serve AMP HTML preview page at root, with user state pre-embedded
app.get('/', async (c) => {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const { state, puzzle } = await getOrCreateGameState(c.env?.GAME_STATE_KV, userEmail, dateParam)
  const domain = extractDomain(userEmail)
  const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
  const userToken = generateAccountToken(userEmail, authSecret)

  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
  const forceHttps = c.req.query('forceHttps') === 'true'
  const prodOrigin = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

  const currentOrigin = (isLocalHost && !forceHttps)
    ? reqUrl.origin
    : prodOrigin

  const encodedEmail = encodeURIComponent(userEmail)
  const encodedDomain = encodeURIComponent(domain)

  let html = EMAIL_HTML
    .replaceAll('https://relatle.dev', currentOrigin)
    .replaceAll('https://email-game.teamify.workers.dev', currentOrigin)
    .replaceAll('USER_EMAIL_PLACEHOLDER', encodedEmail)
    .replaceAll('USER_DOMAIN_PLACEHOLDER', encodedDomain)
    .replaceAll('USER_DATE_PLACEHOLDER', puzzle.date)
    .replaceAll('default-dev-token', userToken)

  // Dynamically calculate and replace amp-list height on pre-render
  const dynamicStateListHeight = calculateStateListHeight(puzzle)
  html = html.replace('height="180"', `height="${dynamicStateListHeight}"`)

  // Pre-render Header Meta (Date, Domain, and Game Title)
  html = html.replace('Aug 5, 2026', formatPrettyDate(puzzle.date))
  html = html.replaceAll('company.com', domain)
  html = html.replaceAll(/word game #1/gi, (match) => {
    if (match === 'WORD GAME #1') return `WORD GAME #${puzzle.id}`
    if (match === 'Word Game #1') return `Word Game #${puzzle.id}`
    return `word game #${puzzle.id}`
  })

  // Pre-render Message Banner (Always initial prompt for initial state placeholder)
  const initialMsg = `Guess the ${puzzle.word.length}-letter word! Def #1 revealed.`
  html = html.replace('Guess the word!', initialMsg)

  // Pre-render definition clue tabs and active clue card for initial state placeholder
  const placeholderTabsHtml = puzzle.definitions.map((_, i) => {
    const isFirst = i === 0
    const activeClass = isFirst ? ' active unlocked' : ' locked'
    return `<button type="button" class="clue-tab-btn${activeClass}">${i + 1}</button>`
  }).join('')

  const placeholderClueCardsHtml = puzzle.definitions.map((def, i) => {
    const isFirst = i === 0
    const isRevealed = i === 0
    const hiddenAttr = isFirst ? '' : ' hidden'
    const textClass = isRevealed ? 'clue-text' : 'clue-text blurred'
    const text = isRevealed ? def : getRedactedText(def)
    return `<div class="clue-content"${hiddenAttr}><div class="${textClass}">${text}</div></div>`
  }).join('')

  const placeholderDefsHtml = `<div class="definitions-header"><span class="section-label">Definitions</span><div class="clue-tabs-bar">${placeholderTabsHtml}</div></div><div class="active-clue-card">${placeholderClueCardsHtml}</div>`

  html = html.replace('__PLACEHOLDER_DEFS__', placeholderDefsHtml)

  // Pre-render letter mask tiles (all '_') for initial state placeholder
  const placeholderMaskHtml = Array.from({ length: puzzle.word.length }, () => {
    return `<div class="mask-tile">_</div>`
  }).join('')

  html = html.replace('__PLACEHOLDER_MASK_TILES__', placeholderMaskHtml)

  return c.html(html)
})

// Serve non-AMP Fallback HTML with personalized engagement stats & CTA
app.get('/fallback', async (c) => {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const puzzle = getDailyPuzzle(dateParam)
  const domain = extractDomain(userEmail)
  const profile = await recordUserActivity(c.env?.GAME_STATE_KV, userEmail, puzzle.date)
  const coworkerCount = await getCoworkerCount(c.env?.GAME_STATE_KV, domain, userEmail)

  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
  const forceHttps = c.req.query('forceHttps') === 'true'
  const prodOrigin = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

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
    playUrl,
    accountUrl,
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

  return c.json({
    success: true,
    email: userProfile.email,
    domain: userProfile.domain,
    token,
    isSubscribed,
    showOnLeaderboard: userProfile.showOnLeaderboard
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

    const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
    const showOnLeaderboard = Boolean(body.showOnLeaderboard)
    userProfile.showOnLeaderboard = showOnLeaderboard
    await updateUserSettings(c.env?.GAME_STATE_KV, userProfile)

    return c.json({
      success: true,
      showOnLeaderboard,
      message: showOnLeaderboard
        ? `🏆 Your email is now visible on the ${userProfile.domain} leaderboard!`
        : `🔒 You are now hidden from the ${userProfile.domain} leaderboard.`
    })
  } catch (error: any) {
    return c.json({ success: false, message: 'Failed to update privacy preference.' }, 500)
  }
})

// Serve Light React Single Page App (SPA) for Account Preferences
app.get('/account', async (c) => {
  const reactAppHtml = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Word Game Account & Preferences</title>
  
  <!-- Load React & ReactDOM via CDN for lightweight high-performance SPA -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #0f172a;
      color: #f8fafc;
      line-height: 1.5;
      padding: 24px 16px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card-container {
      width: 100%;
      max-width: 480px;
      background: #1e293b;
      border: 1px solid #334155;
      border-radius: 20px;
      padding: 28px;
      box-shadow: 0 20px 40px -10px rgba(0,0,0,0.6);
      position: relative;
    }
    .header { text-align: center; margin-bottom: 24px; }
    .title {
      font-size: 32px;
      font-weight: 900;
      color: #818cf8;
      letter-spacing: 3px;
      text-transform: uppercase;
    }
    .subtitle { font-size: 13px; color: #94a3b8; margin-top: 2px; }
    .user-badge {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      background: #312e81;
      color: #a5b4fc;
      font-size: 13px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      margin-top: 12px;
      border: 1px solid rgba(165, 180, 252, 0.2);
    }
    .setting-card {
      background: #0f172a;
      border: 1px solid #334155;
      border-radius: 14px;
      padding: 18px;
      margin-bottom: 16px;
      transition: border-color 0.2s;
    }
    .setting-card:hover { border-color: #6366f1; }
    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 6px;
    }
    .setting-title { font-size: 15px; font-weight: 800; color: #f1f5f9; }
    .setting-desc { font-size: 12px; color: #94a3b8; line-height: 1.4; }
    
    /* Modern iOS Style Switch Toggle */
    .switch-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
    }
    .switch-label { font-size: 13px; font-weight: 700; color: #cbd5e1; }
    .switch {
      position: relative;
      display: inline-block;
      width: 52px;
      height: 28px;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #334155;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 28px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 22px;
      width: 22px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .3s cubic-bezier(0.4, 0, 0.2, 1);
      border-radius: 50%;
    }
    input:checked + .slider { background-color: #10b981; }
    input:checked + .slider:before { transform: translateX(24px); }
    
    /* Toast Notification Banner */
    .toast {
      position: absolute;
      top: -16px;
      left: 50%;
      transform: translateX(-50%);
      background: #065f46;
      color: #a7f3d0;
      border: 1px solid #10b981;
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(0,0,0,0.4);
      white-space: nowrap;
      animation: fadeIn 0.3s ease;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -10px); } to { opacity: 1; transform: translate(-50%, 0); } }
    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid rgba(255,255,255,0.3);
      border-radius: 50%;
      border-top-color: #6366f1;
      animation: spin 1s ease-in-out infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .play-link-btn {
      display: inline-block;
      margin-top: 14px;
      background: #2563eb;
      color: #ffffff;
      padding: 8px 16px;
      border-radius: 8px;
      text-decoration: none;
      font-size: 13px;
      font-weight: 700;
      transition: background 0.2s;
    }
    .play-link-btn:hover { background: #1d4ed8; }
    .footer-text { text-align: center; font-size: 11px; color: #64748b; margin-top: 20px; }
  </style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    function AccountApp() {
      const [loading, setLoading] = useState(true);
      const [user, setUser] = useState(null);
      const [toast, setToast] = useState('');
      const [updatingSub, setUpdatingSub] = useState(false);
      const [updatingPriv, setUpdatingPriv] = useState(false);

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || '';

      useEffect(() => {
        if (!token) {
          setLoading(false);
          return;
        }

        fetch('/api/account?token=' + encodeURIComponent(token))
          .then(res => {
            if (!res.ok) throw new Error('Unauthorized');
            return res.json();
          })
          .then(data => {
            if (data.success) {
              setUser(data);
            } else {
              setUser(null);
            }
            setLoading(false);
          })
          .catch(() => {
            setUser(null);
            setLoading(false);
          });
      }, []);

      const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
      };

      const handleToggleSub = async (e) => {
        const nextSub = e.target.checked;
        setUpdatingSub(true);
        try {
          const res = await fetch('/api/account/toggle-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, subscribed: nextSub })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, isSubscribed: data.isSubscribed }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update subscription');
        }
        setUpdatingSub(false);
      };

      const handleTogglePrivacy = async (e) => {
        const nextPriv = e.target.checked;
        setUpdatingPriv(true);
        try {
          const res = await fetch('/api/account/toggle-privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, showOnLeaderboard: nextPriv })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, showOnLeaderboard: data.showOnLeaderboard }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update privacy');
        }
        setUpdatingPriv(false);
      };

      if (loading) {
        return (
          <div className="card-container" style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '16px', color: '#94a3b8', fontSize: '14px' }}>Loading account preferences...</p>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="card-container" style={{ textAlign: 'center', padding: '36px 24px' }}>
            <div style={{ fontSize: '36px', marginBottom: '12px' }}>🔒</div>
            <h2 style={{ color: '#f87171', fontSize: '20px', marginBottom: '8px' }}>Invalid or Expired Link</h2>
            <p style={{ color: '#cbd5e1', fontSize: '13px', lineHeight: 1.5, marginBottom: '16px' }}>
              This account link is invalid, tampered with, or expired.<br />
              Please click the <strong>Manage Account & Preferences</strong> link directly from your daily Word Game email to access and manage your settings.
            </p>
            <div style={{ marginTop: '16px' }}>
              <a href="/" className="play-link-btn">▶ Play Today's Game</a>
            </div>
          </div>
        );
      }

      const playUrl = '/?email=' + encodeURIComponent(user.email);

      return (
        <div className="card-container">
          {toast && <div className="toast">{toast}</div>}

          <div className="header">
            <div className="title">Word Game</div>
            <div className="subtitle">Interactive Account & Preferences</div>
            <div className="user-badge">
              <span>{user.email}</span>
              <span>•</span>
              <span>{user.domain}</span>
            </div>
          </div>

          {/* Daily 9:00 AM PST Subscription Switch */}
          <div className="setting-card">
            <div className="setting-header">
              <span className="setting-title">📬 Daily 9:00 AM PST Emails</span>
            </div>
            <div className="setting-desc">
              Get today's multi-definition word puzzle delivered directly to your inbox every morning at 9:00 AM PST.
            </div>
            <div className="switch-container">
              <span className="switch-label">
                {user.isSubscribed ? '✅ Currently Subscribed' : '❌ Unsubscribed'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.isSubscribed}
                  onChange={handleToggleSub}
                  disabled={updatingSub}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          {/* Leaderboard Privacy Switch */}
          <div className="setting-card">
            <div className="setting-header">
              <span className="setting-title">🏆 Domain Leaderboard Visibility</span>
            </div>
            <div className="setting-desc">
              Feature your email on the <strong>{user.domain}</strong> daily leaderboard when you solve the puzzle.
            </div>
            <div className="switch-container">
              <span className="switch-label">
                {user.showOnLeaderboard ? '👁️ Visible on Leaderboard' : '🔒 Hidden from Leaderboard'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.showOnLeaderboard}
                  onChange={handleTogglePrivacy}
                  disabled={updatingPriv}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <div style={{ textAlign: 'center', marginTop: '16px' }}>
            <a href={playUrl} className="play-link-btn">▶ Return to Today's Game</a>
          </div>

          <div className="footer-text">
            Word Game • Secure Spoof-Proof Token Authentication
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<AccountApp />);
  </script>
</body>
</html>`

  return c.html(reactAppHtml)
})

// Subscribe Endpoint
app.post('/api/subscribe', async (c) => {
  try {
    let email = c.req.query('email')
    if (!email) {
      const body = await c.req.parseBody()
      email = body['email'] as string || body['subscriberEmail'] as string
    }

    if (!email || !email.includes('@')) {
      return c.json({ success: false, message: '⚠️ Please provide a valid email address.' }, 400)
    }

    const cleanEmail = email.toLowerCase().trim()
    const subscribers = await addSubscriber(c.env?.GAME_STATE_KV, cleanEmail)
    const activeCount = subscribers.filter(s => s.status === 'active').length

    return c.json({
      success: true,
      message: `🎉 Subscribed ${cleanEmail}! You will receive daily emails at 9:00 AM PST.`,
      activeSubscribers: activeCount
    })
  } catch (error: any) {
    return c.json({ success: false, message: '⚠️ Failed to record subscription.' }, 500)
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

function getRedactedText(text: string): string {
  if (!text) return '••••••••••••••••••••'
  return text.replace(/[^\s]/g, '•')
}

// Helper to build standardized state payload for AMP list
function buildStatePayload(state: GameState, puzzle: DailyPuzzle) {
  const activeRevealedCount = state.hasWon ? puzzle.definitions.length : state.revealedCount
  const definitions = puzzle.definitions.map((def, i) => {
    const isRevealed = i < activeRevealedCount
    const isLatest = i === Math.max(0, activeRevealedCount - 1)
    const isFirst = i === 0
    return {
      num: i + 1,
      isRevealed,
      isLatest,
      isFirst,
      text: isRevealed ? def : getRedactedText(def),
    }
  })

  const statePayload = {
    revealedCount: activeRevealedCount,
    totalDefinitions: puzzle.definitions.length,
    definitions,
    letterMask: state.letterMask,
    formattedLetterMask: state.letterMask.map(char => ({ char })),
    guessCount: state.guessCount,
    hintsUsed: state.hintsUsed,
    score: state.score,
    hasWon: state.hasWon,
    lastMessage: state.lastMessage,
    shareText: state.shareText,
  }

  return { items: [statePayload], ...statePayload }
}

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

    if (!guess || guess.length !== puzzle.word.length) {
      state.lastMessage = `Please enter a ${puzzle.word.length}-letter word.`
      await kvPut(c.env?.GAME_STATE_KV, stateKey, state)
      return c.json(buildStatePayload(state, puzzle))
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
    state.guessesHistory.push({ guess, statuses })
    state.letterMask = newMask

    if (isCorrect) {
      state.hasWon = true
      state.revealedCount = puzzle.definitions.length
      state.score = calculateScore(state.guessCount, state.hintsUsed)
      state.letterMask = puzzle.word.split('')
      state.lastMessage = `Solved "${puzzle.word}" in ${state.guessCount} guess${state.guessCount > 1 ? 'es' : ''}! Score: ${state.score} pts`

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

      state.shareText = `Word Game #${puzzle.id} (${formatPrettyDate(puzzle.date)})\nSolved in ${state.guessCount} guess${state.guessCount > 1 ? 'es' : ''
        }!\nScore: ${state.score} pts | Org Rank: #${rank} (${domain})\n\nPlay at: https://relatle.dev`
    } else {
      if (state.revealedCount < puzzle.definitions.length) {
        state.revealedCount += 1
      }
      state.lastMessage = `"${guess}" is incorrect. Def #${state.revealedCount} revealed!`
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
      state.lastMessage = 'All letters have already been revealed!'
      return c.json(buildStatePayload(state, puzzle))
    }

    const targetIdx = unrevealedIndices[0]
    const updatedMask = [...state.letterMask]
    updatedMask[targetIdx] = puzzle.word[targetIdx]

    state.hintsUsed += 1
    state.letterMask = updatedMask
    state.lastMessage = `Letter #${targetIdx + 1} is "${puzzle.word[targetIdx]}"!`

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

    const items = visibleEntriesWithSettings
      .filter(item => item.showOnLeaderboard)
      .map((item, index) => ({
        rank: index + 1,
        displayEmail: formatDisplayEmail(item.entry.email),
        score: `${item.entry.score} pts (${item.entry.guessCount}g)`,
        email: item.entry.email
      }))

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
    console.log('Executing daily 9:00 AM PST Cron Dispatch...', event.scheduledTime)
    const puzzle = getDailyPuzzle()
    const subscribers = await getSubscribers(env.GAME_STATE_KV)
    const activeSubscribers = subscribers.filter(s => s.status === 'active')

    console.log(`[Cron Dispatch] Ready to dispatch Word Game #${puzzle.id} (${formatPrettyDate(puzzle.date)}) to ${activeSubscribers.length} active subscribers.`)
  }
}
