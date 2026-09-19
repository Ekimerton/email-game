import { DailyPuzzle } from './puzzles'
import { LetterStatus, GameState } from './types'

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

// Helper to build standardized state payload for AMP list
export function buildStatePayload(state: GameState, puzzle: DailyPuzzle, error?: string) {
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
