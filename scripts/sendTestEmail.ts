import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle, formatPrettyDate } from '../src/puzzles'

async function sendTestEmail() {
  const args = process.argv.slice(2)
  const senderArg = args.find(a => a.startsWith('--sender='))?.split('=')[1]
  const targetArg = args.find(a => a.startsWith('--to='))?.split('=')[1]

  const targetEmail = targetArg || process.env.TEST_EMAIL || 'ekim0252@gmail.com'
  const senderEmail = senderArg || process.env.SENDER_EMAIL || 'game@nvidia.engineering'
  const resendApiKey = process.env.RESEND_API_KEY

  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

  console.log(`Preparing test AMP Email via Resend SMTP...`)
  console.log(`  Sender (From): ${senderEmail}`)
  console.log(`  Target (To):   ${targetEmail}`)
  console.log(`  Public Origin: ${publicHttpsUrl}`)

  let ampHtml = ''
  let fallbackHtml = ''
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(targetEmail)}&forceHttps=true`)
    if (localRes.ok) {
      ampHtml = await localRes.text()
      const fallbackRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(targetEmail)}`)
      fallbackHtml = await fallbackRes.text()
    } else {
      throw new Error('Localhost server returned non-ok status')
    }
  } catch (err) {
    console.log('Dev server not running on localhost:8787. Rendering templates directly via Hono app...')
    const { app } = await import('../src/index')
    const ampRes = await app.request(`/?email=${encodeURIComponent(targetEmail)}&forceHttps=true`)
    ampHtml = await ampRes.text()
    const fbRes = await app.request(`/fallback?email=${encodeURIComponent(targetEmail)}`)
    fallbackHtml = await fbRes.text()
  }

  const puzzle = getDailyPuzzle()
  const subject = `Word Game #${puzzle.id} - Today's Multi-Definition Puzzle (${formatPrettyDate(puzzle.date)})`

  if (!resendApiKey) {
    console.log('\nRESEND_API_KEY is missing in .env!')
    console.log('Add RESEND_API_KEY="re_..." to your .env file.')
    process.exit(1)
  }

  const useSdk = args.includes('--sdk')

  if (useSdk) {
    console.log('Sending via official Resend REST API SDK...')
    const { Resend } = await import('resend')
    const resend = new Resend(resendApiKey)
    try {
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
        console.error('Resend API returned an error:', response.error)
      } else {
        console.log(`Test Email sent successfully via Resend SDK to ${targetEmail}! ID: ${response.data?.id}`)
      }
    } catch (err) {
      console.error('Failed to send via Resend SDK:', err)
    }
    return
  }

  const formattedFrom = senderEmail.includes('<') ? senderEmail : `Word Game <${senderEmail}>`

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
  console.log(`⚡ Sending interactive AMP for Email (text/x-amp-html + fallback HTML) via Mailgun SMTP...`)
  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: targetEmail,
      subject,
      text: `Play today's Word Game puzzle: ${publicHttpsUrl}`,
      html: fallbackHtml,
      alternatives: [
        {
          contentType: 'text/x-amp-html; charset=utf-8',
          content: ampHtml,
          contentTransferEncoding: false
        }
      ],
      headers: {
        'List-Unsubscribe': `<${publicHttpsUrl}/unsubscribe>`,
        'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        'Feedback-ID': `word-game-daily:mailgun`,
        'X-Entity-Ref-ID': `puzzle-${puzzle.id}`,
      },
    })

    console.log(`✨ Test AMP Email sent successfully via Mailgun SMTP to ${targetEmail}! Message ID: ${info.messageId}`)
  } catch (err) {
    console.error('Failed to send via Resend SMTP:', err)
  }
}

sendTestEmail().catch(console.error)
