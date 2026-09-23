import { getDailyPuzzle, formatPrettyDate, getRedactedText, getOrCreateGameState, GAME_MESSAGES, type DailyPuzzle } from '../game'
import { EMAIL_HTML } from './emailHtml'
import { generateAccountToken, getAccountUrl, extractEmailDomain, type Bindings, type DailyEmailDispatchResult } from '../core'
import { sendMailgunEmail } from './emailService'
import { applyEmailTheme, type EmailTheme } from './emailThemes'
import { recordUserActivity, getCoworkerCount, getPlayerCount, getUserEmail, getSubscribers } from '../services'
import { getFallbackHtml } from '../views'

// Helper to build full AMP + Fallback HTML content for daily puzzle emails
export async function buildPuzzleEmailContent(
  kv: KVNamespace | undefined,
  userEmail: string,
  dateParam?: string,
  currentOrigin?: string,
  authSecret?: string,
  themeOverride?: EmailTheme
): Promise<{ ampHtml: string; fallbackHtml: string; subject: string; text: string; puzzle: DailyPuzzle; theme: EmailTheme }> {
  const { state, puzzle } = await getOrCreateGameState(kv, userEmail, dateParam)
  const domain = extractEmailDomain(userEmail)
  const secret = authSecret || process.env.AUTH_SECRET
  const userToken = generateAccountToken(userEmail, secret)
  const origin = (currentOrigin || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')

  const encodedEmail = encodeURIComponent(userEmail)
  const encodedDomain = encodeURIComponent(domain)

  const profile = await recordUserActivity(kv, userEmail, puzzle.date)
  const theme: EmailTheme = themeOverride || profile.theme || 'light'

  let ampHtml = EMAIL_HTML
    .replaceAll('https://inboxed.fun', origin)
    .replaceAll('USER_EMAIL_PLACEHOLDER', encodedEmail)
    .replaceAll('USER_DOMAIN_PLACEHOLDER', encodedDomain)
    .replaceAll('USER_DATE_PLACEHOLDER', puzzle.date)
    .replaceAll('default-dev-token', userToken)

  ampHtml = applyEmailTheme(ampHtml, theme)

  ampHtml = ampHtml
    .replaceAll('"wordLength": 7', `"wordLength": ${puzzle.word.length}`)
    .replaceAll('maxlength="7"', `maxlength="${puzzle.word.length}"`)
    .replaceAll('gameState.wordLength || 7', `gameState.wordLength || ${puzzle.word.length}`)

  ampHtml = ampHtml.replace('Aug 5, 2026', formatPrettyDate(puzzle.date))
  ampHtml = ampHtml.replaceAll('company.com', domain)
  ampHtml = ampHtml
    .replaceAll(/<span class="logo-badge">#\d+<\/span>/g, `<span class="logo-badge">#${puzzle.id}</span>`)
    .replaceAll('aria-label="Inboxed #1"', `aria-label="Inboxed #${puzzle.id}"`)
    .replaceAll(/inboxed #1/gi, (match) => {
      if (match === 'INBOXED #1') return `INBOXED #${puzzle.id}`
      if (match === 'Inboxed #1') return `Inboxed #${puzzle.id}`
      return `inboxed #${puzzle.id}`
    })
    .replaceAll(/word game #1/gi, (match) => {
      if (match === 'WORD GAME #1') return `INBOXED #${puzzle.id}`
      if (match === 'Word Game #1') return `Inboxed #${puzzle.id}`
      return `Inboxed #${puzzle.id}`
    })

  const initialMsg = GAME_MESSAGES.initialPrompt(puzzle.word.length)
  ampHtml = ampHtml.replace('Guess the word!', initialMsg)

  const placeholderTabsHtml = puzzle.definitions.map((_, i) => {
    const isFirst = i === 0
    const activeClass = isFirst ? ' active unlocked' : ' locked'
    return `<button type="button" class="clue-tab-btn${activeClass}">${i + 1}</button>`
  }).join('')

  const placeholderClueCardsHtml = puzzle.definitions.map((def, i) => {
    const isFirst = i === 0
    const isRevealed = i === 0
    const hiddenAttr = isFirst ? '' : ' hidden'
    const textClass = isRevealed ? 'clue-text' : 'clue-text blurred'
    const text = isRevealed ? def : getRedactedText(def)
    return `<div class="clue-content"${hiddenAttr}><div class="${textClass}">${text}</div></div>`
  }).join('')

  const placeholderDefsHtml = `<div class="active-clue-card">${placeholderClueCardsHtml}</div><div class="clue-tabs-bar">${placeholderTabsHtml}</div>`
  ampHtml = ampHtml.replace('__PLACEHOLDER_DEFS__', placeholderDefsHtml)

  const placeholderMaskHtml = state.letterMask.map((char, index) => {
    const isRevealed = char !== '_' && char !== ''
    const displayedChar = isRevealed ? char : ''
    const revClass = isRevealed ? ' tile-revealed' : ''
    return `<span class="mask-tile${revClass}" [class]="'mask-tile ' + ((typed.word || '').slice(${index}, ${index + 1}) ? 'tile-typed' : '${isRevealed ? 'tile-revealed' : ''}')" [text]="(typed.word || '').slice(${index}, ${index + 1}) || '${displayedChar}'">${displayedChar}</span>`
  }).join('')
  ampHtml = ampHtml.replace('__PLACEHOLDER_MASK_TILES__', placeholderMaskHtml)

  const coworkerCount = await getCoworkerCount(kv, domain, userEmail)
  const playerCount = await getPlayerCount(kv)
  const playUrl = `${origin}/?email=${encodedEmail}`
  const accountUrl = getAccountUrl(userEmail, origin, secret)

  const fallbackHtml = getFallbackHtml({
    email: userEmail,
    domain,
    daysPlayed: profile.daysPlayed || 1,
    coworkerCount,
    playerCount,
    playUrl,
    accountUrl,
    theme,
  })

  const subject = `Inboxed #${puzzle.id} - ${formatPrettyDate(puzzle.date)}`
  const text = `Play today's Inboxed puzzle (#${puzzle.id}): ${origin}/?email=${encodedEmail}`

  return { ampHtml, fallbackHtml, subject, text, puzzle, theme }
}

// Serve AMP HTML preview page helper
export async function renderAmpGame(c: any) {
  const userEmail = await getUserEmail(c)
  const dateParam = c.req.query('date')
  const themeParam = c.req.query('theme') as EmailTheme | undefined
  const reqUrl = new URL(c.req.url)
  const isLocalHost = reqUrl.hostname === 'localhost' || reqUrl.hostname === '127.0.0.1'
  const forceHttps = c.req.query('forceHttps') === 'true'
  const prodOrigin = (c.env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const currentOrigin = (isLocalHost && !forceHttps) ? reqUrl.origin : prodOrigin
  const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET

  const content = await buildPuzzleEmailContent(c.env?.GAME_STATE_KV, userEmail, dateParam, currentOrigin, authSecret, themeParam)
  return c.html(content.ampHtml)
}

/**
 * Dispatches today's puzzle email to all active subscribers and configured test emails.
 * Triggered automatically by Cloudflare Workers Scheduled Cron (9:00 AM PST) or via admin API.
 */
export async function sendDailyPuzzleEmails(
  env?: any,
  options?: {
    dateStr?: string
    targetEmails?: string[]
    isDryRun?: boolean
    mode?: 'subscribers' | 'test' | 'all'
  }
): Promise<DailyEmailDispatchResult> {
  const puzzle = getDailyPuzzle(options?.dateStr)
  const prodOrigin = (env?.PUBLIC_HTTPS_URL || process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
  const authSecret = env?.AUTH_SECRET || process.env.AUTH_SECRET
  const mode = options?.mode || 'all'

  // 1. Determine recipients
  let recipients: string[] = []
  if (options?.targetEmails && options.targetEmails.length > 0) {
    recipients = options.targetEmails
  } else {
    let activeSubscribers: string[] = []
    let testEmails: string[] = []

    if (mode === 'subscribers' || mode === 'all') {
      const subscribers = await getSubscribers(env?.GAME_STATE_KV)
      activeSubscribers = subscribers
        .filter(s => s.status === 'active')
        .map(s => s.email.toLowerCase().trim())
    }

    if (mode === 'test' || mode === 'all') {
      const rawTestEmails = env?.TEST_EMAILS || env?.TEST_EMAIL || process.env.TEST_EMAILS || process.env.TEST_EMAIL
      testEmails = rawTestEmails
        ? rawTestEmails.split(/[,;\s]+/).map((e: string) => e.toLowerCase().trim()).filter(Boolean)
        : []
    }

    if (mode === 'test') {
      recipients = testEmails.length > 0 ? testEmails : ['ekim0252@gmail.com']
    } else if (mode === 'subscribers') {
      recipients = activeSubscribers
    } else {
      recipients = Array.from(new Set([...activeSubscribers, ...testEmails]))
      if (recipients.length === 0) {
        recipients = ['ekim0252@gmail.com']
      }
    }
  }

  // Deduplicate and filter empty
  recipients = Array.from(new Set(recipients.map(e => e.toLowerCase().trim()))).filter(Boolean)

  if (recipients.length === 0) {
    console.log(`[Daily Cron] No recipients found for mode '${mode}'. Skipping email dispatch.`)
    return { total: 0, sent: 0, failed: 0, recipients: [], errors: {} }
  }

  console.log(`[Daily Cron] Dispatching Inboxed #${puzzle.id} (${formatPrettyDate(puzzle.date)}) to ${recipients.length} recipient(s): ${recipients.join(', ')}`)

  const errors: Record<string, string> = {}
  let sent = 0
  let failed = 0

  for (const email of recipients) {
    try {
      if (options?.isDryRun) {
        console.log(`[Daily Cron] [DRY RUN] Would send to ${email}`)
        sent++
        continue
      }

      const emailContent = await buildPuzzleEmailContent(
        env?.GAME_STATE_KV,
        email,
        options?.dateStr,
        prodOrigin,
        authSecret
      )

      const res = await sendMailgunEmail({
        apiKey: env?.MAILGUN_API_KEY || process.env.MAILGUN_API_KEY,
        domain: env?.MAILGUN_DOMAIN || process.env.MAILGUN_DOMAIN || 'inboxed.fun',
        from: env?.SENDER_EMAIL || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>',
        to: email,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.fallbackHtml,
        ampHtml: emailContent.ampHtml,
        headers: {
          'List-Unsubscribe': `<${prodOrigin}/unsubscribe?email=${encodeURIComponent(email)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Feedback-ID': 'word-game-daily:mailgun',
          'X-Entity-Ref-ID': `puzzle-${emailContent.puzzle.id}-${emailContent.puzzle.date}`,
        },
      })

      if (res.ok) {
        sent++
        console.log(`[Daily Cron] Successfully sent to ${email} (ID: ${res.id})`)
      } else {
        failed++
        errors[email] = res.error || 'Unknown error'
        console.error(`[Daily Cron] Failed to send to ${email}: ${res.error}`)
      }
    } catch (err: any) {
      failed++
      errors[email] = err?.message || String(err)
      console.error(`[Daily Cron] Exception sending to ${email}:`, err)
    }
  }

  console.log(`[Daily Cron] Finished dispatch. ${sent} sent, ${failed} failed.`)
  return { total: recipients.length, sent, failed, recipients, errors }
}
