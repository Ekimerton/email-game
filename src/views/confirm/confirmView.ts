import { getDailyPuzzle, escapeHtml } from '../../game'
import { CONFIRM_HTML } from './confirmTemplate'

export function getConfirmationPageHtml(c: any, email: string, token: string): string {
  const puzzle = getDailyPuzzle()
  const safeEmail = escapeHtml(email)
  const safeToken = escapeHtml(token)

  return CONFIRM_HTML
    .replaceAll('{{PUZZLE_ID}}', String(puzzle.id))
    .replaceAll('{{SAFE_EMAIL}}', safeEmail)
    .replaceAll('{{SAFE_TOKEN}}', safeToken)
}
