/**
 * sendTestEmail.ts
 *
 * Sends a test AMP / fallback email.
 *
 * Usage:
 *   npm run test-send:me                                 # sends test email ONLY to ekim0252@gmail.com
 *   npm run test-send                                    # default behavior (sends to TEST_EMAILS in .env)
 *   npx tsx scripts/sendTestEmail.ts ekim0252@gmail.com  # positional email param
 *   npx tsx scripts/sendTestEmail.ts --to=user@test.com  # --to param
 *   npx tsx scripts/sendTestEmail.ts --me                # sends only to ekim0252@gmail.com
 *   npx tsx scripts/sendTestEmail.ts --dry-run           # renders email without sending
 */

import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle, getPuzzleDateForSendCron, formatPrettyDate } from '../src/game'

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\s]+/)
    .map(e => e.trim())
    .filter(Boolean)
}

function parseArgs(args: string[]) {
  const isDryRun = args.includes('--dry-run')

  let dateArg: string | undefined
  const dateEq = args.find(a => a.startsWith('--date='))
  if (dateEq) {
    dateArg = dateEq.split('=')[1]
  } else {
    const dateIdx = args.findIndex(a => a === '--date' || a === '-d')
    if (dateIdx !== -1 && args[dateIdx + 1] && !args[dateIdx + 1].startsWith('-')) {
      dateArg = args[dateIdx + 1]
    }
  }

  let senderArg: string | undefined
  const senderEq = args.find(a => a.startsWith('--sender='))
  if (senderEq) {
    senderArg = senderEq.split('=')[1]
  } else {
    const senderIdx = args.findIndex(a => a === '--sender' || a === '-s')
    if (senderIdx !== -1 && args[senderIdx + 1] && !args[senderIdx + 1].startsWith('-')) {
      senderArg = args[senderIdx + 1]
    }
  }

  let targetArg: string | undefined
  if (args.includes('--me') || args.includes('--only-me')) {
    targetArg = 'ekim0252@gmail.com'
  } else {
    const toEq = args.find(a => a.startsWith('--to=') || a.startsWith('--email='))
    if (toEq) {
      targetArg = toEq.split('=')[1]
    } else {
      const toIdx = args.findIndex(a => a === '--to' || a === '-t' || a === '--email')
      if (toIdx !== -1 && args[toIdx + 1] && !args[toIdx + 1].startsWith('-')) {
        targetArg = args[toIdx + 1]
      } else {
        const positionalEmails = args.filter(a => !a.startsWith('-') && a.includes('@'))
        if (positionalEmails.length > 0) {
          targetArg = positionalEmails.join(',')
        }
      }
    }
  }

  const isDevArg = args.includes('--dev')

  return { isDryRun, senderArg, targetArg, dateArg, isDevArg }
}

async function checkIsDevTester(email: string, publicUrl: string, forceDev?: boolean): Promise<boolean> {
  if (forceDev) return true
  const cleanEmail = email.toLowerCase().trim()
  const envDevList = (process.env.DEV_TESTERS || '')
    .split(/[,;\s]+/)
    .map(e => e.toLowerCase().trim())
    .filter(Boolean)
  if (envDevList.includes(cleanEmail)) {
    return true
  }
  try {
    const res = await fetch(`${publicUrl}/api/state?email=${encodeURIComponent(cleanEmail)}`)
    if (res.ok) {
      const data = await res.json() as any
      if (data.isDev !== undefined) return Boolean(data.isDev)
      if (data.shareText && data.shareText.includes('#43')) return true
      if (data.items && data.items[0] && (data.items[0].isDev || (data.items[0].shareText && data.items[0].shareText.includes('#43')))) return true
    }
  } catch (_) {}
  return false
}

async function getEmailContent(
  email: string,
  dateStr?: string,
  origin = 'https://inboxed.fun',
  options?: { isDev?: boolean }
): Promise<{ ampHtml: string; fallbackHtml: string; subject: string; text: string; puzzle: any }> {
  const dateQuery = dateStr ? `&date=${encodeURIComponent(dateStr)}` : ''
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(email)}&forceHttps=true${dateQuery}`)
    const fallbackRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(email)}&forceHttps=true${dateQuery}`)
    if (localRes.ok && fallbackRes.ok) {
      const ampHtml = await localRes.text()
      const fallbackHtml = await fallbackRes.text()
      const puzzle = getDailyPuzzle(dateStr, options)
      const subject = `Inboxed #${puzzle.id} - ${formatPrettyDate(puzzle.date)}`
      const text = `Play today's Inboxed puzzle (#${puzzle.id}): ${origin}/?email=${encodeURIComponent(email)}`
      return { ampHtml, fallbackHtml, subject, text, puzzle }
    }
  } catch (_) {}

  // In-process rendering using buildPuzzleEmailContent
  const { buildPuzzleEmailContent } = await import('../src/email/dailyCron')
  const content = await buildPuzzleEmailContent(
    undefined,
    email,
    dateStr,
    origin,
    process.env.AUTH_SECRET,
    undefined,
    options
  )
  return content
}

async function sendTestEmail() {
  const args = process.argv.slice(2)
  const { isDryRun, senderArg, targetArg, dateArg, isDevArg } = parseArgs(args)

  const rawTargets = targetArg || process.env.TEST_EMAILS || process.env.TEST_EMAIL || 'ekim0252@gmail.com'
  const targetEmails = parseEmailList(rawTargets)
  if (targetEmails.length === 0) {
    targetEmails.push('ekim0252@gmail.com')
  }

  const senderEmail = senderArg || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>'
  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://inboxed.fun').replace(/\/$/, '')

  const cronStr = process.env.SEND_CRON || '0 15 * * *'
  const targetDate = dateArg || getPuzzleDateForSendCron(new Date(), cronStr)

  console.log('Preparing test AMP Email via Mailgun SMTP...')
  console.log(`  Date:          ${targetDate}`)
  console.log(`  Sender (From): ${senderEmail}`)
  console.log(`  Target (To):   ${targetEmails.join(', ')} (${targetEmails.length} recipient${targetEmails.length > 1 ? 's' : ''})`)
  console.log(`  Public Origin: ${publicHttpsUrl}`)

  if (isDryRun) {
    console.log(`\n🏃 DRY RUN MODE — No actual emails will be sent.`)
    for (const targetEmail of targetEmails) {
      const isDev = await checkIsDevTester(targetEmail, publicHttpsUrl, isDevArg)
      const emailContent = await getEmailContent(targetEmail, targetDate, publicHttpsUrl, { isDev })
      console.log(`\n  Target:        ${targetEmail}`)
      console.log(`  Dev Track:     ${isDev ? 'YES' : 'NO'}`)
      console.log(`  Puzzle:        #${emailContent.puzzle.id} (${emailContent.puzzle.word}, ${emailContent.puzzle.word.length} letters, ${emailContent.puzzle.date})`)
      console.log(`  Subject:       ${emailContent.subject}`)
      console.log(`  Rendered:      AMP (${emailContent.ampHtml.length} bytes), Fallback (${emailContent.fallbackHtml.length} bytes)`)
    }
    console.log(`\n🏁 Dry run complete.`)
    return
  }

  const mailgunLogin = process.env.MAILGUN_SMTP_LOGIN
  const mailgunPass = process.env.MAILGUN_SMTP_PASS

  if (!mailgunLogin || !mailgunPass) {
    console.log('\nMAILGUN_SMTP_LOGIN or MAILGUN_SMTP_PASS missing in .env!')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 465,
    secure: true,
    auth: {
      user: mailgunLogin,
      pass: mailgunPass,
    },
  })

  console.log(`  SMTP:          smtp.mailgun.org`)
  console.log(`\n⚡ Sending interactive AMP for Email (text/x-amp-html + fallback HTML) via Mailgun SMTP...`)

  let sent = 0
  let failed = 0

  for (const targetEmail of targetEmails) {
    try {
      const isDev = await checkIsDevTester(targetEmail, publicHttpsUrl, isDevArg)
      const emailContent = await getEmailContent(targetEmail, targetDate, publicHttpsUrl, { isDev })
      const info = await transporter.sendMail({
        from: senderEmail,
        to: targetEmail,
        subject: emailContent.subject,
        text: emailContent.text,
        html: emailContent.fallbackHtml,
        alternatives: [
          {
            contentType: 'text/x-amp-html; charset=utf-8',
            content: emailContent.ampHtml,
            contentTransferEncoding: false
          }
        ],
        headers: {
          'List-Unsubscribe': `<${publicHttpsUrl}/unsubscribe?email=${encodeURIComponent(targetEmail)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Feedback-ID': `word-game-daily:mailgun`,
          'X-Entity-Ref-ID': `puzzle-${emailContent.puzzle.id}-${emailContent.puzzle.date}`,
        },
      })

      console.log(`  ✨ Test AMP Email sent successfully via Mailgun SMTP to ${targetEmail}! Message ID: ${info.messageId}`)
      sent++
    } catch (err) {
      console.error(`  ❌ Failed to send via Mailgun SMTP to ${targetEmail}:`, err)
      failed++
    }
  }

  console.log(`\n🏁 Done. ${sent} sent, ${failed} failed.`)
}

sendTestEmail().catch(console.error)
