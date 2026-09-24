export type LetterStatus = 'correct' | 'present' | 'absent'

export type EmailTheme = 'light' | 'dark'

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

export type Bindings = {
  GAME_STATE_KV: KVNamespace
  AUTH_SECRET?: string
  MAILGUN_API_KEY?: string
  MAILGUN_DOMAIN?: string
  SENDER_EMAIL?: string
  PUBLIC_HTTPS_URL?: string
  ADMIN_SECRET?: string
  TEST_EMAILS?: string
  TEST_EMAIL?: string
  ENVIRONMENT?: string
  ASSETS?: any
}

export interface DailyEmailDispatchResult {
  total: number
  sent: number
  failed: number
  recipients: string[]
  errors: Record<string, string>
}
