import { Hono } from 'hono'
import { OAuth2Client } from 'google-auth-library'
import { DailyPuzzle } from './puzzles'
import { getDailyPuzzle, formatPrettyDate } from './puzzleLogic'
import { EMAIL_HTML } from './emailHtml'
import { generateAccountToken, verifyAccountToken, getAccountUrl, extractEmailDomain, generateConfirmationToken, verifyConfirmationToken } from './auth'
import { GAME_MESSAGES } from './gameMessages'
import { sendMailgunEmail, renderConfirmationEmailHtml, renderConfirmationEmailText } from './emailService'

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
  return 188
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
}): string {
  const { email, domain, coworkerCount, playerCount = 0, playUrl } = options
  const puzzle = getDailyPuzzle()

  // Use clean public URL without raw query string email parameters to pass Gmail security filters
  const cleanPlayUrl = playUrl.split('?')[0]
  const accountUrl = options.accountUrl || getAccountUrl(email, cleanPlayUrl)
  const safeEmail = escapeHtml(email)
  const safeDomain = escapeHtml(domain)
  const safePlayUrl = escapeHtml(cleanPlayUrl)
  const safeAccountUrl = escapeHtml(accountUrl)
  const communityMessage = COMMON_EMAIL_DOMAINS.has(domain.toLowerCase())
    ? `Join ${playerCount} players playing the game today.`
    : `Join ${coworkerCount} coworkers playing in the ${safeDomain} org.`

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed #${puzzle.id} - Daily Word Puzzle</title>
  <style>
    .logo-container {
      text-align: center;
      margin: 0 0 24px;
    }
    .logo-tiles {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 0;
      white-space: nowrap;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      font-size: 15px;
      font-weight: 800;
      border-radius: 4px;
      border: 1.5px solid #18181b;
      color: #18181b;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
      box-sizing: border-box;
      margin-right: -4px;
      position: relative;
    }
    .logo-tile:last-child {
      margin-right: 0;
    }
    .rotate-neg {
      background-color: #D8FFC5;
      transform: rotate(-8deg);
      -webkit-transform: rotate(-8deg);
    }
    .rotate-pos {
      background-color: #C4F7CA;
      transform: rotate(8deg);
      -webkit-transform: rotate(8deg);
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #18181b;">
  <div style="max-width: 480px; margin: 0 auto; padding: 12px 8px;">
    <div style="background-color: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 12px; padding: 16px 16px; box-sizing: border-box;">
      <div class="logo-container" style="text-align: center; margin: 0 0 24px;" aria-label="INBOXED">
        <div class="logo-tiles" style="display: inline-flex; align-items: center; justify-content: center; padding: 4px 0; white-space: nowrap;">
          <span class="logo-tile rotate-neg" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #D8FFC5; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(-8deg); -webkit-transform: rotate(-8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">I</span>
          <span class="logo-tile rotate-pos" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #C4F7CA; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(8deg); -webkit-transform: rotate(8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">N</span>
          <span class="logo-tile rotate-neg" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #D8FFC5; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(-8deg); -webkit-transform: rotate(-8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">B</span>
          <span class="logo-tile rotate-pos" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #C4F7CA; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(8deg); -webkit-transform: rotate(8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">O</span>
          <span class="logo-tile rotate-neg" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #D8FFC5; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(-8deg); -webkit-transform: rotate(-8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">X</span>
          <span class="logo-tile rotate-pos" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #C4F7CA; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(8deg); -webkit-transform: rotate(8deg); margin-right: -4px; box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">E</span>
          <span class="logo-tile rotate-neg" style="display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; text-align: center; background-color: #D8FFC5; color: #18181b; border: 1.5px solid #18181b; font-size: 15px; font-weight: 800; border-radius: 4px; transform: rotate(-8deg); -webkit-transform: rotate(-8deg); box-shadow: 0 1px 3px rgba(0,0,0,0.25); box-sizing: border-box; position: relative;">D</span>
        </div>
      </div>

      <div style="padding: 4px 0 16px; text-align: left;">
        <p style="font-size: 15px; font-weight: 600; line-height: 1.55; color: #27272a; margin: 0;">
          <strong style="color: #18181b;">${safeEmail}</strong> is inviting you to play Inboxed, the daily word game in your inbox. ${communityMessage}
        </p>
        <a href="${safePlayUrl}" style="display: block; color: #14532d; font-size: 14px; font-weight: 800; margin-top: 16px; text-align: center; text-decoration: underline;">Sign up to play →</a>
      </div>

      <div style="border-top: 1px solid #e4e4e7;"></div>
      <div style="padding: 14px 0 2px; text-align: left; font-size: 12px; line-height: 1.5; color: #71717a;">
        <strong style="color: #52525b;">Seeing this while trying to load the game?</strong><br>
        <p style="margin: 6px 0 0;">Your email client might not be supported. This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.</p>
        <p style="margin: 4px 0 0;">You can <a href="${safeAccountUrl}" style="color: #14532d; font-weight: 700; text-decoration: underline;">update your account preferences</a>.</p>
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
      border-color: #14532d;
      box-shadow: 0 0 0 3px rgba(20, 83, 45, 0.12);
    }
    .btn-submit {
      width: 100%;
      padding: 13px 18px;
      background-color: #14532d;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .btn-submit:hover {
      background-color: #166534;
    }
    .btn-submit:active {
      transform: scale(0.99);
    }
    .btn-submit:disabled {
      background-color: #a1a1aa;
      cursor: not-allowed;
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
              Get Daily Puzzles Free
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
            btn.textContent = 'Get Daily Puzzles Free';
          }
        } catch (err) {
          msg.textContent = 'Something went wrong. Please check your connection.';
          msg.className = 'status-msg status-error';
          msg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Get Daily Puzzles Free';
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
    .success-card {
      background: #f0fdf4;
      border: 1.5px solid #bbf7d0;
      border-radius: 12px;
      padding: 24px 20px;
      text-align: center;
      margin-bottom: 20px;
    }
    .success-icon {
      font-size: 36px;
      margin-bottom: 10px;
    }
    .success-title {
      font-size: 20px;
      font-weight: 800;
      color: #14532d;
      margin-bottom: 8px;
    }
    .schedule-notice {
      font-size: 15px;
      font-weight: 600;
      color: #166534;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .action-box {
      background: #ffffff;
      border: 1px solid #bbf7d0;
      border-radius: 10px;
      padding: 18px 16px;
      margin-top: 16px;
    }
    .action-box p {
      font-size: 13.5px;
      color: #374151;
      margin-bottom: 14px;
      line-height: 1.45;
    }
    .btn-submit {
      width: 100%;
      padding: 13px 18px;
      background-color: #14532d;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 15px;
      font-weight: 700;
      cursor: pointer;
      transition: background-color 0.15s ease, transform 0.1s ease;
    }
    .btn-submit:hover {
      background-color: #166534;
    }
    .btn-submit:active {
      transform: scale(0.99);
    }
    .btn-submit:disabled {
      background-color: #a1a1aa;
      cursor: not-allowed;
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

    <div class="success-card">
      <div class="success-icon">🎉</div>
      <h1 class="success-title">You're Subscribed!</h1>
      <p class="schedule-notice">
        You'll get emails at 9am PST every day.
      </p>

      <div class="action-box">
        <p>
          Want to play today's game right now? Receive today's puzzle (<strong>#${puzzle.id}</strong>) in your inbox immediately:
        </p>
        <button id="send-today-btn" class="btn-submit">
          Receive Today's Puzzle Now
        </button>
        <div id="status-msg" class="status-msg" style="display: none;"></div>
      </div>
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
    .card {
      background: #fef2f2;
      border: 1.5px solid #fecaca;
      border-radius: 12px;
      padding: 24px 20px;
      text-align: center;
    }
    .icon {
      font-size: 36px;
      margin-bottom: 10px;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #991b1b;
      margin-bottom: 8px;
    }
    p {
      font-size: 14px;
      color: #7f1d1d;
      line-height: 1.5;
      margin-bottom: 20px;
    }
    .btn {
      display: inline-block;
      padding: 12px 24px;
      background-color: #14532d;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-size: 14px;
      font-weight: 700;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="icon">⚠️</div>
      <h1>Link Expired or Invalid</h1>
      <p>
        This confirmation link is invalid or has expired. Please enter your email on the homepage to request a new link.
      </p>
      <a href="/" class="btn">Back to Home</a>
    </div>
  </div>
</body>
</html>`
}

// Helper to build full AMP + Fallback HTML content for daily puzzle emails
export async function buildPuzzleEmailContent(
  kv: KVNamespace | undefined,
  userEmail: string,
  dateParam?: string,
  currentOrigin?: string,
  authSecret?: string
): Promise<{ ampHtml: string; fallbackHtml: string; subject: string; text: string; puzzle: DailyPuzzle }> {
  const { state, puzzle } = await getOrCreateGameState(kv, userEmail, dateParam)
  const domain = extractDomain(userEmail)
  const secret = authSecret || process.env.AUTH_SECRET
  const userToken = generateAccountToken(userEmail, secret)
  const origin = (currentOrigin || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')

  const encodedEmail = encodeURIComponent(userEmail)
  const encodedDomain = encodeURIComponent(domain)

  let ampHtml = EMAIL_HTML
    .replaceAll('https://inboxed.fun', origin)
    .replaceAll('USER_EMAIL_PLACEHOLDER', encodedEmail)
    .replaceAll('USER_DOMAIN_PLACEHOLDER', encodedDomain)
    .replaceAll('USER_DATE_PLACEHOLDER', puzzle.date)
    .replaceAll('default-dev-token', userToken)

  const dynamicStateListHeight = calculateStateListHeight(puzzle)
  ampHtml = ampHtml.replace('height="188"', `height="${dynamicStateListHeight}"`)
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

  const profile = await recordUserActivity(kv, userEmail, puzzle.date)
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
  })

  const subject = `Inboxed #${puzzle.id} - ${formatPrettyDate(puzzle.date)}`
  const text = `Play today's Inboxed puzzle (#${puzzle.id}): ${origin}/?email=${encodedEmail}`

  return { ampHtml, fallbackHtml, subject, text, puzzle }
}

// Serve AMP HTML preview page helper
async function renderAmpGame(c: any) {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
  const forceHttps = c.req.query('forceHttps') === 'true'
  const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
  const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

  const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret)
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

// Explicit Email Signup Landing Page route
app.get('/signup', async (c) => {
  return c.html(getSignupHtml(c))
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

// Serve non-AMP Fallback HTML with personalized engagement stats & CTA
app.get('/fallback', async (c) => {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const puzzle = getDailyPuzzle(dateParam)
  const domain = extractDomain(userEmail)
  const profile = await recordUserActivity(c.env?.GAME_STATE_KV, userEmail, puzzle.date)
  const coworkerCount = await getCoworkerCount(c.env?.GAME_STATE_KV, domain, userEmail)
  const playerCount = await getPlayerCount(c.env?.GAME_STATE_KV)

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
      padding: 24px 12px;
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .card-container {
      width: 100%;
      max-width: 480px;
      background: #f4f4f5;
      border: 1px solid #e4e4e7;
      border-radius: 12px;
      padding: 20px 18px;
      box-sizing: border-box;
      position: relative;
    }
    .game-badge {
      display: inline-block;
      background-color: #14532d;
      border-radius: 4px;
      color: #ffffff;
      font-size: 14px;
      font-weight: 800;
      letter-spacing: -0.5px;
      padding: 4px 10px;
      text-transform: uppercase;
    }
    .header { margin-top: 12px; margin-bottom: 14px; text-align: left; }
    .title {
      font-size: 18px;
      font-weight: 800;
      color: #18181b;
      letter-spacing: -0.3px;
    }
    .user-badge {
      display: flex;
      align-items: center;
      justify-content: space-between;
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 6px;
      padding: 8px 12px;
      margin-top: 12px;
      font-size: 13px;
      font-weight: 600;
      color: #18181b;
    }
    .domain-pill {
      background: #14532d;
      color: #ffffff;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 700;
      text-transform: lowercase;
    }
    .setting-card {
      background: #ffffff;
      border: 1px solid #e4e4e7;
      border-radius: 8px;
      padding: 14px 16px;
      margin-bottom: 10px;
      box-sizing: border-box;
    }
    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .setting-title { font-size: 14px; font-weight: 700; color: #18181b; }
    .setting-desc { font-size: 12px; color: #71717a; line-height: 1.45; margin-top: 4px; }
    
    /* Modern iOS Style Switch Toggle with AMP Forest Green Theme */
    .switch-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 12px;
      padding-top: 10px;
      border-top: 1px solid #f4f4f5;
    }
    .switch-label { font-size: 12px; font-weight: 700; }
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
      background-color: #d4d4d8;
      transition: .25s ease;
      border-radius: 24px;
    }
    .slider:before {
      position: absolute;
      content: "";
      height: 18px;
      width: 18px;
      left: 3px;
      bottom: 3px;
      background-color: white;
      transition: .25s ease;
      border-radius: 50%;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.15);
    }
    input:checked + .slider { background-color: #14532d; }
    input:checked + .slider:before { transform: translateX(20px); }
    
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
      border-top: 1px solid #e4e4e7;
      margin-top: 16px;
      padding-top: 12px;
      text-align: center;
      font-size: 11px;
      color: #71717a;
    }
    .footer-text a {
      color: #14532d;
      font-weight: 700;
      text-decoration: underline;
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
          <div className="card-container" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '14px', color: '#71717a', fontSize: '13px', fontWeight: 600 }}>Loading account preferences...</p>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="card-container" style={{ textAlign: 'left', padding: '20px 18px' }}>
            <div style={{ margin: '0 0 12px' }}>
              <span className="game-badge">INBOXED</span>
            </div>
            <div style={{ padding: '4px 0 8px' }}>
              <h2 style={{ color: '#b91c1c', fontSize: '16px', fontWeight: 800, marginBottom: '6px' }}>Invalid or Expired Link</h2>
              <p style={{ color: '#52525b', fontSize: '13px', lineHeight: 1.5 }}>
                This account link is invalid, tampered with, or expired.<br />
                Please click the <strong>update your account preferences</strong> link directly from your daily Inboxed email to access and manage your settings.
              </p>
            </div>
          </div>
        );
      }

      return (
        <div className="card-container">
          {toast && <div className="toast">{toast}</div>}

          <div style={{ textAlign: 'left', margin: '0 0 12px' }}>
            <span className="game-badge">INBOXED</span>
          </div>

          <div className="header">
            <div className="title">Account &amp; Preferences</div>
            <div className="user-badge">
              <span>{user.email}</span>
              <span className="domain-pill">{user.domain}</span>
            </div>
          </div>

          {/* Daily Morning Subscription Switch */}
          <div className="setting-card">
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

          {/* Leaderboard Privacy Switch */}
          <div className="setting-card">
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

  return c.html(reactAppHtml)
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

    console.log(`[Cron Dispatch] Ready to dispatch Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)}) to ${activeSubscribers.length} active subscribers.`)
  }
}
