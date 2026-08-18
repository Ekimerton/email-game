import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle, formatPrettyDate } from '../src/puzzles'

async function renderEmailTemplates(targetEmail: string, appInstance?: any) {
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(targetEmail)}&forceHttps=true`)
    if (localRes.ok) {
      const ampHtml = await localRes.text()
      const fallbackRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(targetEmail)}`)
      const fallbackHtml = await fallbackRes.text()
      return { ampHtml, fallbackHtml }
    }
  } catch {
    // Dev server not running on localhost:8787, fallback to direct app rendering
  }

  const app = appInstance || (await import('../src/index')).app
  const ampRes = await app.request(`/?email=${encodeURIComponent(targetEmail)}&forceHttps=true`)
  const ampHtml = await ampRes.text()
  const fbRes = await app.request(`/fallback?email=${encodeURIComponent(targetEmail)}`)
  const fallbackHtml = await fbRes.text()
  return { ampHtml, fallbackHtml }
}

async function sendTestEmail() {
  const args = process.argv.slice(2)
  const senderArg = args.find(a => a.startsWith('--sender='))?.split('=')[1]
  const targetArgs = args.filter(a => a.startsWith('--to=')).map(a => a.split('=').slice(1).join('='))
  const positionalArgs = args.filter(a => !a.startsWith('--') && !a.startsWith('-'))

  const envEmails = process.env.TEST_EMAILS || process.env.TEST_EMAIL || 'ekim0252@gmail.com'

  let rawTargets: string[] = []
  if (targetArgs.length > 0) {
    rawTargets = targetArgs.flatMap(t => t.split(','))
  } else if (positionalArgs.length > 0) {
    rawTargets = positionalArgs.flatMap(t => t.split(','))
  } else {
    rawTargets = envEmails.split(',')
  }

  const targetEmails = Array.from(
    new Set(rawTargets.map(e => e.trim().toLowerCase()).filter(Boolean))
  )

  const senderEmail = senderArg || process.env.SENDER_EMAIL || 'game@nvidia.engineering'
  const resendApiKey = process.env.RESEND_API_KEY
  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')
  const useSdk = args.includes('--sdk')

  const puzzle = getDailyPuzzle()
  const subject = `Word Game #${puzzle.id} - Today's Multi-Definition Puzzle (${formatPrettyDate(puzzle.date)})`

  console.log(`Preparing test AMP Email (${targetEmails.length} recipient${targetEmails.length === 1 ? '' : 's'})...`)
  console.log(`  Sender (From): ${senderEmail}`)
  console.log(`  Target (To):   ${targetEmails.join(', ')}`)
  console.log(`  Public Origin: ${publicHttpsUrl}`)
  console.log(`  Puzzle:        #${puzzle.id} (${puzzle.word}) for ${puzzle.date}`)

  if (useSdk) {
    if (!resendApiKey) {
      console.error('\nRESEND_API_KEY is missing in .env!')
      console.error('Add RESEND_API_KEY="re_..." to your .env file.')
      process.exit(1)
    }

    console.log('Sending via official Resend REST API SDK...')
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)

    let appInstance: any = null
    try {
      const { app } = await import('../src/index')
      appInstance = app
    } catch {}

    for (const targetEmail of targetEmails) {
      try {
        const { fallbackHtml } = await renderEmailTemplates(targetEmail, appInstance)
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
          console.error(`❌ Resend SDK error for ${targetEmail}:`, response.error)
        } else {
          console.log(`✨ Sent via Resend SDK to ${targetEmail}! ID: ${response.data?.id}`)
        }
      } catch (err) {
        console.error(`❌ Failed to send via Resend SDK to ${targetEmail}:`, err)
      }
    }
    return
  }

  const mailgunLogin = process.env.MAILGUN_SMTP_LOGIN
  const mailgunPass = process.env.MAILGUN_SMTP_PASS

  if (!mailgunLogin || !mailgunPass) {
    console.error('\nMAILGUN_SMTP_LOGIN or MAILGUN_SMTP_PASS missing in .env!')
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
  console.log(`⚡ Sending interactive AMP for Email (text/x-amp-html + fallback HTML) via Mailgun SMTP...\n`)

  let appInstance: any = null
  try {
    const { app } = await import('../src/index')
    appInstance = app
  } catch {}

  for (const targetEmail of targetEmails) {
    try {
      const { ampHtml, fallbackHtml } = await renderEmailTemplates(targetEmail, appInstance)
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

      console.log(`✨ Test AMP Email sent to ${targetEmail}! Message ID: ${info.messageId}`)
    } catch (err) {
      console.error(`❌ Failed to send to ${targetEmail}:`, err)
    }
  }
}

sendTestEmail().catch(console.error)
