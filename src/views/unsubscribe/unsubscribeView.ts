import { escapeHtml } from '../../game'
import { UNSUBSCRIBE_HTML } from './unsubscribeTemplate'

export function getUnsubscribeHtml(email?: string): string {
  const message = email
    ? `<strong>${escapeHtml(email)}</strong> has been unsubscribed from daily Inboxed puzzles.`
    : 'You have been unsubscribed from daily Inboxed puzzles.'

  return UNSUBSCRIBE_HTML.replace('{{UNSUBSCRIBE_MESSAGE}}', message)
}
