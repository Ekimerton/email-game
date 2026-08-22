import { describe, it, expect } from 'vitest'
import { getDailyPuzzle } from '../src/puzzles'
import { getFallbackHtml } from '../src/index'
import { EMAIL_HTML } from '../src/emailHtml'

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
    expect(html).toContain('The daily word game you can play in your email!')
    expect(html).toContain('Note for Outlook &amp; Apple Mail users')
    expect(html).toContain('Gmail')
    expect(html).toContain('Yahoo Mail')
    expect(html).toContain('Manage Account &amp; Preferences')
    expect(html).toContain('Game #')
  })

  it('should include the daily word game email client intro banner and WORD GAME #XX card in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('game-hero')
    expect(EMAIL_HTML).toContain('game-meta-row')
    expect(EMAIL_HTML).toContain('WORD GAME #1')
    expect(EMAIL_HTML).toContain('The daily word game you can play in your email!')
  })

  it('should include the How to Play section below the leaderboard in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('how-to-play-section')
    expect(EMAIL_HTML).toContain('How to Play')
    expect(EMAIL_HTML).toContain('Guess the mystery word')
  })
})

