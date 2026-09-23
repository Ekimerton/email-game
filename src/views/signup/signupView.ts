import { getDailyPuzzle, escapeHtml } from '../../game'
import { SIGNUP_HTML } from './signupTemplate'

export function getSignupHtml(c: any): string {
  const queryEmail = c.req.query('email') || ''
  const isSubscribed = c.req.query('subscribed') === 'true'
  const isPending = c.req.query('pending') === 'true'
  const safeEmail = escapeHtml(queryEmail)
  const puzzle = getDailyPuzzle()

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
