import { Hono } from 'hono'
import { OAuth2Client } from 'google-auth-library'
import { DailyPuzzle } from './puzzles'
import { getDailyPuzzle, formatPrettyDate } from './puzzleLogic'
import { EMAIL_HTML } from './emailHtml'
import { generateAccountToken, verifyAccountToken, getAccountUrl, extractEmailDomain, generateConfirmationToken, verifyConfirmationToken } from './auth'
import { GAME_MESSAGES } from './gameMessages'
import { sendMailgunEmail, renderConfirmationEmailHtml, renderConfirmationEmailText } from './emailService'
import { LOGO_PNG_BASE64 } from './logoData'
import { EmailTheme, applyEmailTheme } from './emailThemes'

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
  theme?: EmailTheme
}

export interface GameState {
  puzzleId: string
  date: string
  letterMask: string[]
  guessesHistory: GuessResult[]
  guessedWords?: string[]
  guessCount: number
  hintsUsed: number
  score: number
  hasWon: boolean
  lastMessage: string
  shareText: string
  revealedCount: number
  synonymGuessesCount?: number
}

type Bindings = {
  GAME_STATE_KV: KVNamespace
  AUTH_SECRET?: string
  MAILGUN_API_KEY?: string
  MAILGUN_DOMAIN?: string
  SENDER_EMAIL?: string
  PUBLIC_HTTPS_URL?: string
  ADMIN_SECRET?: string
  TEST_EMAILS?: string
  TEST_EMAIL?: string
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
  return 196
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

export async function kvDelete(kv: KVNamespace | undefined, key: string): Promise<void> {
  MEMORY_STORE.delete(key)
  if (kv) {
    try {
      await kv.delete(key)
    } catch (err) {
      console.warn(`[KV Error] Failed deleting ${key} from KV:`, err)
    }
  }
}

// Reset user game state, leaderboard entry, and played dates for a specific date
export async function resetUserDayState(
  kv: KVNamespace | undefined,
  email: string,
  dateStr: string
): Promise<{
  success: boolean
  email: string
  date: string
  message: string
  details: {
    gameStateDeleted: boolean
    removedFromLeaderboard: boolean
    removedFromPlayedDates: boolean
  }
}> {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractDomain(cleanEmail)
  const stateKey = `game:${dateStr}:${cleanEmail}`

  // 1. Delete Game State
  await kvDelete(kv, stateKey)

  // 2. Remove from Domain Leaderboard for this date if present
  let removedFromLeaderboard = false
  const leaderboardKey = `leaderboard:${domain}:${dateStr}`
  const existingLeaderboard = await getDomainLeaderboard(kv, domain, dateStr)
  if (existingLeaderboard && existingLeaderboard.length > 0) {
    const filteredLeaderboard = existingLeaderboard.filter(
      (entry) => entry.email.toLowerCase().trim() !== cleanEmail
    )
    if (filteredLeaderboard.length !== existingLeaderboard.length) {
      await kvPut(kv, leaderboardKey, filteredLeaderboard)
      removedFromLeaderboard = true
    }
  }

  // 3. Remove date from user's playedDates profile if present
  let removedFromPlayedDates = false
  const userSettings = await getUserSettings(kv, cleanEmail)
  if (userSettings.playedDates && userSettings.playedDates.includes(dateStr)) {
    userSettings.playedDates = userSettings.playedDates.filter((d) => d !== dateStr)
    userSettings.daysPlayed = userSettings.playedDates.length
    await updateUserSettings(kv, userSettings)
    removedFromPlayedDates = true
  }

  return {
    success: true,
    email: cleanEmail,
    date: dateStr,
    message: `Successfully reset save state for ${cleanEmail} on ${dateStr}`,
    details: {
      gameStateDeleted: true,
      removedFromLeaderboard,
      removedFromPlayedDates,
    },
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
      theme: existing.theme === 'dark' ? 'dark' : 'light',
    }
  }

  return {
    email: cleanEmail,
    domain,
    showOnLeaderboard: true,
    theme: 'light',
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

async function getPlayerCount(kv: KVNamespace | undefined): Promise<number> {
  const subscribers = await getSubscribers(kv)
  return subscribers.filter(subscriber => subscriber.status === 'active').length
}

const COMMON_EMAIL_DOMAINS = new Set([
  'aol.com', 'att.net', 'comcast.net', 'gmail.com', 'googlemail.com', 'hotmail.com',
  'icloud.com', 'live.com', 'mac.com', 'mail.com', 'me.com', 'msn.com', 'outlook.com',
  'proton.me', 'protonmail.com', 'verizon.net', 'yahoo.com',
])

export function getFallbackHtml(options: {
  email: string
  domain: string
  daysPlayed: number
  coworkerCount: number
  playerCount?: number
  playUrl: string
  accountUrl?: string
  theme?: EmailTheme
}): string {
  const { email, domain, coworkerCount, playerCount = 0, playUrl, theme = 'light' } = options
  const puzzle = getDailyPuzzle()
  const isDark = theme === 'dark'

  // Use clean public URL without raw query string email parameters to pass Gmail security filters
  const cleanPlayUrl = playUrl.split('?')[0]
  const origin = cleanPlayUrl.replace(/\/$/, '')
  const logoUrl = `${origin}/logo.png`
  const accountUrl = options.accountUrl || getAccountUrl(email, cleanPlayUrl)
  const safeEmail = escapeHtml(email)
  const safeDomain = escapeHtml(domain)
  const safePlayUrl = escapeHtml(cleanPlayUrl)
  const safeAccountUrl = escapeHtml(accountUrl)
  const safeLogoUrl = escapeHtml(logoUrl)
  const communityMessage = COMMON_EMAIL_DOMAINS.has(domain.toLowerCase())
    ? `Join ${playerCount} players playing the game today.`
    : `Join ${coworkerCount} coworkers playing in the ${safeDomain} org.`

  const bodyBg = isDark ? '#121212' : '#ffffff'
  const cardBg = isDark ? '#18181b' : '#f4f4f5'
  const cardBorder = isDark ? '#27272a' : '#e4e4e7'
  const bodyText = isDark ? '#f4f4f5' : '#18181b'
  const strongText = isDark ? '#ffffff' : '#18181b'
  const pText = isDark ? '#e4e4e7' : '#27272a'
  const dividerColor = isDark ? '#27272a' : '#e4e4e7'
  const mutedText = isDark ? '#a1a1aa' : '#71717a'
  const subStrongText = isDark ? '#d4d4d8' : '#52525b'
  const ctaColor = isDark ? '#C4F7CA' : '#14532d'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed #${puzzle.id} - Daily Word Puzzle</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bodyBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${bodyText};">
  <div style="max-width: 480px; margin: 0 auto; padding: 12px 8px;">
    <div style="background-color: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 20px 16px; box-sizing: border-box;">
      <div style="text-align: center; margin: 0 0 20px;">
        <a href="${safePlayUrl}" style="text-decoration: none; display: inline-block;">
          <img src="${safeLogoUrl}" alt="INBOXED" width="160" height="38" style="display: block; margin: 0 auto; width: 160px; height: 38px; border: 0; outline: none; text-decoration: none;">
        </a>
      </div>

      <div style="padding: 4px 0 16px; text-align: left;">
        <p style="font-size: 15px; font-weight: 600; line-height: 1.55; color: ${pText}; margin: 0;">
          <strong style="color: ${strongText};">${safeEmail}</strong> is inviting you to play Inboxed, the daily word game in your inbox. ${communityMessage}
        </p>
        <a href="${safePlayUrl}" style="display: block; color: ${ctaColor}; font-size: 14px; font-weight: 800; margin-top: 16px; text-align: center; text-decoration: underline;">Sign up to play →</a>
      </div>

      <div style="border-top: 1px solid ${dividerColor};"></div>
      <div style="padding: 14px 0 2px; text-align: left; font-size: 12px; line-height: 1.5; color: ${mutedText};">
        <strong style="color: ${subStrongText};">Seeing this while trying to load the game?</strong><br>
        <p style="margin: 6px 0 0;">Your email client might not be supported. This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.</p>
        <p style="margin: 4px 0 0;">You can <a href="${safeAccountUrl}" style="color: ${ctaColor}; font-weight: 700; text-decoration: underline;">update your account preferences</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character))
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
    if (guessArr[i] && guessArr[i] === targetArr[i]) {
      result[i] = 'correct'
      targetCounts[guessArr[i]]--
    }
  }

  for (let i = 0; i < len; i++) {
    if (result[i] !== 'correct') {
      const char = guessArr[i]
      if (char && targetCounts[char] && targetCounts[char] > 0) {
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

// Helper to check if a guess matches any known synonym of the puzzle
export function isPuzzleSynonym(puzzle: DailyPuzzle, guess: string): boolean {
  if (!guess || !puzzle) return false
  const g = guess.trim().toUpperCase()
  if (Array.isArray(puzzle.synonyms)) {
    if (puzzle.synonyms.some((s) => typeof s === 'string' && s.trim().toUpperCase() === g)) {
      return true
    }
  }
  return false
}

// Calculate score based on performance (synonyms only penalize 25 pts instead of 100, letter hints penalize 150 pts)
export function calculateScore(
  guessCount: number,
  hintsUsed: number,
  synonymGuessesCount: number = 0,
  hasWon: boolean = true
): number {
  const wrongGuesses = hasWon ? Math.max(0, guessCount - 1) : guessCount
  const wrongSynonyms = Math.min(wrongGuesses, synonymGuessesCount)
  const regularWrong = Math.max(0, wrongGuesses - wrongSynonyms)
  const penalty = (regularWrong * 100) + (wrongSynonyms * 25) + (hintsUsed * 150)
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

export async function removeSubscriber(kv: KVNamespace | undefined, email: string): Promise<SubscriberEntry[]> {
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === email)

  if (existingIdx >= 0) {
    subscribers[existingIdx].status = 'unsubscribed'
    await kvPut(kv, 'subscribers:list', subscribers)
  }
  return subscribers
}

export async function unsubscribeUser(
  kv: KVNamespace | undefined,
  email: string,
  purge = false
): Promise<{ success: boolean; email: string; status: string; totalSubscribers: number; activeCount: number }> {
  const cleanEmail = email.toLowerCase().trim()
  const subscribers = await getSubscribers(kv)
  const existingIdx = subscribers.findIndex(s => s.email === cleanEmail)

  let status = 'not_found'
  if (existingIdx >= 0) {
    if (purge) {
      subscribers.splice(existingIdx, 1)
      status = 'purged'
    } else {
      subscribers[existingIdx].status = 'unsubscribed'
      status = 'unsubscribed'
    }
    await kvPut(kv, 'subscribers:list', subscribers)
  }

  return {
    success: true,
    email: cleanEmail,
    status,
    totalSubscribers: subscribers.length,
    activeCount: subscribers.filter(s => s.status === 'active').length
  }
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
    if (!stored.guessesHistory) {
      stored.guessesHistory = []
    }
    if (!stored.guessedWords) {
      stored.guessedWords = stored.guessesHistory.map((g: any) => g.guess)
    }
    if (stored.synonymGuessesCount === undefined) {
      stored.synonymGuessesCount = 0
    }
    return { state: stored, puzzle, stateKey }
  }

  const initialState: GameState = {
    puzzleId: puzzle.id,
    date: puzzle.date,
    letterMask: createInitialMask(puzzle.word),
    guessesHistory: [],
    guessedWords: [],
    guessCount: 0,
    hintsUsed: 0,
    score: 0,
    hasWon: false,
    lastMessage: GAME_MESSAGES.initialPrompt(puzzle.word.length),
    shareText: '',
    revealedCount: 1,
    synonymGuessesCount: 0,
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

export function getSignupHtml(c: any): string {
  const queryEmail = c.req.query('email') || ''
  const isSubscribed = c.req.query('subscribed') === 'true'
  const isPending = c.req.query('pending') === 'true'
  const safeEmail = escapeHtml(queryEmail)
  const puzzle = getDailyPuzzle()

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed - The Daily Word Game in Your Inbox</title>
  <meta name="description" content="A daily synonym word-guessing game right inside your email. Misses unlock new definitions. Compete with coworkers on your company leaderboard.">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .container {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 20px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 4px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      font-size: 18px;
      font-weight: 800;
      border-radius: 6px;
      border: 2px solid #18181b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    .rotate-neg {
      background-color: #D8FFC5;
      color: #18181b;
      transform: rotate(-8deg);
      margin-right: -4px;
    }
    .rotate-pos {
      background-color: #C4F7CA;
      color: #18181b;
      transform: rotate(8deg);
      margin-right: -4px;
    }
    h1 {
      font-size: 22px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.5px;
      line-height: 1.3;
      margin-bottom: 8px;
    }
    .subtitle {
      font-size: 14px;
      color: #52525b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .preview-card {
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 16px;
      margin-bottom: 24px;
      text-align: left;
    }
    .preview-header {
      font-size: 11px;
      font-weight: 700;
      color: #71717a;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
      display: flex;
      justify-content: space-between;
    }
    .preview-clue {
      font-size: 13px;
      font-weight: 600;
      color: #27272a;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 10px 12px;
      margin-bottom: 8px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .clue-num {
      background: #14532d;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      width: 18px;
      height: 18px;
      border-radius: 50%;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .clue-blur {
      filter: blur(4px);
      user-select: none;
      color: #a1a1aa;
    }
    .signup-form {
      margin-bottom: 20px;
    }
    .input-wrapper {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .email-input {
      width: 100%;
      padding: 12px 14px;
      border: 1.5px solid #d4d4d8;
      border-radius: 8px;
      font-size: 15px;
      color: #18181b;
      outline: none;
      transition: border-color 0.2s ease;
    }
    .email-input:focus {
      border-color: #18181b;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn-submit {
      width: auto;
      align-self: center;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      white-space: nowrap;
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .btn-submit:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
    }
    .btn-submit:active {
      transform: scale(0.99);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    .btn-submit:disabled {
      background-color: #e4e4e7;
      color: #a1a1aa;
      border-color: #d4d4d8;
      cursor: not-allowed;
      box-shadow: none;
    }
    .status-msg {
      margin-top: 10px;
      padding: 8px 12px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 600;
    }
    .status-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .success-card {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 12px;
      padding: 20px 16px;
      text-align: center;
    }
    .success-icon {
      font-size: 32px;
      margin-bottom: 8px;
    }
    .success-title {
      font-size: 17px;
      font-weight: 800;
      color: #14532d;
      margin-bottom: 6px;
    }
    .success-desc {
      font-size: 13px;
      color: #166534;
      line-height: 1.5;
      margin-bottom: 16px;
    }
    .disclaimer {
      margin-top: 18px;
      padding: 10px 14px;
      background-color: #fffbeb;
      border: 1px solid #fef3c7;
      border-radius: 8px;
      font-size: 12px;
      color: #92400e;
      line-height: 1.5;
      text-align: left;
    }
    .disclaimer a {
      color: #78350f;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .disclaimer a:hover {
      color: #451a03;
    }
    .features {
      border-top: 1px solid #e4e4e7;
      padding-top: 18px;
      margin-top: 18px;
      display: flex;
      flex-direction: column;
      gap: 10px;
      text-align: left;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 12px;
      color: #52525b;
      line-height: 1.4;
    }
    .feature-icon {
      font-size: 15px;
      flex-shrink: 0;
      margin-top: 1px;
    }
    .feature-text strong {
      color: #18181b;
    }
    .footer-text {
      margin-top: 24px;
      font-size: 11.5px;
      color: #71717a;
      text-align: center;
      line-height: 1.6;
    }
    .footer-text a {
      color: #14532d;
      font-weight: 700;
      text-decoration: underline;
    }
    .footer-links a {
      color: #71717a;
      font-weight: 500;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .footer-links a:hover {
      color: #18181b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <div class="logo-tiles" aria-label="INBOXED">
        <span class="logo-tile rotate-neg">I</span>
        <span class="logo-tile rotate-pos">N</span>
        <span class="logo-tile rotate-neg">B</span>
        <span class="logo-tile rotate-pos">O</span>
        <span class="logo-tile rotate-neg">X</span>
        <span class="logo-tile rotate-pos">E</span>
        <span class="logo-tile rotate-neg">D</span>
      </div>
    </div>

    <h1>The Daily Word Game in Your Inbox</h1>
    <p class="subtitle">
      Guess the hidden word from its definitions. Every morning at 8:00 AM, right inside your email.
    </p>

    <!-- Interactive / Clue Teaser Preview -->
    <div class="preview-card">
      <div class="preview-header">
        <span>Today's Clues</span>
        <span style="color: #14532d; font-weight: 700;">Puzzle #${puzzle.id}</span>
      </div>
      <div class="preview-clue">
        <span class="clue-num">1</span>
        <span>${escapeHtml(puzzle.definitions[0] || 'Synonym clue')}</span>
      </div>
      <div class="preview-clue">
        <span class="clue-num" style="background: #a1a1aa;">2</span>
        <span class="clue-blur">Miss a guess to reveal next definition</span>
      </div>
    </div>

    <!-- Signup Form / Success Container -->
    <div id="signup-container">
      ${isPending ? `
        <div class="success-card">
          <div class="success-icon">✉️</div>
          <h2 class="success-title">Check Your Email!</h2>
          <p class="success-desc">
            We sent a confirmation link to <strong>${safeEmail}</strong>.<br>
            Click the link in your email to confirm your subscription and start playing.
          </p>
        </div>
      ` : isSubscribed ? `
        <div class="success-card">
          <div class="success-icon">🎉</div>
          <h2 class="success-title">You're Subscribed!</h2>
          <p class="success-desc">
            You'll get emails at 9:00 AM PST every day.
          </p>
        </div>
      ` : `
        <form id="signup-form" class="signup-form" method="POST" action="/api/subscribe">
          <div class="input-wrapper">
            <input
              type="email"
              id="email-input"
              name="email"
              class="email-input"
              placeholder="Enter your email address"
              value="${safeEmail}"
              required
              autocomplete="email"
            >
            <button type="submit" id="submit-btn" class="btn-submit">
              Subscribe to Daily Puzzles
            </button>
          </div>
          <div id="status-msg" class="status-msg" style="display: none;"></div>
        </form>
      `}
    </div>

    <div class="features">
      <div class="feature-item">
        <span class="feature-icon">✉️</span>
        <span class="feature-text"><strong>Interactive in your email:</strong> Play directly inside supported email clients (like Gmail and Yahoo Mail) without leaving your inbox.</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🏢</span>
        <span class="feature-text"><strong>Company leaderboard:</strong> Compete automatically with coworkers at your email domain.</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🛡️</span>
        <span class="feature-text"><strong>Zero spam:</strong> Strictly one puzzle per day. One-click unsubscribe anytime.</span>
      </div>
    </div>

    <div class="disclaimer">
      Inboxed does not currently support Apple Mail, Outlook, or other non-AMP clients. <a href="https://amp.dev/support/faq/email-support/" target="_blank" rel="noopener noreferrer">See supported email clients</a>
    </div>

    <div class="footer-text">
      <div>Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a></div>
      <div class="footer-links" style="margin-top: 6px;">
        <a href="/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>

  <script>
    const form = document.getElementById('signup-form');
    if (form) {
      const input = document.getElementById('email-input');
      const btn = document.getElementById('submit-btn');
      const msg = document.getElementById('status-msg');
      const container = document.getElementById('signup-container');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email || !email.includes('@')) {
          msg.textContent = 'Please enter a valid email address.';
          msg.className = 'status-msg status-error';
          msg.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Subscribing...';
        msg.style.display = 'none';

        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.success) {
            container.innerHTML = \`
              <div class="success-card">
                <div class="success-icon">✉️</div>
                <h2 class="success-title">Check Your Email!</h2>
                <p class="success-desc">
                  We sent a confirmation link to <strong>\${email}</strong>.<br>
                  Click the link in your email to confirm your subscription and start playing.
                </p>
              </div>
            \`;
          } else {
            msg.textContent = data.message || 'Could not subscribe. Please try again.';
            msg.className = 'status-msg status-error';
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Subscribe to Daily Puzzles';
          }
        } catch (err) {
          msg.textContent = 'Something went wrong. Please check your connection.';
          msg.className = 'status-msg status-error';
          msg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Subscribe to Daily Puzzles';
        }
      });
    }
  </script>
</body>
</html>`
}

// Render confirmation success page with 9:00 AM PST schedule notice and instant puzzle delivery button
export function getConfirmationPageHtml(c: any, email: string, token: string): string {
  const puzzle = getDailyPuzzle()
  const safeEmail = escapeHtml(email)
  const safeToken = escapeHtml(token)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed - Inboxed</title>
  <meta name="description" content="Your subscription to Inboxed has been confirmed.">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .container {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 4px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      font-size: 18px;
      font-weight: 800;
      border-radius: 6px;
      border: 2px solid #18181b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    .rotate-neg {
      background-color: #D8FFC5;
      color: #18181b;
      transform: rotate(-8deg);
      margin-right: -4px;
    }
    .rotate-pos {
      background-color: #C4F7CA;
      color: #18181b;
      transform: rotate(8deg);
      margin-right: -4px;
    }
    .success-icon {
      font-size: 38px;
      margin-bottom: 12px;
    }
    .success-title {
      font-size: 24px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .schedule-notice {
      font-size: 15px;
      font-weight: 500;
      color: #52525b;
      line-height: 1.5;
      margin-bottom: 24px;
    }
    .action-section {
      margin-top: 12px;
    }
    .action-desc {
      font-size: 14px;
      color: #52525b;
      margin-bottom: 20px;
      line-height: 1.5;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
    }
    .action-desc strong {
      color: #18181b;
    }
    .btn-submit {
      width: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      white-space: nowrap;
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .btn-submit:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
    }
    .btn-submit:active {
      transform: scale(0.99);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    .btn-submit:disabled {
      background-color: #e4e4e7;
      color: #a1a1aa;
      border-color: #d4d4d8;
      cursor: not-allowed;
      box-shadow: none;
    }
    .status-msg {
      margin-top: 12px;
      padding: 10px 14px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      line-height: 1.4;
    }
    .status-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .status-error {
      background: #fef2f2;
      border: 1px solid #fecaca;
      color: #991b1b;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <div class="logo-tiles" aria-label="INBOXED">
        <span class="logo-tile rotate-neg">I</span>
        <span class="logo-tile rotate-pos">N</span>
        <span class="logo-tile rotate-neg">B</span>
        <span class="logo-tile rotate-pos">O</span>
        <span class="logo-tile rotate-neg">X</span>
        <span class="logo-tile rotate-pos">E</span>
        <span class="logo-tile rotate-neg">D</span>
      </div>
    </div>

    <div class="success-icon">🎉</div>
    <h1 class="success-title">You're Subscribed!</h1>
    <p class="schedule-notice">
      You'll get emails at 9am PST every day.
    </p>

    <div class="action-section">
      <p class="action-desc">
        Want to play today's game right now? Receive today's puzzle (<strong>#${puzzle.id}</strong>) in your inbox immediately:
      </p>
      <button id="send-today-btn" class="btn-submit">
        Receive Today's Puzzle Now
      </button>
      <div id="status-msg" class="status-msg" style="display: none;"></div>
    </div>
  </div>

  <script>
    const btn = document.getElementById('send-today-btn');
    const msg = document.getElementById('status-msg');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Sending to your inbox...';
        msg.style.display = 'none';

        try {
          const res = await fetch('/api/send-today', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: "${safeEmail}",
              token: "${safeToken}"
            })
          });
          const data = await res.json();
          if (data.success) {
            btn.style.display = 'none';
            msg.className = 'status-msg status-success';
            msg.innerHTML = '🚀 <strong>Sent!</strong> Check your inbox for today\\'s puzzle.';
            msg.style.display = 'block';
          } else {
            btn.disabled = false;
            btn.textContent = "Receive Today's Puzzle Now";
            msg.className = 'status-msg status-error';
            msg.textContent = data.message || 'Could not send puzzle. Please try again.';
            msg.style.display = 'block';
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "Receive Today's Puzzle Now";
          msg.className = 'status-msg status-error';
          msg.textContent = 'Connection error. Please try again.';
          msg.style.display = 'block';
        }
      });
    }
  </script>
</body>
</html>`
}

// Render error page for invalid or expired confirmation links
export function getInvalidConfirmationHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invalid Link - Inboxed</title>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 32px 16px;
    }
    .container {
      width: 100%;
      max-width: 480px;
      text-align: center;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 4px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      font-size: 18px;
      font-weight: 800;
      border-radius: 6px;
      border: 2px solid #18181b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    .rotate-neg {
      background-color: #D8FFC5;
      color: #18181b;
      transform: rotate(-8deg);
      margin-right: -4px;
    }
    .rotate-pos {
      background-color: #C4F7CA;
      color: #18181b;
      transform: rotate(8deg);
      margin-right: -4px;
    }
    .icon {
      font-size: 38px;
      margin-bottom: 12px;
    }
    h1 {
      font-size: 24px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    p {
      font-size: 14.5px;
      color: #52525b;
      line-height: 1.5;
      margin-bottom: 24px;
      max-width: 420px;
      margin-left: auto;
      margin-right: auto;
    }
    .btn {
      width: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      white-space: nowrap;
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .btn:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
    }
    .btn:active {
      transform: scale(0.99);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <div class="logo-tiles" aria-label="INBOXED">
        <span class="logo-tile rotate-neg">I</span>
        <span class="logo-tile rotate-pos">N</span>
        <span class="logo-tile rotate-neg">B</span>
        <span class="logo-tile rotate-pos">O</span>
        <span class="logo-tile rotate-neg">X</span>
        <span class="logo-tile rotate-pos">E</span>
        <span class="logo-tile rotate-neg">D</span>
      </div>
    </div>

    <div class="icon">⚠️</div>
    <h1>Link Expired or Invalid</h1>
    <p>
      This confirmation link is invalid or has expired. Please enter your email on the homepage to request a new link.
    </p>
    <a href="/" class="btn">Back to Home</a>
  </div>
</body>
</html>`
}

// Render Privacy Policy HTML page
export function getPrivacyPolicyHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Inboxed</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      line-height: 1.6;
      padding: 40px 20px;
    }
    .container {
      max-width: 640px;
      margin: 0 auto;
    }
    .back-link {
      display: inline-block;
      margin-bottom: 24px;
      font-size: 13px;
      font-weight: 700;
      color: #14532d;
      text-decoration: none;
    }
    .back-link:hover {
      text-decoration: underline;
    }
    .header {
      margin-bottom: 28px;
      border-bottom: 1px solid #e4e4e7;
      padding-bottom: 18px;
    }
    h1 {
      font-size: 26px;
      font-weight: 800;
      color: #18181b;
      margin-bottom: 6px;
      letter-spacing: -0.5px;
    }
    .meta {
      font-size: 12.5px;
      color: #71717a;
    }
    h2 {
      font-size: 17px;
      font-weight: 700;
      color: #18181b;
      margin-top: 26px;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #3f3f46;
      margin-bottom: 12px;
    }
    ul {
      margin-bottom: 14px;
      padding-left: 20px;
    }
    li {
      font-size: 13.5px;
      color: #3f3f46;
      margin-bottom: 6px;
    }
    li strong {
      color: #18181b;
    }
    a {
      color: #14532d;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 2px;
    }
    .card {
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 14px 16px;
      margin: 18px 0;
      font-size: 13.5px;
      color: #27272a;
    }
    .footer {
      margin-top: 40px;
      padding-top: 18px;
      border-top: 1px solid #e4e4e7;
      font-size: 12px;
      color: #71717a;
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Inboxed</a>

    <div class="header">
      <h1>Privacy Policy</h1>
      <div class="meta">Effective Date: September 14, 2026 &bull; Inboxed (<a href="https://inboxed.fun">inboxed.fun</a>)</div>
    </div>

    <h2>1. Introduction</h2>
    <p>
      Inboxed ("we", "our", or "us") provides a daily word puzzle game played directly inside email or on the web at <a href="https://inboxed.fun">inboxed.fun</a>.
    </p>
    <p>
      We respect your privacy. We do not sell your personal data, we do not run third-party advertising tracking scripts, and we collect only the minimal information needed to deliver the daily puzzle and operate leaderboards.
    </p>

    <h2>2. Information We Collect</h2>
    <ul>
      <li><strong>Email Address:</strong> Collected when you sign up to receive daily puzzle emails, confirmation messages, and account preferences.</li>
      <li><strong>Gameplay Data:</strong> When you play, we record basic game statistics such as puzzle date, guesses count, hints used, score, and completion status.</li>
      <li><strong>Organization / Domain:</strong> Extracted from your email domain (e.g. <code>company.com</code> from <code>user@company.com</code>) to group coworker leaderboards.</li>
      <li><strong>Preferences:</strong> Your subscription status and your leaderboard privacy choice (whether your name is displayed or masked as "Anonymous Player").</li>
      <li><strong>Technical Logs:</strong> Standard HTTP request logs (IP address, user agent, timestamp) temporarily processed by our infrastructure provider (Cloudflare) for security, rate-limiting, and abuse prevention.</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <ul>
      <li>To deliver daily puzzle emails to confirmed subscribers at 9:00 AM PST.</li>
      <li>To verify subscriptions through double opt-in confirmation emails.</li>
      <li>To maintain workplace and global leaderboards.</li>
      <li>To provide passwordless self-service preference management (updating preferences, pausing, or unsubscribing).</li>
    </ul>
    <p>
      We <strong>never</strong> sell, rent, or trade your personal information to third-party data brokers or marketing agencies.
    </p>

    <h2>4. Email & Anti-Spam Policy</h2>
    <ul>
      <li><strong>Daily Frequency:</strong> Confirmed subscribers receive at most one puzzle email per day.</li>
      <li><strong>Double Opt-In:</strong> Subscriptions must be verified via confirmation link before daily emails begin.</li>
      <li><strong>One-Click Unsubscribe:</strong> Every email includes an unsubscribe header (<code>List-Unsubscribe</code>) and a direct unsubscribe link in the footer. You can unsubscribe instantly at any time.</li>
    </ul>

    <h2>5. Third-Party Service Providers</h2>
    <p>We work with trusted infrastructure providers to deliver Inboxed:</p>
    <ul>
      <li><strong>Cloudflare:</strong> Hosts our web application (Cloudflare Workers) and encrypted edge database (Cloudflare KV).</li>
      <li><strong>Mailgun:</strong> Delivers transactional confirmation and daily puzzle emails via secure SMTP.</li>
    </ul>

    <h2>6. Security</h2>
    <p>
      We protect your data using industry-standard security measures:
    </p>
    <ul>
      <li><strong>Cryptographic Tokens:</strong> Account preferences and confirmation links use HMAC-SHA256 tokens, eliminating the need to store passwords.</li>
      <li><strong>Encrypted Transport:</strong> All web and email communications are transmitted over secure HTTPS / TLS connections.</li>
    </ul>

    <h2>7. Your Choices and Data Rights</h2>
    <ul>
      <li><strong>Leaderboard Anonymity:</strong> You can toggle your display name to "Anonymous Player" at any time in your account settings.</li>
      <li><strong>Unsubscribe:</strong> You can cancel your subscription at any time with one click.</li>
      <li><strong>Data Deletion:</strong> You can request full deletion of your email address and gameplay history by contacting us at <a href="mailto:game@inboxed.fun">game@inboxed.fun</a>.</li>
    </ul>

    <h2>8. Contact Us</h2>
    <p>
      If you have questions about this Privacy Policy or your data, please contact us:
    </p>
    <div class="card">
      <strong>Inboxed Support</strong><br>
      Email: <a href="mailto:game@inboxed.fun">game@inboxed.fun</a><br>
      Website: <a href="https://inboxed.fun">https://inboxed.fun</a>
    </div>

    <div class="footer">
      <a href="/" class="back-link">← Back to Inboxed</a><br>
      &copy; 2026 Inboxed. All rights reserved.
    </div>
  </div>
</body>
</html>`
}

// Render Development-only Workbench page for inspecting live game HTML, confirmation, and other pages
export function getDevWorkbenchHtml(params: {
  ampHtml: string
  fallbackHtml: string
  subject: string
  puzzle: DailyPuzzle
  userEmail: string
  currentOrigin: string
}): string {
  const { ampHtml, fallbackHtml, subject, puzzle, userEmail, currentOrigin } = params
  const safeEmail = escapeHtml(userEmail)
  const safeDate = escapeHtml(puzzle.date)
  const safeWord = escapeHtml(puzzle.word)
  const safeSubject = escapeHtml(subject)
  const encodedEmail = encodeURIComponent(userEmail)
  const encodedDate = encodeURIComponent(puzzle.date)
  const ampHtmlSizeKb = (ampHtml.length / 1024).toFixed(1)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev Workbench - All Pages &amp; HTML Inspector</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .dev-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 10px 20px;
    }
    .header-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 2px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      font-size: 12px;
      font-weight: 800;
      border-radius: 4px;
      border: 1.5px solid #18181b;
      margin-right: -2px;
    }
    .badge-dev {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 0 #e8ffea;
    }
    .badge-local {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 600;
    }
    .controls-section {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .dev-input {
      padding: 6px 10px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12.5px;
      color: #0f172a;
      outline: none;
      background: #ffffff;
    }
    .dev-input:focus {
      border-color: #18181b;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn-dev {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 700;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-primary {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-primary:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 4px rgba(0,0,0,0.08);
    }
    .btn-danger {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1.5px solid #fca5a5;
    }
    .btn-danger:hover {
      background-color: #fecaca;
    }
    .btn-secondary {
      background-color: #f8fafc;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background-color: #e2e8f0;
      color: #0f172a;
    }
    /* Page Switcher Navigation Bar */
    .pages-nav-bar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 20px 0 20px;
    }
    .pages-nav-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .page-tab-btn {
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      border: 1.5px solid transparent;
      border-bottom: none;
      background: transparent;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .page-tab-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .page-tab-btn.active {
      color: #000000;
      background: #f8fafc;
      border-color: #cbd5e1;
      border-bottom: 2px solid #f8fafc;
      font-weight: 700;
      margin-bottom: -1px;
      z-index: 10;
    }
    .workspace-container {
      max-width: 1280px;
      width: 100%;
      margin: 16px auto 32px auto;
      padding: 0 20px;
      flex: 1;
    }
    .page-context-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .page-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .page-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-desc {
      font-size: 12px;
      color: #64748b;
    }
    .page-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sub-switch-btn {
      padding: 4px 8px;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
    }
    .sub-switch-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .spoiler-box {
      background: #1e293b;
      color: #1e293b;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 800;
      letter-spacing: 2px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      transition: all 0.2s ease;
    }
    .spoiler-box.revealed {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      letter-spacing: 1px;
    }
    .mode-toggle-group {
      display: flex;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .mode-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .mode-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .frame-wrapper {
      display: flex;
      justify-content: center;
      background: #ffffff;
      padding: 24px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
    }
    .game-iframe {
      width: 640px;
      height: 820px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      transition: width 0.2s ease;
    }
    .code-container {
      display: none;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .code-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .code-pre {
      background: #0f172a;
      color: #a7f3d0;
      padding: 16px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.5;
      overflow: auto;
      max-height: 750px;
      border: 1px solid #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
    }
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      display: none;
      z-index: 9999;
    }
  </style>
</head>
<body>
  <header class="dev-header">
    <div class="header-content">
      <div class="brand-section">
        <div class="logo-tiles" aria-label="INBOXED">
          <span class="logo-tile" style="background-color: #D8FFC5;">I</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">N</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">B</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">O</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">X</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">E</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">D</span>
        </div>
        <span class="badge-dev">DEV WORKBENCH</span>
        <span class="badge-local">Local Only</span>
      </div>

      <form id="dev-params-form" class="controls-section" method="GET" action="/dev">
        <input
          type="date"
          id="date-input"
          name="date"
          class="dev-input"
          value="${safeDate}"
          title="Select Puzzle Date"
        >
        <input
          type="email"
          id="email-input"
          name="email"
          class="dev-input"
          value="${safeEmail}"
          placeholder="player@company.com"
          title="Test User Email"
          style="width: 190px;"
        >
        <button type="submit" class="btn-dev btn-primary">Update</button>
        <button type="button" id="reset-state-btn" class="btn-dev btn-danger" title="Reset guess state for this day">Reset Game</button>
        <a
          id="standalone-link"
          href="/dev/render?date=${encodedDate}&email=${encodedEmail}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-dev btn-secondary"
          title="Open page in a new full-screen tab"
        >
          ↗ Standalone Tab
        </a>
      </form>
    </div>
  </header>

  <!-- Navigation bar for all app pages -->
  <nav class="pages-nav-bar">
    <div class="pages-nav-content">
      <button type="button" class="page-tab-btn active" data-page="game">🎮 Daily Game (AMP)</button>
      <button type="button" class="page-tab-btn" data-page="confirmed">🎉 Subscription Confirmed</button>
      <button type="button" class="page-tab-btn" data-page="signup">📝 Landing / Signup</button>
      <button type="button" class="page-tab-btn" data-page="account">⚙️ Account Preferences</button>
      <button type="button" class="page-tab-btn" data-page="fallback">✉️ Fallback Email</button>
      <button type="button" class="page-tab-btn" data-page="invalid">⚠️ Invalid / Expired Token</button>
      <button type="button" class="page-tab-btn" data-page="privacy">🔒 Privacy Policy</button>
    </div>
  </nav>

  <main class="workspace-container">
    <!-- Context bar for active page -->
    <div class="page-context-box">
      <div class="page-info">
        <div class="page-title">
          <span id="ctx-title">🎮 Daily Game (AMP Email)</span>
          <span id="ctx-badge" class="badge-dev">Interactive</span>
        </div>
        <div id="ctx-desc" class="page-desc">Interactive AMP Email game with clue stepper, letter masking, and live guess validation.</div>
      </div>

      <div class="page-controls">
        <!-- Game specific metadata -->
        <div id="game-meta-group" style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #475569;">
          <span>Puzzle: <strong>#${puzzle.id}</strong></span>
          <span>Date: <strong>${formatPrettyDate(puzzle.date)}</strong></span>
          <span>
            Word:
            <span id="spoiler-word" class="spoiler-box" title="Click to reveal">${safeWord}</span>
          </span>
        </div>

        <!-- Landing page variations -->
        <div id="signup-variants-group" style="display: none; align-items: center; gap: 4px;">
          <span style="font-size: 11px; font-weight: 600; color: #64748b; margin-right: 4px;">State:</span>
          <button type="button" class="sub-switch-btn active" onclick="setSignupVariant('default', this)">Form</button>
          <button type="button" class="sub-switch-btn" onclick="setSignupVariant('pending', this)">Check Email (Pending)</button>
          <button type="button" class="sub-switch-btn" onclick="setSignupVariant('subscribed', this)">Subscribed</button>
        </div>

        <!-- Viewport selector -->
        <div class="viewport-buttons" style="display: flex; gap: 4px;">
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('375px', this)" title="Mobile">📱 375px</button>
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('520px', this)" title="Tablet">💻 520px</button>
          <button type="button" class="sub-switch-btn active" onclick="setFrameWidth('640px', this)" title="Desktop">🖥️ 640px</button>
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('100%', this)" title="Full">↔️ 100%</button>
        </div>

        <button type="button" class="sub-switch-btn" onclick="reloadIframe()" title="Reload Frame">🔄 Reload</button>

        <!-- View mode toggle: Preview vs HTML Source -->
        <div class="mode-toggle-group">
          <button type="button" id="btn-mode-preview" class="mode-btn active" onclick="setViewMode('preview')">👁️ Preview</button>
          <button type="button" id="btn-mode-source" class="mode-btn" onclick="setViewMode('source')">📄 HTML Source</button>
        </div>
      </div>
    </div>

    <!-- View Mode 1: Live Interactive Iframe -->
    <div id="preview-panel" class="frame-wrapper">
      <iframe
        id="preview-iframe"
        class="game-iframe"
        src="/dev/render?date=${encodedDate}&email=${encodedEmail}"
        title="Page Live Preview"
      ></iframe>
    </div>

    <!-- View Mode 2: HTML Source Code View -->
    <div id="source-panel" class="code-container">
      <div class="code-actions">
        <button type="button" id="copy-html-btn" class="btn-dev btn-primary">📋 Copy HTML</button>
        <button type="button" id="download-html-btn" class="btn-dev btn-secondary">💾 Download .html</button>
      </div>
      <pre class="code-pre"><code id="code-content" class="amp-source-code">${escapeHtml(ampHtml)}</code></pre>
    </div>
  </main>

  <div id="toast" class="toast"></div>

  <script>
    var currentEmail = '${encodedEmail}';
    var currentDate = '${encodedDate}';
    var currentPage = 'game';
    var currentViewMode = 'preview';
    var currentSignupVariant = 'default';

    var PAGE_DEFS = {
      game: {
        title: '🎮 Daily Game (AMP Email)',
        desc: 'Interactive AMP Email game with clue stepper, letter masking, and live guess validation.',
        badge: 'Interactive',
        url: '/dev/render?date=' + currentDate + '&email=' + currentEmail,
        hasGameMeta: true
      },
      confirmed: {
        title: '🎉 Subscription Confirmed',
        desc: 'Confirmation success page with 9:00 AM PST schedule notice and instant puzzle delivery button.',
        badge: 'Page',
        url: '/dev/page/confirmed?email=' + currentEmail
      },
      signup: {
        title: '📝 Landing / Signup Page',
        desc: 'Email signup landing page with daily puzzle preview and newsletter features.',
        badge: 'Page',
        url: '/dev/page/signup?email=' + currentEmail,
        hasSignupVariants: true
      },
      account: {
        title: '⚙️ Account &amp; Preferences',
        desc: 'React Single Page App (SPA) for managing workplace leaderboard privacy and subscription.',
        badge: 'React SPA',
        url: '/dev/page/account?email=' + currentEmail
      },
      fallback: {
        title: '✉️ Fallback Email Card',
        desc: 'Non-AMP fallback email invitation card for Apple Mail, Outlook, and desktop clients.',
        badge: 'Email Card',
        url: '/dev/fallback?date=' + currentDate + '&email=' + currentEmail
      },
      invalid: {
        title: '⚠️ Invalid / Expired Token',
        desc: 'Error screen displayed when a confirmation token is expired, tampered with, or malformed.',
        badge: 'Error Screen',
        url: '/dev/page/invalid'
      },
      privacy: {
        title: '🔒 Privacy Policy',
        desc: 'Official Inboxed privacy policy (GET /privacy).',
        badge: 'Document',
        url: '/dev/page/privacy'
      }
    };

    function showToast(message) {
      var toast = document.getElementById('toast');
      toast.textContent = message;
      toast.style.display = 'block';
      setTimeout(function() {
        toast.style.display = 'none';
      }, 2500);
    }

    function switchPage(pageKey) {
      currentPage = pageKey;
      var def = PAGE_DEFS[pageKey];
      if (!def) return;

      // Update nav button active states
      document.querySelectorAll('.page-tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-page') === pageKey);
      });

      // Update context header
      document.getElementById('ctx-title').innerHTML = def.title;
      document.getElementById('ctx-desc').innerHTML = def.desc;
      document.getElementById('ctx-badge').textContent = def.badge;

      // Show/hide sub-controls
      document.getElementById('game-meta-group').style.display = def.hasGameMeta ? 'flex' : 'none';
      document.getElementById('signup-variants-group').style.display = def.hasSignupVariants ? 'flex' : 'none';

      // Compute URL
      var targetUrl = def.url;
      if (pageKey === 'signup' && currentSignupVariant !== 'default') {
        targetUrl += '&' + currentSignupVariant + '=true';
      }

      // Update iframe & standalone link
      var iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.src = targetUrl;
      var standalone = document.getElementById('standalone-link');
      if (standalone) standalone.href = targetUrl;

      // If source mode is active, fetch HTML source for this page
      if (currentViewMode === 'source') {
        loadPageSource(pageKey);
      }
    }

    function setSignupVariant(variant, btn) {
      currentSignupVariant = variant;
      document.querySelectorAll('#signup-variants-group .sub-switch-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');

      var targetUrl = '/dev/page/signup?email=' + currentEmail;
      if (variant !== 'default') {
        targetUrl += '&' + variant + '=true';
      }

      var iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.src = targetUrl;
      var standalone = document.getElementById('standalone-link');
      if (standalone) standalone.href = targetUrl;

      if (currentViewMode === 'source') {
        loadPageSource('signup');
      }
    }

    function setViewMode(mode) {
      currentViewMode = mode;
      document.getElementById('btn-mode-preview').classList.toggle('active', mode === 'preview');
      document.getElementById('btn-mode-source').classList.toggle('active', mode === 'source');

      document.getElementById('preview-panel').style.display = (mode === 'preview') ? 'flex' : 'none';
      document.getElementById('source-panel').style.display = (mode === 'source') ? 'block' : 'none';

      if (mode === 'source') {
        loadPageSource(currentPage);
      }
    }

    async function loadPageSource(pageKey) {
      var codeElem = document.getElementById('code-content');
      codeElem.textContent = 'Loading source code for ' + pageKey + '...';

      try {
        var url = '/dev/raw?page=' + pageKey + '&email=' + currentEmail + '&date=' + currentDate;
        if (pageKey === 'signup' && currentSignupVariant !== 'default') {
          url += '&' + currentSignupVariant + '=true';
        }
        var res = await fetch(url);
        var text = await res.text();
        codeElem.textContent = text;
      } catch (err) {
        codeElem.textContent = 'Failed to load HTML source.';
      }
    }

    function setFrameWidth(width, btn) {
      var frame = document.getElementById('preview-iframe');
      if (frame) frame.style.width = width;
      document.querySelectorAll('.viewport-buttons .sub-switch-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');
    }

    function reloadIframe() {
      var frame = document.getElementById('preview-iframe');
      if (frame) {
        var currentSrc = frame.src;
        frame.src = 'about:blank';
        setTimeout(function() { frame.src = currentSrc; }, 50);
        showToast('Reloaded preview');
      }
    }

    // Spoiler toggle
    var spoiler = document.getElementById('spoiler-word');
    if (spoiler) {
      spoiler.addEventListener('click', function() {
        spoiler.classList.toggle('revealed');
      });
    }

    // Copy HTML button
    var copyBtn = document.getElementById('copy-html-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        var code = document.getElementById('code-content').textContent;
        navigator.clipboard.writeText(code).then(function() {
          showToast('Copied HTML to clipboard!');
        }).catch(function() {
          showToast('Failed to copy. Please select manually.');
        });
      });
    }

    // Download HTML file
    var downloadBtn = document.getElementById('download-html-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        var code = document.getElementById('code-content').textContent;
        var blob = new Blob([code], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'inboxed-' + currentPage + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded HTML file!');
      });
    }

    // Reset Game State for current email and date
    var resetBtn = document.getElementById('reset-state-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async function() {
        var email = document.getElementById('email-input').value.trim();
        var date = document.getElementById('date-input').value.trim();
        if (!email) {
          showToast('Please enter an email to reset');
          return;
        }

        resetBtn.disabled = true;
        resetBtn.textContent = 'Resetting...';

        try {
          var res = await fetch('/api/admin/reset-user-day?email=' + encodeURIComponent(email) + '&date=' + encodeURIComponent(date), {
            method: 'POST'
          });
          var data = await res.json();
          if (data.success) {
            showToast('Game state reset! Reloading...');
            reloadIframe();
          } else {
            showToast('Reset failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          showToast('Error connecting to reset endpoint');
        } finally {
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Game';
        }
      });
    }

    // Initialize page navigation buttons
    document.querySelectorAll('.page-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = btn.getAttribute('data-page');
        switchPage(page);
      });
    });
  </script>
</body>
</html>`
}

// Helper to build full AMP + Fallback HTML content for daily puzzle emails
export async function buildPuzzleEmailContent(
  kv: KVNamespace | undefined,
  userEmail: string,
  dateParam?: string,
  currentOrigin?: string,
  authSecret?: string,
  themeOverride?: EmailTheme
): Promise<{ ampHtml: string; fallbackHtml: string; subject: string; text: string; puzzle: DailyPuzzle; theme: EmailTheme }> {
  const { state, puzzle } = await getOrCreateGameState(kv, userEmail, dateParam)
  const domain = extractDomain(userEmail)
  const secret = authSecret || process.env.AUTH_SECRET
  const userToken = generateAccountToken(userEmail, secret)
  const origin = (currentOrigin || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')

  const encodedEmail = encodeURIComponent(userEmail)
  const encodedDomain = encodeURIComponent(domain)

  const profile = await recordUserActivity(kv, userEmail, puzzle.date)
  const theme: EmailTheme = themeOverride || profile.theme || 'light'

  let ampHtml = EMAIL_HTML
    .replaceAll('https://inboxed.fun', origin)
    .replaceAll('USER_EMAIL_PLACEHOLDER', encodedEmail)
    .replaceAll('USER_DOMAIN_PLACEHOLDER', encodedDomain)
    .replaceAll('USER_DATE_PLACEHOLDER', puzzle.date)
    .replaceAll('default-dev-token', userToken)

  ampHtml = applyEmailTheme(ampHtml, theme)

  const dynamicStateListHeight = calculateStateListHeight(puzzle)
  ampHtml = ampHtml.replace('height="196"', `height="${dynamicStateListHeight}"`)
  ampHtml = ampHtml
    .replaceAll('"wordLength": 7', `"wordLength": ${puzzle.word.length}`)
    .replaceAll('maxlength="7"', `maxlength="${puzzle.word.length}"`)
    .replaceAll('gameState.wordLength || 7', `gameState.wordLength || ${puzzle.word.length}`)

  ampHtml = ampHtml.replace('Aug 5, 2026', formatPrettyDate(puzzle.date))
  ampHtml = ampHtml.replaceAll('company.com', domain)
  ampHtml = ampHtml
    .replaceAll(/<span class="logo-badge">#\d+<\/span>/g, `<span class="logo-badge">#${puzzle.id}</span>`)
    .replaceAll('aria-label="Inboxed #1"', `aria-label="Inboxed #${puzzle.id}"`)
    .replaceAll(/inboxed #1/gi, (match) => {
      if (match === 'INBOXED #1') return `INBOXED #${puzzle.id}`
      if (match === 'Inboxed #1') return `Inboxed #${puzzle.id}`
      return `inboxed #${puzzle.id}`
    })
    .replaceAll(/word game #1/gi, (match) => {
      if (match === 'WORD GAME #1') return `INBOXED #${puzzle.id}`
      if (match === 'Word Game #1') return `Inboxed #${puzzle.id}`
      return `Inboxed #${puzzle.id}`
    })

  const initialMsg = GAME_MESSAGES.initialPrompt(puzzle.word.length)
  ampHtml = ampHtml.replace('Guess the word!', initialMsg)

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

  const placeholderDefsHtml = `<div class="active-clue-card">${placeholderClueCardsHtml}</div><div class="clue-tabs-bar">${placeholderTabsHtml}</div>`
  ampHtml = ampHtml.replace('__PLACEHOLDER_DEFS__', placeholderDefsHtml)

  const placeholderMaskHtml = state.letterMask.map((char, index) => {
    const isRevealed = char !== '_' && char !== ''
    const displayedChar = isRevealed ? char : ''
    const revClass = isRevealed ? ' tile-revealed' : ''
    return `<span class="mask-tile${revClass}" [class]="'mask-tile ' + ((typed.word || '').slice(${index}, ${index + 1}) ? 'tile-typed' : '${isRevealed ? 'tile-revealed' : ''}')" [text]="(typed.word || '').slice(${index}, ${index + 1}) || '${displayedChar}'">${displayedChar}</span>`
  }).join('')
  ampHtml = ampHtml.replace('__PLACEHOLDER_MASK_TILES__', placeholderMaskHtml)

  const coworkerCount = await getCoworkerCount(kv, domain, userEmail)
  const playerCount = await getPlayerCount(kv)
  const playUrl = `${origin}/?email=${encodedEmail}`
  const accountUrl = getAccountUrl(userEmail, origin, secret)

  const fallbackHtml = getFallbackHtml({
    email: userEmail,
    domain,
    daysPlayed: profile.daysPlayed || 1,
    coworkerCount,
    playerCount,
    playUrl,
    accountUrl,
    theme,
  })

  const subject = `Inboxed #${puzzle.id} - ${formatPrettyDate(puzzle.date)}`
  const text = `Play today's Inboxed puzzle (#${puzzle.id}): ${origin}/?email=${encodedEmail}`

  return { ampHtml, fallbackHtml, subject, text, puzzle, theme }
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

// React API Endpoint: Toggle Theme / Dark Mode (AJAX)
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
    if (typeof body.theme === 'string') {
      nextTheme = body.theme === 'dark' ? 'dark' : 'light'
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

// HTML template for React Single Page App (SPA) Account Preferences
export function getAccountPageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Account &amp; Preferences</title>
  
  <!-- Load React & ReactDOM via CDN for lightweight high-performance SPA -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      line-height: 1.5;
      padding: 32px 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 480px;
      margin: 0 auto;
      box-sizing: border-box;
      position: relative;
    }
    .logo-container {
      display: flex;
      justify-content: center;
      align-items: center;
      margin-bottom: 24px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 4px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 34px;
      height: 34px;
      font-size: 18px;
      font-weight: 800;
      border-radius: 6px;
      border: 2px solid #18181b;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
    }
    .rotate-neg {
      background-color: #D8FFC5;
      color: #18181b;
      transform: rotate(-8deg);
      margin-right: -4px;
    }
    .rotate-pos {
      background-color: #C4F7CA;
      color: #18181b;
      transform: rotate(8deg);
      margin-right: -4px;
    }
    .header {
      margin-bottom: 8px;
      text-align: center;
    }
    .title {
      font-size: 24px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.5px;
      margin-bottom: 8px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 10px 0 24px 0;
      font-size: 13.5px;
      font-weight: 600;
      color: #18181b;
    }
    .domain-pill {
      background: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      padding: 2px 8px;
      border-radius: 6px;
      font-size: 11px;
      font-weight: 700;
      text-transform: lowercase;
      box-shadow: inset 0 1px 0 0 #e8ffea;
    }
    .section-divider {
      border: none;
      border-top: 1px solid #e4e4e7;
      margin: 0;
    }
    .setting-section {
      padding: 18px 0;
      text-align: left;
    }
    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .setting-title { font-size: 14.5px; font-weight: 700; color: #18181b; }
    .setting-desc { font-size: 13px; color: #71717a; line-height: 1.45; margin-top: 4px; }
    .btn {
      width: auto;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 10px 20px;
      white-space: nowrap;
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 700;
      text-decoration: none;
      cursor: pointer;
      transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
    }
    .btn:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
    }
    .btn:active {
      transform: scale(0.99);
      box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
    }
    
    /* Modern iOS Style Switch Toggle with Button Green Accent Theme */
    .switch-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
    }
    .switch-label { font-size: 12.5px; font-weight: 700; }
    .switch {
      position: relative;
      display: inline-block;
      width: 44px;
      height: 24px;
    }
    .switch input { opacity: 0; width: 0; height: 0; }
    .slider {
      position: absolute;
      cursor: pointer;
      top: 0; left: 0; right: 0; bottom: 0;
      background-color: #e4e4e7;
      border: 1.5px solid #d4d4d8;
      box-sizing: border-box;
      transition: .2s ease;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 16px;
      width: 16px;
      left: 2px;
      bottom: 2px;
      background-color: white;
      transition: .2s ease;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }
    input:checked + .slider {
      background-color: #C4F7CA;
      border-color: #7ecc84;
      box-shadow: inset 0 1px 0 0 #e8ffea;
    }
    input:checked + .slider:before {
      transform: translateX(20px);
    }
    
    /* Toast Notification Banner */
    .toast {
      position: absolute;
      top: -14px;
      left: 50%;
      transform: translateX(-50%);
      background: #14532d;
      color: #ffffff;
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      box-shadow: 0 4px 12px rgba(20, 83, 45, 0.25);
      white-space: nowrap;
      animation: fadeIn 0.25s ease;
      z-index: 10;
    }
    @keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
    .spinner {
      display: inline-block;
      width: 24px;
      height: 24px;
      border: 3px solid #e4e4e7;
      border-radius: 50%;
      border-top-color: #14532d;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    .footer-text {
      padding: 16px 0;
      text-align: center;
      font-size: 11.5px;
      color: #71717a;
    }
    .footer-text a {
      color: #14532d;
      font-weight: 700;
      text-decoration: underline;
    }

    /* Dark Mode Theme Overrides for Account Preferences SPA */
    body.dark-theme {
      background-color: #121212;
      color: #f4f4f5;
    }
    body.dark-theme .title {
      color: #ffffff;
    }
    body.dark-theme .user-badge {
      color: #f4f4f5;
    }
    body.dark-theme .section-divider {
      border-top-color: #27272a;
    }
    body.dark-theme .setting-title {
      color: #f4f4f5;
    }
    body.dark-theme .setting-desc {
      color: #a1a1aa;
    }
    body.dark-theme .slider {
      background-color: #27272a;
      border-color: #3f3f46;
    }
    body.dark-theme .slider:before {
      background-color: #f4f4f5;
    }
    body.dark-theme .footer-text {
      color: #a1a1aa;
    }
    body.dark-theme .footer-text a {
      color: #C4F7CA;
    }
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
      const [updatingTheme, setUpdatingTheme] = useState(false);

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

      useEffect(() => {
        if (user && user.theme === 'dark') {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }, [user?.theme]);

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

      const handleToggleTheme = async (e) => {
        const nextDark = e.target.checked;
        const nextTheme = nextDark ? 'dark' : 'light';
        setUpdatingTheme(true);
        try {
          const res = await fetch('/api/account/toggle-theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, theme: nextTheme, darkMode: nextDark })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, theme: data.theme, darkMode: data.darkMode }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update theme preference');
        }
        setUpdatingTheme(false);
      };

      if (loading) {
        return (
          <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '14px', color: '#71717a', fontSize: '13px', fontWeight: 600 }}>Loading account preferences...</p>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="logo-container">
              <div className="logo-tiles" aria-label="INBOXED">
                <span className="logo-tile rotate-neg">I</span>
                <span className="logo-tile rotate-pos">N</span>
                <span className="logo-tile rotate-neg">B</span>
                <span className="logo-tile rotate-pos">O</span>
                <span className="logo-tile rotate-neg">X</span>
                <span className="logo-tile rotate-pos">E</span>
                <span className="logo-tile rotate-neg">D</span>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '38px', marginBottom: '12px' }}>⚠️</div>
              <h2 style={{ color: '#18181b', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>Invalid or Expired Link</h2>
              <p style={{ color: '#52525b', fontSize: '14px', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto 24px' }}>
                This account link is invalid, tampered with, or expired.<br />
                Please click the <strong>update your account preferences</strong> link directly from your daily Inboxed email to access and manage your settings.
              </p>
              <a href="/" className="btn">Back to Home</a>
            </div>
          </div>
        );
      }

      return (
        <div className="container">
          {toast && <div className="toast">{toast}</div>}

          <div className="logo-container">
            <div className="logo-tiles" aria-label="INBOXED">
              <span className="logo-tile rotate-neg">I</span>
              <span className="logo-tile rotate-pos">N</span>
              <span className="logo-tile rotate-neg">B</span>
              <span className="logo-tile rotate-pos">O</span>
              <span className="logo-tile rotate-neg">X</span>
              <span className="logo-tile rotate-pos">E</span>
              <span className="logo-tile rotate-neg">D</span>
            </div>
          </div>

          <div className="header">
            <h1 className="title">Account &amp; Preferences</h1>
            <div className="user-badge">
              <span>{user.email}</span>
              <span className="domain-pill">{user.domain}</span>
            </div>
          </div>

          {/* Daily Morning Subscription Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">📬 Daily Morning Email</span>
            </div>
            <div className="setting-desc">
              Receive today's multi-definition word puzzle in your inbox each morning.
            </div>
            <div className="switch-container">
              <span className="switch-label" style={{ color: user.isSubscribed ? '#14532d' : '#71717a' }}>
                {user.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
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

          <hr className="section-divider" />

          {/* Leaderboard Privacy Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">🏆 Domain Leaderboard Visibility</span>
            </div>
            <div className="setting-desc">
              Show your score on the <strong>{user.domain}</strong> leaderboard when you solve the puzzle.
            </div>
            <div className="switch-container">
              <span className="switch-label" style={{ color: user.showOnLeaderboard ? '#14532d' : '#71717a' }}>
                {user.showOnLeaderboard ? 'Visible on Leaderboard' : 'Hidden from Leaderboard'}
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

          <hr className="section-divider" />

          {/* Dark Mode Theme Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">🌙 Dark Mode</span>
            </div>
            <div className="setting-desc">
              Receive your daily puzzle email in dark mode instead of light mode.
            </div>
            <div className="switch-container">
              <span className="switch-label" style={{ color: user.theme === 'dark' ? (user.theme === 'dark' ? '#C4F7CA' : '#14532d') : '#71717a' }}>
                {user.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
              </span>
              <label className="switch">
                <input
                  type="checkbox"
                  checked={user.theme === 'dark'}
                  onChange={handleToggleTheme}
                  disabled={updatingTheme}
                />
                <span className="slider"></span>
              </label>
            </div>
          </div>

          <hr className="section-divider" />

          <div className="footer-text">
            Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a>
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<AccountApp />);
  </script>
</body>
</html>`
}

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

function getRedactedText(text: string): string {
  if (!text) return '••••••••••••••••••••'
  return text.replace(/[^\s]/g, '•')
}

// Helper to build standardized state payload for AMP list
function buildStatePayload(state: GameState, puzzle: DailyPuzzle, error?: string) {
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

  const guessedWords = state.guessedWords || (state.guessesHistory || []).map(g => g.guess)

  const statePayload = {
    revealedCount: activeRevealedCount,
    totalDefinitions: puzzle.definitions.length,
    definitions,
    wordLength: puzzle.word.length,
    letterMask: state.letterMask,
    formattedLetterMask: state.letterMask.map((char, index) => {
      const isRevealed = char !== '_' && char !== ''
      return {
        char: isRevealed ? char : '',
        isRevealed,
        index,
        indexNext: index + 1,
      }
    }),
    guessCount: state.guessCount,
    hintsUsed: state.hintsUsed,
    score: state.score,
    hasWon: state.hasWon,
    lastMessage: state.lastMessage,
    shareText: state.shareText,
    guessedWords,
    guessesHistory: state.guessesHistory || [],
    ...(error ? { error } : {}),
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

export interface DailyEmailDispatchResult {
  total: number
  sent: number
  failed: number
  recipients: string[]
  errors: Record<string, string>
}

/**
 * Dispatches today's puzzle email to all active subscribers and configured test emails.
 * Triggered automatically by Cloudflare Workers Scheduled Cron (9:00 AM PST) or via admin API.
 */
export async function sendDailyPuzzleEmails(
  env?: Partial<Bindings>,
  options?: {
    dateStr?: string
    targetEmails?: string[]
    isDryRun?: boolean
  }
): Promise<DailyEmailDispatchResult> {
  const puzzle = getDailyPuzzle(options?.dateStr)
  const prodOrigin = (env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const authSecret = env?.AUTH_SECRET || process.env.AUTH_SECRET

  // 1. Determine recipients
  let recipients: string[] = []
  if (options?.targetEmails && options.targetEmails.length > 0) {
    recipients = options.targetEmails
  } else {
    // Collect active subscribers from KV
    const subscribers = await getSubscribers(env?.GAME_STATE_KV)
    const activeSubscribers = subscribers
      .filter(s => s.status === 'active')
      .map(s => s.email.toLowerCase().trim())

    // Collect configured test emails from env or process.env
    const rawTestEmails = env?.TEST_EMAILS || env?.TEST_EMAIL || process.env.TEST_EMAILS || process.env.TEST_EMAIL
    const testEmails = rawTestEmails
      ? rawTestEmails.split(/[,;\s]+/).map(e => e.toLowerCase().trim()).filter(Boolean)
      : []

    recipients = Array.from(new Set([...activeSubscribers, ...testEmails]))

    // If still no recipients found, fallback to ekim0252@gmail.com
    if (recipients.length === 0) {
      recipients = ['ekim0252@gmail.com']
    }
  }

  // Deduplicate and filter empty
  recipients = Array.from(new Set(recipients.map(e => e.toLowerCase().trim()))).filter(Boolean)

  console.log(`[Daily Cron] Dispatching Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)}) to ${recipients.length} recipient(s): ${recipients.join(', ')}`)

  const errors: Record<string, string> = {}
  let sent = 0
  let failed = 0

  for (const email of recipients) {
    try {
      if (options?.isDryRun) {
        console.log(`[Daily Cron] [DRY RUN] Would send to ${email}`)
        sent++
        continue
      }

      const emailContent = await buildPuzzleEmailContent(
        env?.GAME_STATE_KV,
        email,
        options?.dateStr,
        prodOrigin,
        authSecret
      )

      const res = await sendMailgunEmail({
        apiKey: env?.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY,
        domain: env?.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || 'inboxed.fun',
        from: env?.SENDER_EMAIL || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>',
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

      if (res.ok) {
        sent++
        console.log(`[Daily Cron] Successfully sent to ${email} (ID: ${res.id})`)
      } else {
        failed++
        errors[email] = res.error || 'Unknown error'
        console.error(`[Daily Cron] Failed to send to ${email}: ${res.error}`)
      }
    } catch (err: any) {
      failed++
      errors[email] = err?.message || String(err)
      console.error(`[Daily Cron] Exception sending to ${email}:`, err)
    }
  }

  console.log(`[Daily Cron] Finished dispatch. ${sent} sent, ${failed} failed.`)
  return { total: recipients.length, sent, failed, recipients, errors }
}

// Cloudflare Worker export supporting fetch & scheduled 9:00 AM PST Cron Handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log(`[Cloudflare Cron] Executing daily 9:00 AM PST Cron Dispatch at ${event.scheduledTime} (cron: "${event.cron}")`)
    await sendDailyPuzzleEmails(env)
  }
}
