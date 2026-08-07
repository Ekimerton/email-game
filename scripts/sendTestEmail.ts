import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle, formatPrettyDate } from '../src/puzzles'

async function sendTestEmail() {
  const targetEmail = process.env.TEST_EMAIL || 'ekim0252@gmail.com'
  const senderEmail = process.env.SENDER_EMAIL || 'game@nvidia.engineering'
  const resendApiKey = process.env.RESEND_API_KEY

  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

  console.log(`Preparing test AMP Email via Resend SMTP from: ${senderEmail} -> ${targetEmail}...`)
  console.log(`Using Public HTTPS Endpoint Origin: ${publicHttpsUrl}`)

  let ampHtml = ''
  let fallbackHtml = ''
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(targetEmail)}&forceHttps=true`)
    ampHtml = await localRes.text()

    const fallbackRes = await fetch(`http://localhost:8787/fallback?email=${encodeURIComponent(targetEmail)}`)
    fallbackHtml = await fallbackRes.text()
  } catch (err) {
    console.error('Could not connect to http://localhost:8787. Make sure `npm run dev` is running!')
    process.exit(1)
  }

  const puzzle = getDailyPuzzle()
  const subject = `Word Game #${puzzle.id} - Today's Multi-Definition Puzzle (${formatPrettyDate(puzzle.date)})`

  if (!resendApiKey) {
    console.log('\nRESEND_API_KEY is missing in .env!')
    console.log('Add RESEND_API_KEY="re_..." to your .env file.')
    process.exit(1)
  }

  const transporter = nodemailer.createTransport({
    host: 'smtp.resend.com',
    port: 465,
    secure: true,
    auth: {
      user: 'resend',
      pass: resendApiKey,
    },
  })

  try {
    const info = await transporter.sendMail({
      from: senderEmail,
      to: targetEmail,
      subject,
      text: `Play today's Word Game puzzle: ${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}`,
      html: fallbackHtml,
      amp: ampHtml,
    })

    console.log(`Test AMP Email sent successfully via Resend SMTP to ${targetEmail}! Message ID: ${info.messageId}`)
  } catch (err) {
    console.error('Failed to send via Resend SMTP:', err)
  }
}

sendTestEmail().catch(console.error)
