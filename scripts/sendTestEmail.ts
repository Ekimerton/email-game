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
import { getDailyPuzzle, formatPrettyDate } from '../src/puzzles'

function parseEmailList(raw: string | undefined): string[] {
  if (!raw) return []
  return raw
    .split(/[,;\s]+/)
    .map(e => e.trim())
    .filter(Boolean)
}

function parseArgs(args: string[]) {
  const isDryRun = args.includes('--dry-run')
  const useSdk = args.includes('--sdk')

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
        const positionalEmail = args.find(a => !a.startsWith('-') && a.includes('@'))
        if (positionalEmail) {
          targetArg = positionalEmail
        }
      }
    }
  }

  return { isDryRun, useSdk, senderArg, targetArg }
}

async function getEmailContent(email: string): Promise<{ ampHtml: string; fallbackHtml: string }> {
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(email)}&forceHttps=true`)
    if (localRes.ok) {
      const ampHtml = await localRes.text()
      const fallbackRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(email)}`)
      const fallbackHtml = await fallbackRes.text()
      return { ampHtml, fallbackHtml }
    } else {
      throw new Error('Localhost server returned non-ok status')
    }
  } catch (err) {
    // Dev server not running — render via Hono app in-process
    const { app } = await import('../src/index')
    const ampRes = await app.request(`/?email=${encodeURIComponent(email)}&forceHttps=true`)
    const ampHtml = await ampRes.text()
    const fbRes = await app.request(`/fallback?email=${encodeURIComponent(email)}`)
    const fallbackHtml = await fbRes.text()
    return { ampHtml, fallbackHtml }
  }
}

async function sendTestEmail() {
  const args = process.argv.slice(2)
  const { isDryRun, useSdk, senderArg, targetArg } = parseArgs(args)

  const rawTargets = targetArg || process.env.TEST_EMAILS || process.env.TEST_EMAIL || 'ekim0252@gmail.com'
  const targetEmails = parseEmailList(rawTargets)
  if (targetEmails.length === 0) {
    targetEmails.push('ekim0252@gmail.com')
  }

  const senderEmail = senderArg || process.env.SENDER_EMAIL || 'game@nvidia.engineering'
  const resendApiKey = process.env.RESEND_API_KEY
  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

  const puzzle = getDailyPuzzle()
  const subject = `Word Game #${puzzle.id} - Today's Multi-Definition Puzzle (${formatPrettyDate(puzzle.date)})`

  console.log(`Preparing test AMP Email via ${useSdk ? 'Resend SDK' : 'Mailgun SMTP'}...`)
  console.log(`  Sender (From): ${senderEmail}`)
  console.log(`  Target (To):   ${targetEmails.join(', ')} (${targetEmails.length} recipient${targetEmails.length > 1 ? 's' : ''})`)
  console.log(`  Public Origin: ${publicHttpsUrl}`)

  if (isDryRun) {
    console.log(`\n🏃 DRY RUN MODE — No actual emails will be sent.`)
    console.log(`  Subject: ${subject}`)
    for (const targetEmail of targetEmails) {
      const { ampHtml, fallbackHtml } = await getEmailContent(targetEmail)
      console.log(`  Rendered for ${targetEmail}: AMP (${ampHtml.length} bytes), Fallback (${fallbackHtml.length} bytes)`)
    }
    console.log(`\n🏁 Dry run complete.`)
    return
  }

  if (useSdk) {
    if (!resendApiKey) {
      console.log('\nRESEND_API_KEY is missing in .env!')
      console.log('Add RESEND_API_KEY="re_..." to your .env file.')
      process.exit(1)
    }

    console.log('\nSending via official Resend REST API SDK...')
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)
    let sent = 0
    let failed = 0

    for (const targetEmail of targetEmails) {
      try {
        const { fallbackHtml } = await getEmailContent(targetEmail)
        const response = await resend.emails.send({
          from: senderEmail,
          to: targetEmail,
          subject,
          text: `Play today's Word Game puzzle: ${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}`,
          html: fallbackHtml,
          headers: {
            'List-Unsubscribe': `<${publicHttpsUrl}/unsubscribe?email=${encodeURIComponent(targetEmail)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
            'Feedback-ID': `word-game-daily:resend`,
            'X-Entity-Ref-ID': `puzzle-${puzzle.id}`,
          },
        })
        if (response.error) {
          console.error(`  ❌ Resend API returned an error for ${targetEmail}:`, response.error)
          failed++
        } else {
          console.log(`  ✨ Test Email sent successfully via Resend SDK to ${targetEmail}! ID: ${response.data?.id}`)
          sent++
        }
      } catch (err) {
        console.error(`  ❌ Failed to send via Resend SDK to ${targetEmail}:`, err)
        failed++
      }
    }
    console.log(`\n🏁 Done. ${sent} sent, ${failed} failed.`)
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
      const { ampHtml, fallbackHtml } = await getEmailContent(targetEmail)
      const info = await transporter.sendMail({
        from: senderEmail,
        to: targetEmail,
        subject,
        text: `Play today's Word Game puzzle: ${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}`,
        html: fallbackHtml,
        alternatives: [
          {
            contentType: 'text/x-amp-html; charset=utf-8',
            content: ampHtml,
            contentTransferEncoding: false
          }
        ],
        headers: {
          'List-Unsubscribe': `<${publicHttpsUrl}/unsubscribe?email=${encodeURIComponent(targetEmail)}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'Feedback-ID': `word-game-daily:mailgun`,
          'X-Entity-Ref-ID': `puzzle-${puzzle.id}`,
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
