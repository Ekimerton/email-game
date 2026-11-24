import { DailyPuzzle } from './puzzles'
import { getDailyPuzzle } from './puzzleLogic'
import { GAME_MESSAGES } from './gameMessages'
import { extractEmailDomain, kvGet, type StorageBackend } from '../core'
import type { LetterStatus, GameState } from '../core'

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character))
}

// Evaluate Wordle-style letter matches
export function evaluateGuess(target: string, guess: string): LetterStatus[] {
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
export function createInitialMask(targetWord: string): string[] {
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


export function getRedactedText(text: string): string {
  if (!text) return '••••••••••••••••••••'
  return text.replace(/[^\s]/g, '•')
}

export function buildShareText(
  state: GameState,
  puzzle: DailyPuzzle,
  streak?: number
): string {
  const targetWord = puzzle.word.toUpperCase()
  const symbols: string[] = []

  for (const g of state.guessesHistory || []) {
    if (g.guess.toUpperCase() === targetWord) continue
    symbols.push(isPuzzleSynonym(puzzle, g.guess) ? '🟨' : '⬜')
  }

  const expectedWrong = Math.max(0, (state.guessCount || 0) - 1)
  if (symbols.length < expectedWrong) {
    const missing = expectedWrong - symbols.length
    const knownSyns = symbols.filter(s => s === '🟨').length
    const extraSyns = Math.min(missing, Math.max(0, (state.synonymGuessesCount || 0) - knownSyns))
    for (let i = 0; i < extraSyns; i++) symbols.push('🟨')
    for (let i = extraSyns; i < missing; i++) symbols.push('⬜')
  }

  const hints = Math.max(0, state.hintsUsed || 0)
  for (let i = 0; i < hints; i++) {
    symbols.push('💡')
  }
  symbols.push('🟩')

  const trail = symbols.join('')
  const streakPart = streak && streak >= 2 ? ` 🔥${streak}` : ''
  return `Inboxed #${puzzle.id} ${trail} ${state.score}pts${streakPart} https://inboxed.fun`
}

// Helper to build standardized state payload for AMP list
export function buildStatePayload(state: GameState, puzzle: DailyPuzzle, error?: string, streak?: number) {
  const activeRevealedCount = state.hasWon ? puzzle.definitions.length : state.revealedCount
  const definitions = puzzle.definitions.map((def, i) => {
    const isRevealed = i < activeRevealedCount
    const isLatest = i === Math.max(0, activeRevealedCount - 1)
    const isFirst = i === 0
    return {
      num: i + 1,
      index: i,
      isRevealed,
      isLatest,
      isFirst,
      text: isRevealed ? def : getRedactedText(def),
    }
  })

  const guessedWords = state.guessedWords || (state.guessesHistory || []).map(g => g.guess)
  const winTitle = state.hasWon ? GAME_MESSAGES.winTitle(state.guessCount) : 'You killed it!'
  const lastMessage = state.hasWon
    ? GAME_MESSAGES.puzzleSolved(puzzle.word, state.guessCount, state.score)
    : state.lastMessage
  const shareText = state.hasWon
    ? (state.shareText && state.shareText.startsWith('Inboxed #')
        ? state.shareText
        : buildShareText(state, puzzle, streak))
    : (state.shareText || '')

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
    lastMessage,
    winTitle,
    shareText,
    guessedWords,
    guessesHistory: state.guessesHistory || [],
    version: state.version || 0,
    updatedAt: state.updatedAt,
    ...(error ? { error } : {}),
  }

  return { items: [statePayload], ...statePayload }
}

// Helper to initialize or retrieve game state for a user and puzzle/date
export async function getOrCreateGameState(
  kv: StorageBackend,
  userEmail: string,
  dateOrPuzzle?: string | number,
  options?: { isDev?: boolean }
): Promise<{ state: GameState; puzzle: DailyPuzzle; stateKey: string }> {
  const puzzle = getDailyPuzzle(dateOrPuzzle, options)
  const stateKey = `game:${puzzle.date}:${userEmail}`

  const stored = await kvGet(kv, stateKey)
  if (stored && (!stored.puzzleId || stored.puzzleId === puzzle.id)) {
    if (!Array.isArray(stored.letterMask)) {
      stored.letterMask = stored.hasWon ? puzzle.word.split('') : createInitialMask(puzzle.word)
    }
    if (!stored.guessesHistory) {
      stored.guessesHistory = []
    }
    if (!stored.guessedWords) {
      stored.guessedWords = stored.guessesHistory.map((g: any) => g.guess)
    }
    if (stored.synonymGuessesCount === undefined) {
      stored.synonymGuessesCount = 0
    }
    if (stored.version === undefined) {
      stored.version = 0
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
    version: 0,
    updatedAt: new Date().toISOString(),
  }

  return { state: initialState, puzzle, stateKey }
}
