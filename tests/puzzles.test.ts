import { describe, it, expect } from 'vitest'
import { getDailyPuzzle, PUZZLES } from '../src/puzzles'

describe('Daily Puzzles Module', () => {
  it('should contain valid puzzles in predefined list', () => {
    expect(PUZZLES.length).toBeGreaterThan(0)
    for (const puzzle of PUZZLES) {
      expect(puzzle.id).toBeDefined()
      expect(puzzle.word).toBeDefined()
      expect(puzzle.word).toBe(puzzle.word.toUpperCase())
      expect(puzzle.definitions.length).toBeGreaterThan(0)
    }
  })

  it('should return predefined puzzle for a known date', () => {
    const puzzle = getDailyPuzzle('2026-08-01')
    expect(puzzle.word).toBe('CURRENT')
  })

  it('should fallback deterministically for an unknown future date', () => {
    const puzzle1 = getDailyPuzzle('2030-01-01')
    const puzzle2 = getDailyPuzzle('2030-01-01')

    expect(puzzle1.date).toBe('2030-01-01')
    expect(puzzle1.word).toBe(puzzle2.word)
  })
})
