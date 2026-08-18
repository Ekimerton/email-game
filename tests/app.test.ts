import { describe, it, expect } from 'vitest'
import { getDailyPuzzle } from '../src/puzzles'
import { getFallbackHtml } from '../src/index'

describe('Hono App & Layout Calculations', () => {
  it('should generate valid daily puzzle data for today', () => {
    const puzzle = getDailyPuzzle()
    expect(puzzle).toBeDefined()
    expect(puzzle.word.length).toBeGreaterThan(0)
    expect(puzzle.definitions.length).toBeGreaterThan(0)
  })

  it('should render rich fallback HTML with play link, domain badge, and clue teaser', () => {
    const html = getFallbackHtml({
      email: 'testuser@nvidia.engineering',
      domain: 'nvidia.engineering',
      daysPlayed: 5,
      coworkerCount: 12,
      playUrl: 'https://email-game.teamify.workers.dev/?email=testuser%40nvidia.engineering',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('WORD GAME')
    expect(html).toContain('nvidia.engineering')
    expect(html).toContain('testuser@nvidia.engineering')
    expect(html).toContain('5 days')
    expect(html).toContain('12 coworkers')
    expect(html).toContain('Play Today\'s Word Game')
    expect(html).toContain('https://email-game.teamify.workers.dev')
  })
})

