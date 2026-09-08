import { describe, it, expect, vi } from 'vitest'
import { updatePuzzlesTsContent, backfillPuzzleArray } from '../scripts/helpers/backfillSynonyms'

describe('backfillSynonyms Helper Script', () => {
  describe('updatePuzzlesTsContent', () => {
    it('should accurately replace the PUZZLES array in TypeScript source while preserving other code', () => {
      const mockSource = `export interface DailyPuzzle {
  id: string
  date: string
  word: string
  definitions: string[]
  synonyms?: string[]
}

export const PUZZLES: DailyPuzzle[] = [
  {
    "id": "1",
    "date": "2026-08-17",
    "word": "LOAD",
    "definitions": ["Def 1"]
  }
]

export function getTodayDateString(): string {
  return '2026-08-17'
}
`
      const updatedPuzzles = [
        {
          id: '1',
          date: '2026-08-17',
          word: 'LOAD',
          synonyms: ['burden', 'cargo'],
          definitions: ['Def 1']
        }
      ]

      const result = updatePuzzlesTsContent(mockSource, updatedPuzzles)
      expect(result).toContain('export interface DailyPuzzle {')
      expect(result).toContain('export function getTodayDateString(): string {')
      expect(result).toContain('"synonyms": [\n      "burden",\n      "cargo"\n    ]')
      expect(result).toContain('"LOAD"')
    })

    it('should throw error if marker is missing', () => {
      expect(() => updatePuzzlesTsContent('const OTHER = []', [])).toThrow(
        'Could not find "export const PUZZLES: DailyPuzzle[] = "'
      )
    })
  })

  describe('backfillPuzzleArray', () => {
    it('should skip puzzles that already have synonyms unless force is specified', async () => {
      const puzzles = [
        { word: 'WOUND', synonyms: ['injury', 'hurt'] },
        { word: 'GAIN', synonyms: ['profit'] }
      ]

      const { puzzles: updated, updatedCount, skippedCount } = await backfillPuzzleArray(puzzles, {
        force: false,
        delayMs: 0
      })

      expect(skippedCount).toBe(2)
      expect(updatedCount).toBe(0)
      expect(updated[0].synonyms).toEqual(['injury', 'hurt'])
    })

    it('should respect the limit option', async () => {
      const puzzles = [
        { word: 'WOUND', synonyms: ['injury'] },
        { word: 'GAIN', synonyms: [] },
        { word: 'SILENT' }
      ]

      const { skippedCount } = await backfillPuzzleArray(puzzles, {
        force: false,
        limit: 1,
        delayMs: 0
      })

      expect(skippedCount).toBe(1)
    })
  })
})
