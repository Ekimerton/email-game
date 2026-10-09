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
  playedPuzzles?: string[]
  submittedPuzzles?: string[]
  theme?: EmailTheme
  colorCombo?: string
  primaryColor?: string
  secondaryColor?: string
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
  version?: number
  updatedAt?: string
}

export type Bindings = {
  DB?: D1Database
  GAME_STATE_KV?: KVNamespace
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
  SEND_CRON?: string
}

export type StorageBackend =
  | D1Database
  | KVNamespace
  | Bindings
  | { DB?: D1Database; GAME_STATE_KV?: KVNamespace; db?: D1Database; kv?: KVNamespace }
  | undefined


export interface DailyEmailDispatchResult {
  total: number
  sent: number
  failed: number
  recipients: string[]
  errors: Record<string, string>
  puzzleDate?: string
  puzzleId?: string
  unsubscribedDueToInactivity?: string[]
}

