import { Hono } from 'hono'
import type { Bindings } from './core'
import { sendDailyPuzzleEmails } from './email'
import {
  registerPageRoutes,
  registerGameApiRoutes,
  registerAccountApiRoutes,
  registerSubscribersApiRoutes,
  registerDevRoutes,
} from './routes'

// Pure type re-exports (zero runtime values emitted to Cloudflare Workers module table)
export type * from './core'
export type { EmailTheme } from './core'

// Explicit function re-exports for tests and helper scripts
export { kvDelete, kvGet, kvPut } from './core'
export { isPuzzleSynonym, calculateScore } from './game'
export { resetUserDayState, unsubscribeUser, removeSubscriber } from './services'
export { buildPuzzleEmailContent, sendDailyPuzzleEmails, renderConfirmationEmailHtml, renderConfirmationEmailText } from './email'
export { isDevelopment } from './routes'
export {
  getSignupHtml,
  getConfirmationPageHtml,
  getInvalidConfirmationHtml,
  getPrivacyPolicyHtml,
  getAccountPageHtml,
  getFallbackHtml,
  getUnsubscribeHtml,
  getDevWorkbenchHtml,
  getDevSubscribersPageHtml,
} from './views'

export const app = new Hono<{ Bindings: Bindings }>()

// Enable CORS for AMP emails (Strict AMP for Email CORS header rules)
app.use('/api/*', async (c, next) => {
  const originHeader = c.req.header('Origin')
  const refererHeader = c.req.header('Referer')
  const ampSourceOrigin = c.req.query('__amp_source_origin')

  let refererOrigin = ''
  if (refererHeader) {
    try {
      refererOrigin = new URL(refererHeader).origin
    } catch (_) { }
  }

  let allowedOrigin = (originHeader && originHeader !== 'null') ? originHeader : (refererOrigin || 'https://mail.google.com')

  let sourceOrigin = ampSourceOrigin || ''
  if (!sourceOrigin) {
    if (originHeader && originHeader.includes('mail.google.com')) {
      sourceOrigin = 'https://mail.google.com'
    } else if (originHeader && (originHeader.includes('amp.dev') || originHeader.includes('gmail.dev'))) {
      sourceOrigin = 'amp@gmail.dev'
    } else if (originHeader) {
      try {
        sourceOrigin = new URL(originHeader).origin
      } catch (_) {
        sourceOrigin = 'https://mail.google.com'
      }
    } else {
      sourceOrigin = 'https://mail.google.com'
    }
  }

  c.header('Access-Control-Allow-Origin', allowedOrigin)
  c.header('Vary', 'Origin')
  c.header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
  c.header('Access-Control-Allow-Headers', 'Content-Type, AMP-Same-Origin, Authorization, x-user-email')
  c.header('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin')
  c.header('Access-Control-Allow-Credentials', 'true')
  c.header('AMP-Access-Control-Allow-Source-Origin', sourceOrigin)
  c.header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
  c.header('Pragma', 'no-cache')
  c.header('Expires', '0')

  if (c.req.method === 'OPTIONS') {
    return c.body(null, 204)
  }

  await next()
})

// Register all modular route handlers
registerPageRoutes(app)
registerGameApiRoutes(app)
registerAccountApiRoutes(app)
registerSubscribersApiRoutes(app)
registerDevRoutes(app)

// Cloudflare Worker export supporting fetch & scheduled 9:00 AM PST Cron Handler
export default {
  fetch: app.fetch,
  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    console.log(`[Cloudflare Cron] Executing daily 9:00 AM PST Cron Dispatch at ${event.scheduledTime} (cron: "${event.cron}")`)
    await sendDailyPuzzleEmails(env)
  }
}
