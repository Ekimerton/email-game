import { getDailyPuzzle, getPuzzleDateForSendCron, escapeHtml } from '../../game'
import { CONFIRM_HTML } from './confirmTemplate'

export function getConfirmationPageHtml(c: any, email: string, token: string): string {
  const cronStr = c?.env?.SEND_CRON || process.env.SEND_CRON || '0 15 * * *'
  const targetPuzzleOrDate = (c?.req?.query ? (c.req.query('puzzle') || c.req.query('puzzleId') || c.req.query('id') || c.req.query('date')) : undefined) || getPuzzleDateForSendCron(new Date(), cronStr)
  const puzzle = getDailyPuzzle(targetPuzzleOrDate)
  const safeEmail = escapeHtml(email)
  const safeToken = escapeHtml(token)

  return CONFIRM_HTML
    .replaceAll('{{PUZZLE_ID}}', String(puzzle.id))
    .replaceAll('{{SAFE_EMAIL}}', safeEmail)
    .replaceAll('{{SAFE_TOKEN}}', safeToken)
}
