/**
 * dailyEmail.ts
 *
 * Sends today's puzzle email to all active subscribers.
 * Intended to be run daily via cron at 8:00 AM.
 *
 * Cron setup (run `crontab -e` and add):
 *   0 8 * * * cd /Users/ekimerton/Documents/coding/email-game && npx tsx scripts/dailyEmail.ts >> /tmp/daily-email.log 2>&1
 *
 * Usage:
 *   npx tsx scripts/dailyEmail.ts              # sends to all active subscribers
 *   npx tsx scripts/dailyEmail.ts --dry-run    # prints what would be sent, no actual emails
 *   npx tsx scripts/dailyEmail.ts --to=me@example.com  # send only to a specific address
 */

import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle, getPuzzleDateForSendCron, formatPrettyDate } from '../src/game'

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const toArg = args.find(a => a.startsWith('--to='))?.split('=')[1]
const puzzleArg = args.find(a => a.startsWith('--puzzle=') || a.startsWith('-p='))?.split('=')[1]
  || args.find(a => !a.startsWith('-') && !a.includes('@') && /^#?\d+$/.test(a))
const dateArg = args.find(a => a.startsWith('--date=') || a.startsWith('-d='))?.split('=')[1]

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>'
const PUBLIC_URL = (process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')
const MAILGUN_SMTP_LOGIN = process.env.MAILGUN_SMTP_LOGIN
const MAILGUN_SMTP_PASS = process.env.MAILGUN_SMTP_PASS

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\s]+/)
    .map(e => e.trim())
    .filter(Boolean)
}

async function getSubscribers(): Promise<string[]> {
  // If --to flag is passed, send only to those address(es)
  if (toArg) return parseEmailList(toArg)

  // Otherwise fetch active subscribers from the worker API
  try {
    const res = await fetch(`${PUBLIC_URL}/api/subscribers`, {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_SECRET || ''}` }
    })
    if (!res.ok) throw new Error(`Subscriber API returned ${res.status}`)
    const data = await res.json() as { email: string; status: string }[]
    return data.filter(s => s.status === 'active').map(s => s.email)
  } catch (err) {
    console.error('Could not fetch subscribers, falling back to TEST_EMAILS / TEST_EMAIL:', err)
    const fallback = process.env.TEST_EMAILS || process.env.TEST_EMAIL || 'ekim0252@gmail.com'
    const emails = parseEmailList(fallback)
    return emails.length > 0 ? emails : ['ekim0252@gmail.com']
  }
}

async function getEmailContent(email: string, puzzleOrDate?: string | number): Promise<{ ampHtml: string; fallbackHtml: string }> {
  let query = ''
  if (puzzleOrDate) {
    if (/^#?\d+$/.test(String(puzzleOrDate).trim()) && !String(puzzleOrDate).includes('-')) {
      query = `&puzzle=${encodeURIComponent(String(puzzleOrDate).replace('#', ''))}`
    } else {
      query = `&date=${encodeURIComponent(String(puzzleOrDate))}`
    }
  }
  try {
    const ampRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(email)}&forceHttps=true${query}`)
    const fbRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(email)}&forceHttps=true${query}`)
    if (!ampRes.ok || !fbRes.ok) throw new Error('Dev server not running or returned error')
    const ampHtml = await ampRes.text()
    const fallbackHtml = await fbRes.text()
    return { ampHtml, fallbackHtml }
  } catch {
    // Dev server not running — render via Hono app in-process
    const { app } = await import('../src/index')
    const ampRes = await app.request(`/?email=${encodeURIComponent(email)}&forceHttps=true${query}`)
    const ampHtml = await ampRes.text()
    const fbRes = await app.request(`/fallback?email=${encodeURIComponent(email)}&forceHttps=true${query}`)
    const fallbackHtml = await fbRes.text()
    return { ampHtml, fallbackHtml }
  }
}

async function main() {
  const cronStr = process.env.SEND_CRON || '0 15 * * *'
  const targetPuzzle = puzzleArg || dateArg || getPuzzleDateForSendCron(new Date(), cronStr)
  const puzzle = getDailyPuzzle(targetPuzzle)
  const today = puzzle.date
  const subject = `Inboxed #${puzzle.id} - ${formatPrettyDate(today)}`

  console.log(`\n📅 Daily Email — Puzzle #${puzzle.id} (${today})`)
  console.log(`📝 Puzzle #${puzzle.id}: ${puzzle.word}`)
  if (isDryRun) console.log(`🏃 DRY RUN — no emails will be sent\n`)

  if (!MAILGUN_SMTP_LOGIN || !MAILGUN_SMTP_PASS) {
    console.error('MAILGUN_SMTP_LOGIN or MAILGUN_SMTP_PASS missing in .env')
    process.exit(1)
  }

  const subscribers = await getSubscribers()
  console.log(`📬 ${subscribers.length} recipient(s): ${subscribers.join(', ')}\n`)

  if (isDryRun) {
    console.log(`Subject: ${subject}`)
    console.log('Dry run complete — no emails sent.')
    return
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 465,
    secure: true,
    auth: {
      user: MAILGUN_SMTP_LOGIN,
      pass: MAILGUN_SMTP_PASS,
    },
  })

  let sent = 0
  let failed = 0

  for (const email of subscribers) {
    try {
      const { ampHtml, fallbackHtml } = await getEmailContent(email, targetPuzzle)
      const playQuery = `?email=${encodeURIComponent(email)}&puzzle=${encodeURIComponent(puzzle.id)}`

      const info = await transporter.sendMail({
        from: SENDER_EMAIL,
        to: email,
        subject,
        text: `Play today's Inboxed puzzle: ${PUBLIC_URL}${playQuery}`,
        html: fallbackHtml,
        alternatives: [
          {
            contentType: 'text/x-amp-html; charset=utf-8',
            content: ampHtml,
            contentTransferEncoding: false
          }
        ],
        headers: {
          'List-Unsubscribe': `<${PUBLIC_URL}/unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Feedback-ID': `word-game-daily:mailgun`,
          'X-Entity-Ref-ID': `puzzle-${puzzle.id}-${puzzle.date}`,
        },
      })

      console.log(`  ✅ ${email} — Message ID: ${info.messageId}`)
      sent++
    } catch (err) {
      console.error(`  ❌ ${email} — Failed:`, err)
      failed++
    }
  }

  console.log(`\n🏁 Done. ${sent} sent, ${failed} failed.`)
}

main().catch(console.error)
