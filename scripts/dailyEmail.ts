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
import { getDailyPuzzle, formatPrettyDate } from '../src/puzzles'

const args = process.argv.slice(2)
const isDryRun = args.includes('--dry-run')
const toArg = args.find(a => a.startsWith('--to='))?.split('=')[1]

const SENDER_EMAIL = process.env.SENDER_EMAIL || 'game@nvidia.engineering'
const PUBLIC_URL = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')
const MAILGUN_SMTP_LOGIN = process.env.MAILGUN_SMTP_LOGIN
const MAILGUN_SMTP_PASS = process.env.MAILGUN_SMTP_PASS

async function getSubscribers(): Promise<string[]> {
  // If --to flag is passed, send only to that address
  if (toArg) return [toArg]

  // Otherwise fetch active subscribers from the worker API
  try {
    const res = await fetch(`${PUBLIC_URL}/api/subscribers`, {
      headers: { 'Authorization': `Bearer ${process.env.ADMIN_SECRET || ''}` }
    })
    if (!res.ok) throw new Error(`Subscriber API returned ${res.status}`)
    const data = await res.json() as { email: string; status: string }[]
    return data.filter(s => s.status === 'active').map(s => s.email)
  } catch (err) {
    console.error('Could not fetch subscribers, falling back to TEST_EMAIL:', err)
    return [process.env.TEST_EMAIL || 'ekim0252@gmail.com']
  }
}

async function getEmailContent(email: string): Promise<{ ampHtml: string; fallbackHtml: string }> {
  try {
    const ampRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(email)}&forceHttps=true`)
    if (!ampRes.ok) throw new Error('Dev server not running')
    const ampHtml = await ampRes.text()
    const fbRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(email)}`)
    const fallbackHtml = await fbRes.text()
    return { ampHtml, fallbackHtml }
  } catch {
    // Dev server not running — render via Hono app in-process
    const { app } = await import('../src/index')
    const ampRes = await app.request(`/?email=${encodeURIComponent(email)}&forceHttps=true`)
    const ampHtml = await ampRes.text()
    const fbRes = await app.request(`/fallback?email=${encodeURIComponent(email)}`)
    const fallbackHtml = await fbRes.text()
    return { ampHtml, fallbackHtml }
  }
}

async function main() {
  const puzzle = getDailyPuzzle()
  const today = puzzle.date
  const subject = `Word Game #${puzzle.id} — ${puzzle.word.charAt(0) + puzzle.word.slice(1).toLowerCase()} — ${formatPrettyDate(today)}`

  console.log(`\n📅 Daily Email — ${today}`)
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
      const { ampHtml, fallbackHtml } = await getEmailContent(email)

      const info = await transporter.sendMail({
        from: SENDER_EMAIL,
        to: email,
        subject,
        text: `Play today's Word Game puzzle: ${PUBLIC_URL}`,
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
          'X-Entity-Ref-ID': `puzzle-${puzzle.id}`,
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
