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

  it('should render straightforward fallback HTML with invitation message and play link in a single card', () => {
    const html = getFallbackHtml({
      email: 'testuser@nvidia.engineering',
      domain: 'nvidia.engineering',
      daysPlayed: 5,
      coworkerCount: 12,
      playUrl: 'https://email-game.teamify.workers.dev/?email=testuser%40nvidia.engineering',
    })

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('WORD GAME')
    expect(html).toContain('testuser@nvidia.engineering')
    expect(html).toContain('is inviting you to play word game, the daily game you can play in your email. Click below to start playing.')
    expect(html).toContain('Play Word Game')
    expect(html).toContain('https://email-game.teamify.workers.dev')
    expect(html).toContain('background-color: #f4f4f5')
    expect(html).toContain('background: #ffffff')
    expect(html).toContain('border: 1px solid #e4e4e7')
    expect(html).toContain('Manage Account &amp; Preferences')
  })

  it('should include the daily word game email client intro banner and WORD GAME #XX card in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('game-hero')
    expect(EMAIL_HTML).toContain('game-meta-row')
    expect(EMAIL_HTML).toContain('WORD GAME #1')
    expect(EMAIL_HTML).toContain('The daily email game. Forward an invite to your friends!')
    expect(EMAIL_HTML).toContain('ticket-stub-divider')
    expect(EMAIL_HTML).toContain("Have someone you think would make a good addition to the leaderboard? Forward this email to them!")
  })

  it('should include the How to Play section below the leaderboard in EMAIL_HTML', () => {
    expect(EMAIL_HTML).toContain('how-to-play-section')
    expect(EMAIL_HTML).toContain('How to Play')
    expect(EMAIL_HTML).toContain('Guess the mystery word')
  })
})

