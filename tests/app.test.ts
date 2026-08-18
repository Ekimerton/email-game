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

  it('should pre-render definitions in standard responsive HTML outside amp-list', async () => {
    const { app } = await import('../src/index')
    const res = await app.request('/?email=test%40example.com&date=2026-08-17')
    expect(res.status).toBe(200)
    const html = await res.text()

    // Verify definitions are in standard HTML outside amp-list
    expect(html).toContain('<div class="definitions-section">')
    expect(html).toContain('<div class="definitions-cards">')
    expect(html).toContain('To blow air through a wind instrument')
    expect(html).toContain('[hidden]="(revealedCount || gameState.revealedCount) >= 2"')
    expect(html).toContain('[hidden]="(revealedCount || gameState.revealedCount) < 2"')
    expect(html).toContain('[text]="(revealedCount || gameState.revealedCount) + \' of 5\'"')

    // Verify exactly 5 definition cards are rendered (no duplicate cards)
    const cardMatches = html.match(/class="definition-card"/g)
    expect(cardMatches?.length).toBe(5)

    // Verify amp-list has constant height for letter clues and message banner
    expect(html).toContain('<amp-list id="stateList" width="auto" height="110" layout="fixed-height"')
  })

  it('should return incremented revealedCount on guess submission', async () => {
    const { app } = await import('../src/index')
    const formData = new FormData()
    formData.append('email', 'player1@test.com')
    formData.append('user-guess', 'WRONG')

    const res = await app.request('/api/guess?date=2026-08-17', {
      method: 'POST',
      body: formData,
    })
    expect(res.status).toBe(200)
    const json = await res.json() as any
    expect(json.revealedCount).toBe(2)
    expect(json.hasWon).toBe(false)
  })
})

