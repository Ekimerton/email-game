import { describe, it, expect } from 'vitest'
import { getDailyPuzzle, PUZZLES, formatPrettyDate } from '../src/puzzles'

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

  it('should format YYYY-MM-DD date strings into pretty dates', () => {
    expect(formatPrettyDate('2026-08-08')).toBe('Aug 8, 2026')
    expect(formatPrettyDate('2026-08-05')).toBe('Aug 5, 2026')
    expect(formatPrettyDate('2026-01-15')).toBe('Jan 15, 2026')
    expect(formatPrettyDate('2026-12-31')).toBe('Dec 31, 2026')
  })
})

