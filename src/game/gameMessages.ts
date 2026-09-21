/**
 * gameMessages.ts
 *
 * Centralized constants and message generator functions for in-game
 * feedback banner messages (state.lastMessage).
 */

export const MSG_INITIAL_PROMPT = (wordLength: number): string =>
  `Guess the ${wordLength}-letter word! Definition #1 revealed.`

export const MSG_INVALID_LENGTH = (wordLength: number): string =>
  `Please enter a ${wordLength}-letter word.`

export const MSG_ALREADY_GUESSED = (guess: string): string =>
  `You already guessed "${guess}".`

export const MSG_INCORRECT_GUESS = (guess: string): string => {
  return `"${guess}" is incorrect. -100 points`
}

export const MSG_SYNONYM_GUESS = (guess: string): string => {
  return `"${guess}" is a synonym! -25 pts`
}

export const MSG_ALL_LETTERS_REVEALED = 'All letters have already been revealed!'

export const MSG_HINT_REVEALED = (position: number, letter: string): string =>
  `Revealed letter #${position}: "${letter}"! -150 points`

export const MSG_PUZZLE_SOLVED = (word: string, guessCount: number, score: number): string =>
  `Solved "${word}" in ${guessCount} guess${guessCount > 1 ? 'es' : ''}! ${score} pts`

export const GAME_MESSAGES = {
  initialPrompt: MSG_INITIAL_PROMPT,
  invalidLength: MSG_INVALID_LENGTH,
  alreadyGuessed: MSG_ALREADY_GUESSED,
  incorrectGuess: MSG_INCORRECT_GUESS,
  synonymGuess: MSG_SYNONYM_GUESS,
  allLettersRevealed: MSG_ALL_LETTERS_REVEALED,
  hintRevealed: MSG_HINT_REVEALED,
  puzzleSolved: MSG_PUZZLE_SOLVED,
} as const
