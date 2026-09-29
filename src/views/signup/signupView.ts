import { getDailyPuzzle, getPuzzleDateForSendCron, escapeHtml, LAUNCH_DATE } from '../../game'
import { SIGNUP_HTML } from './signupTemplate'

export function getSignupHtml(c: any, dateOverride?: string, nowOverride?: Date): string {
  const queryEmail = c?.req?.query ? (c.req.query('email') || '') : ''
  const isSubscribed = c?.req?.query ? (c.req.query('subscribed') === 'true') : false
  const isPending = c?.req?.query ? (c.req.query('pending') === 'true') : false
  const safeEmail = escapeHtml(queryEmail)
  const cronStr = c?.env?.SEND_CRON || process.env.SEND_CRON || '0 15 * * *'
  const puzzleParam = c?.req?.query ? (c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id')) : undefined
  const targetDate = dateOverride || puzzleParam || (c?.req?.query ? c.req.query('date') : undefined) || getPuzzleDateForSendCron(nowOverride || new Date(), cronStr)

  // Landing page always shows the puzzle of the normal track (never dev prescreen track).
  // For dates prior to official launch (LAUNCH_DATE = '2026-09-28'), showcase the launch puzzle (Puzzle #1).
  const isNumericPuzzle = Boolean(puzzleParam && /^\d+$/.test(String(puzzleParam).replace(/^#/, '')))
  const effectiveDate = (!targetDate || (!isNumericPuzzle && targetDate < LAUNCH_DATE && !dateOverride && !nowOverride))
    ? LAUNCH_DATE
    : targetDate
  const puzzle = getDailyPuzzle(effectiveDate, { isDev: false })

  let statusContent = `
        <form id="signup-form" class="signup-form" method="POST" action="/api/subscribe">
          <div class="input-wrapper">
            <input
              type="email"
              id="email-input"
              name="email"
              class="email-input"
              placeholder="Enter your email address"
              value="${safeEmail}"
              required
              autocomplete="email"
            >
            <button type="submit" id="submit-btn" class="btn-submit">
              Subscribe to Daily Puzzles
            </button>
          </div>
          <div id="status-msg" class="status-msg" style="display: none;"></div>
        </form>
  `

  if (isPending) {
    statusContent = `
        <div class="success-card">
          <div class="success-icon">✉️</div>
          <h2 class="success-title">Check Your Email!</h2>
          <p class="success-desc">
            We sent a confirmation link to <strong>${safeEmail}</strong>.<br>
            Click the link in your email to confirm your subscription and start playing.
          </p>
        </div>
    `
  } else if (isSubscribed) {
    statusContent = `
        <div class="success-card">
          <div class="success-icon">🎉</div>
          <h2 class="success-title">You're Subscribed!</h2>
          <p class="success-desc">
            You'll get emails at 9:00 AM every day.
          </p>
        </div>
    `
  }

  return SIGNUP_HTML
    .replace('{{PUZZLE_ID}}', String(puzzle.id))
    .replace('{{FIRST_DEFINITION}}', escapeHtml(puzzle.definitions[0] || 'Synonym clue'))
    .replace('{{STATUS_CONTENT}}', statusContent)
}
