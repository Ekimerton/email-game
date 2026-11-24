import { describe, it, expect } from 'vitest'
import { PUZZLES, getDailyPuzzle, getDateForPuzzleId, formatPrettyDate, getTodayDateString, getPuzzleDateForSendCron } from '../src/game'
import {
  definitionMentionsWordOrStem,
  areDefinitionsTooSimilar,
  getWordStemsAndVariants,
  isSynonymValid,
  filterSynonyms,
  fetchSynonymsForWord
} from '../scripts/helpers/generatePuzzles'

describe('Daily Puzzles Module', () => {
  it('should contain at least 50 valid puzzles in predefined list', () => {
    expect(PUZZLES.length).toBeGreaterThanOrEqual(50)

    const ids = new Set<string>()
    const dates = new Set<string>()

    for (let i = 0; i < PUZZLES.length; i++) {
      const puzzle = PUZZLES[i]
      expect(puzzle.id).toBe(String(i + 1))
      expect(puzzle.word).toBeDefined()
      expect(puzzle.word).toBe(puzzle.word.toUpperCase())
      expect(puzzle.word.length).toBeGreaterThanOrEqual(4)
      expect(puzzle.definitions.length).toBeGreaterThanOrEqual(4)
      expect(puzzle.definitions.length).toBeLessThanOrEqual(5)

      // Ensure unique IDs and sequential dates
      expect(ids.has(puzzle.id)).toBe(false)
      expect(dates.has(puzzle.date)).toBe(false)
      ids.add(puzzle.id)
      dates.add(puzzle.date)
    }
  })

  it('should ensure all definitions are concise (<= 120 characters)', () => {
    for (const puzzle of PUZZLES) {
      for (const def of puzzle.definitions) {
        expect(
          def.length,
          `Definition too long (${def.length} chars) for "${puzzle.word}": "${def}"`
        ).toBeLessThanOrEqual(120)
        expect(def.length).toBeGreaterThanOrEqual(12)
      }
    }
  })

  it('should not have any definition containing the target word or its stem/inflections', () => {
    for (const puzzle of PUZZLES) {
      for (const def of puzzle.definitions) {
        const mentions = definitionMentionsWordOrStem(def, puzzle.word)
        expect(
          mentions,
          `Puzzle word "${puzzle.word}" is mentioned or leaked in definition: "${def}"`
        ).toBe(false)
      }
    }
  })

  it('should not contain duplicate or near-duplicate definitions within any puzzle', () => {
    for (const puzzle of PUZZLES) {
      for (let i = 0; i < puzzle.definitions.length; i++) {
        for (let j = i + 1; j < puzzle.definitions.length; j++) {
          const isTooSimilar = areDefinitionsTooSimilar(
            puzzle.definitions[i],
            puzzle.definitions[j]
          )
          expect(
            isTooSimilar,
            `Definitions too similar in puzzle "${puzzle.word}":\n  1. "${puzzle.definitions[i]}"\n  2. "${puzzle.definitions[j]}"`
          ).toBe(false)
        }
      }
    }
  })

  it('should return predefined puzzle for a known date', () => {
    const puzzle = getDailyPuzzle('2026-08-17')
    expect(puzzle.id).toBe('1')
    expect(puzzle.word).toBe(PUZZLES[0].word)
  })

  it('should return predefined puzzle when queried by puzzle ID or number', () => {
    const puzzleNum = getDailyPuzzle(1)
    expect(puzzleNum.id).toBe('1')
    expect(puzzleNum.word).toBe(PUZZLES[0].word)

    const puzzleStr = getDailyPuzzle('1')
    expect(puzzleStr.id).toBe('1')
    expect(puzzleStr.word).toBe(PUZZLES[0].word)

    const puzzleHash = getDailyPuzzle('#1')
    expect(puzzleHash.id).toBe('1')
    expect(puzzleHash.word).toBe(PUZZLES[0].word)

    const puzzleSecond = getDailyPuzzle(2)
    expect(puzzleSecond.id).toBe('2')
    expect(puzzleSecond.word).toBe(PUZZLES[1].word)
  })

  it('should return today\'s puzzle based on send cron switchover time (5 min before 15:00 UTC)', () => {
    const cronDate = getPuzzleDateForSendCron()
    const puzzle = getDailyPuzzle()
    expect(puzzle.date).toBe(cronDate)
  })

  it('should format today\'s date for a given timezone via getTodayDateString', () => {
    const estDate = getTodayDateString('America/New_York')
    expect(estDate).toMatch(/^\d{4}-\d{2}-\d{2}$/)
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
    expect(formatPrettyDate('2026-09-13')).toBe('Sept 13, 2026')
    expect(formatPrettyDate('2026-01-15')).toBe('Jan 15, 2026')
    expect(formatPrettyDate('2026-12-31')).toBe('Dec 31, 2026')
  })

  it('should switch to weekdays-only puzzle schedule starting Sat 2026-11-28 without shifting #1-#61', () => {
    // Friday 2026-11-27 is Puzzle #61
    const fri = getDailyPuzzle('2026-11-27')
    expect(fri.id).toBe('61')
    expect(fri.date).toBe('2026-11-27')
    expect(getDateForPuzzleId(61)).toBe('2026-11-27')

    // Sat 2026-11-28 & Sun 2026-11-29 roll back to Friday's Puzzle #61
    const sat = getDailyPuzzle('2026-11-28')
    expect(sat.id).toBe('61')
    expect(sat.date).toBe('2026-11-27')
    const sun = getDailyPuzzle('2026-11-29')
    expect(sun.id).toBe('61')
    expect(sun.date).toBe('2026-11-27')

    // Cron date also rolls Sat/Sun back to Friday
    expect(getPuzzleDateForSendCron(new Date('2026-11-28T15:00:00Z'))).toBe('2026-11-27')
    expect(getPuzzleDateForSendCron(new Date('2026-11-29T15:00:00Z'))).toBe('2026-11-27')

    // Monday 2026-11-30 advances sequentially to Puzzle #62
    const mon = getDailyPuzzle('2026-11-30')
    expect(mon.id).toBe('62')
    expect(mon.date).toBe('2026-11-30')
    expect(getDateForPuzzleId(62)).toBe('2026-11-30')

    // Following Friday 2026-12-04 -> #66, Sat 2026-12-05 -> #66, Mon 2026-12-07 -> #67
    expect(getDailyPuzzle('2026-12-04').id).toBe('66')
    expect(getDailyPuzzle('2026-12-05').id).toBe('66')
    expect(getDailyPuzzle('2026-12-07').id).toBe('67')
    expect(getDateForPuzzleId(67)).toBe('2026-12-07')
  })
})

describe('Puzzle Generation Leak & Similarity Detection Unit Tests', () => {
  it('should detect direct word mentions and inflections', () => {
    expect(definitionMentionsWordOrStem('To acquire gain through work.', 'GAIN')).toBe(true)
    expect(definitionMentionsWordOrStem('The act of gaining something.', 'GAIN')).toBe(true)
    expect(definitionMentionsWordOrStem('What was gained in the transaction.', 'GAIN')).toBe(true)
    expect(definitionMentionsWordOrStem('To sort text into paragraphs.', 'PARAGRAPH')).toBe(true)
    expect(definitionMentionsWordOrStem('Covered in blood from the fight.', 'BLOODY')).toBe(true)
    expect(definitionMentionsWordOrStem('An island located away from shore.', 'OFFSHORE')).toBe(true)
    expect(definitionMentionsWordOrStem('A person to whom property is committed in trust.', 'TRUSTEE')).toBe(true)
    expect(definitionMentionsWordOrStem('A time of silence.', 'SILENT')).toBe(true)
  })

  it('should allow legitimate clean definitions that do not mention the word', () => {
    expect(definitionMentionsWordOrStem('A visible impression on a surface.', 'PRINT')).toBe(false)
    expect(definitionMentionsWordOrStem('To transform or change into another form.', 'CONVERT')).toBe(false)
    expect(definitionMentionsWordOrStem('A burden; a weight to be carried.', 'LOAD')).toBe(false)
    expect(definitionMentionsWordOrStem('An optical or other graphic representation.', 'IMAGE')).toBe(false)
  })

  it('should detect near-duplicate definitions', () => {
    const def1 = 'An injury to a person by which the skin is divided.'
    const def2 = 'An injury, such as a cut or tear, to the skin.'
    expect(areDefinitionsTooSimilar(def1, def2)).toBe(true)

    const defDistinct1 = 'To fill a firearm with munition.'
    const defDistinct2 = 'A burden; a weight to be carried.'
    expect(areDefinitionsTooSimilar(defDistinct1, defDistinct2)).toBe(false)
  })
})

describe('Synonym Validation and Filtering Unit Tests', () => {
  it('should accept valid clean synonyms', () => {
    expect(isSynonymValid('injury', 'WOUND')).toBe(true)
    expect(isSynonymValid('hurt', 'WOUND')).toBe(true)
    expect(isSynonymValid('damage', 'WOUND')).toBe(true)
    expect(isSynonymValid('profit', 'GAIN')).toBe(true)
    expect(isSynonymValid('advance', 'GAIN')).toBe(true)
    expect(isSynonymValid('quiet', 'SILENT')).toBe(true)
    expect(isSynonymValid('speechless', 'SILENT')).toBe(true)
  })

  it('should reject exact match with target word', () => {
    expect(isSynonymValid('wound', 'WOUND')).toBe(false)
    expect(isSynonymValid('WOUND', 'WOUND')).toBe(false)
    expect(isSynonymValid('gain', 'GAIN')).toBe(false)
  })

  it('should reject inflections and stem derivations of target word', () => {
    expect(isSynonymValid('wounds', 'WOUND')).toBe(false)
    expect(isSynonymValid('wounding', 'WOUND')).toBe(false)
    expect(isSynonymValid('wounded', 'WOUND')).toBe(false)
    expect(isSynonymValid('gains', 'GAIN')).toBe(false)
    expect(isSynonymValid('gaining', 'GAIN')).toBe(false)
    expect(isSynonymValid('gained', 'GAIN')).toBe(false)
    expect(isSynonymValid('gainful', 'GAIN')).toBe(false)
    expect(isSynonymValid('regain', 'GAIN')).toBe(false)
    expect(isSynonymValid('silence', 'SILENT')).toBe(false)
    expect(isSynonymValid('silently', 'SILENT')).toBe(false)
    expect(isSynonymValid('bloodying', 'BLOODY')).toBe(false)
  })

  it('should reject invalid formats (multi-word phrases, non-alphabetic characters, out of range lengths)', () => {
    expect(isSynonymValid('cut open', 'WOUND')).toBe(false)
    expect(isSynonymValid('hit-and-run', 'WOUND')).toBe(false)
    expect(isSynonymValid('wound123', 'WOUND')).toBe(false)
    expect(isSynonymValid('w', 'WOUND')).toBe(false)
    expect(isSynonymValid('ab', 'WOUND')).toBe(false)
    expect(isSynonymValid('a'.repeat(25), 'WOUND')).toBe(false)
    expect(isSynonymValid('', 'WOUND')).toBe(false)
  })

  it('should filter, deduplicate, normalize and limit raw synonyms', () => {
    const raw = [
      'injury',
      'INJURY',
      'hurt',
      'wounding',
      'wound',
      'laceration',
      'trauma',
      'cut',
      'bruise',
      'lesion',
      'damage',
      'harm'
    ]

    const filtered = filterSynonyms(raw, 'WOUND', 5)
    expect(filtered).toEqual(['injury', 'hurt', 'laceration', 'trauma', 'cut'])
    expect(filtered.length).toBe(5)
    expect(filtered.includes('wounding')).toBe(false)
    expect(filtered.includes('wound')).toBe(false)
  })

  it('should handle zero or few synonyms gracefully as secondary clues', () => {
    expect(filterSynonyms([], 'WORD')).toEqual([])
    expect(filterSynonyms(['word', 'words', 'wording'], 'WORD')).toEqual([])
    expect(filterSynonyms(['single'], 'WORD')).toEqual(['single'])
  })
})

