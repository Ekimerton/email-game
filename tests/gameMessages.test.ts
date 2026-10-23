import { describe, it, expect } from 'vitest'
import {
  MSG_INITIAL_PROMPT,
  MSG_INVALID_LENGTH,
  MSG_ALREADY_GUESSED,
  MSG_INCORRECT_GUESS,
  MSG_SYNONYM_GUESS,
  MSG_ALL_LETTERS_REVEALED,
  MSG_HINT_REVEALED,
  MSG_PUZZLE_SOLVED,
  MSG_WIN_TITLE,
  GAME_MESSAGES,
} from '../src/game'

describe('Game Messages', () => {
  it('should format MSG_INITIAL_PROMPT correctly', () => {
    expect(MSG_INITIAL_PROMPT(5)).toBe('Guess the 5-letter word! Definition #1 revealed.')
    expect(GAME_MESSAGES.initialPrompt(4)).toBe('Guess the 4-letter word! Definition #1 revealed.')
  })

  it('should format MSG_INVALID_LENGTH correctly', () => {
    expect(MSG_INVALID_LENGTH(5)).toBe('Please enter a 5-letter word.')
    expect(GAME_MESSAGES.invalidLength(6)).toBe('Please enter a 6-letter word.')
  })

  it('should format MSG_ALREADY_GUESSED correctly', () => {
    expect(MSG_ALREADY_GUESSED('HELLO')).toBe('You already guessed "HELLO".')
    expect(GAME_MESSAGES.alreadyGuessed('WORLD')).toBe('You already guessed "WORLD".')
  })

  it('should format MSG_INCORRECT_GUESS correctly with -100 points', () => {
    expect(MSG_INCORRECT_GUESS('WRONG')).toBe('"WRONG" is incorrect. -100 points')
    expect(GAME_MESSAGES.incorrectGuess('TEST')).toBe('"TEST" is incorrect. -100 points')
  })

  it('should format MSG_SYNONYM_GUESS correctly with -25 pts', () => {
    expect(MSG_SYNONYM_GUESS('CARGO')).toBe('"CARGO" is a synonym! -25 pts')
    expect(GAME_MESSAGES.synonymGuess('FREIGHT')).toBe('"FREIGHT" is a synonym! -25 pts')
  })

  it('should format MSG_ALL_LETTERS_REVEALED correctly', () => {
    expect(MSG_ALL_LETTERS_REVEALED).toBe('All letters have already been revealed!')
    expect(GAME_MESSAGES.allLettersRevealed).toBe('All letters have already been revealed!')
  })

  it('should format MSG_HINT_REVEALED correctly with -150 points', () => {
    expect(MSG_HINT_REVEALED(1, 'L')).toBe('Revealed letter #1: "L"! -150 points')
    expect(GAME_MESSAGES.hintRevealed(3, 'A')).toBe('Revealed letter #3: "A"! -150 points')
  })

  it('should format MSG_PUZZLE_SOLVED correctly for single and multiple guesses', () => {
    expect(MSG_PUZZLE_SOLVED('LOAD', 1, 1000)).toBe("You got today's word in 1 guess!")
    expect(MSG_PUZZLE_SOLVED('LOAD', 3, 700)).toBe("You got today's word in 3 guesses!")
    expect(GAME_MESSAGES.puzzleSolved('APPLE', 2, 900)).toBe("You got today's word in 2 guesses!")
  })

  it('should format MSG_WIN_TITLE based on guess count', () => {
    expect(MSG_WIN_TITLE(1)).toBe('You killed it!')
    expect(MSG_WIN_TITLE(2)).toBe('You killed it!')
    expect(GAME_MESSAGES.winTitle(3)).toBe('Nicely done!')
    expect(GAME_MESSAGES.winTitle(4)).toBe('Nicely done!')
    expect(GAME_MESSAGES.winTitle(5)).toBe('Close one!')
  })
})
