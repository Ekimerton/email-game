import 'dotenv/config'
import nodemailer from 'nodemailer'
import { getDailyPuzzle } from '../src/puzzles'

async function sendTestEmail() {
  const targetEmail = process.env.TEST_EMAIL || 'ekim0252@gmail.com'
  const gmailUser = process.env.GMAIL_USER || targetEmail
  const gmailAppPass = process.env.GMAIL_APP_PASS
  const resendApiKey = process.env.RESEND_API_KEY
  
  // Public HTTPS URL is required by Gmail for AMP action-xhr & amp-list
  const publicHttpsUrl = (process.env.PUBLIC_HTTPS_URL || 'https://email-game.teamify.workers.dev').replace(/\/$/, '')

  console.log(`🚀 Preparing test AMP Email for: ${targetEmail}...`)
  console.log(`🔒 Using Public HTTPS Endpoint Origin: ${publicHttpsUrl}`)

  // Fetch pre-rendered AMP HTML from local server
  let ampHtml = ''
  try {
    const localRes = await fetch(`http://localhost:8787/?email=${encodeURIComponent(targetEmail)}`)
    ampHtml = await localRes.text()
  } catch (err) {
    console.error('⚠️ Could not connect to http://localhost:8787. Make sure `npm run dev` is running!')
    process.exit(1)
  }

  const puzzle = getDailyPuzzle()
  const subject = `🧩 Relatle #${puzzle.id} - Today's Multi-Definition Puzzle (${puzzle.date})`

  if (gmailAppPass) {
    console.log('📧 Sending via Gmail SMTP using Nodemailer native `amp` property...')
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailAppPass,
      },
    })

    const mailOptions = {
      from: gmailUser, // Exact email matching Gmail Developer settings
      to: targetEmail,
      subject,
      text: `Play today's Relatle puzzle: ${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}`,
      html: `<!doctype html><html><body><p>Your email client does not support interactive AMP emails. <a href="${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}">Click here to play online</a>.</p></body></html>`,
      amp: ampHtml,
    }

    const info = await transporter.sendMail(mailOptions)
    console.log(`✅ Test AMP Email sent successfully via Gmail SMTP to ${targetEmail}! Message ID: ${info.messageId}`)
  } else if (resendApiKey) {
    console.log('📡 Sending via Resend SMTP...')
    try {
      const transporter = nodemailer.createTransport({
        host: 'smtp.resend.com',
        port: 465,
        secure: true,
        auth: {
          user: 'resend',
          pass: resendApiKey,
        },
      })

      const mailOptions = {
        from: `onboarding@resend.dev`,
        to: targetEmail,
        subject,
        text: `Play today's Relatle puzzle: ${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}`,
        html: `<!doctype html><html><body><p>Your email client does not support interactive AMP emails. <a href="${publicHttpsUrl}/?email=${encodeURIComponent(targetEmail)}">Click here to play online</a>.</p></body></html>`,
        amp: ampHtml,
      }

      const info = await transporter.sendMail(mailOptions)
      console.log(`✅ Test AMP Email sent successfully via Resend SMTP to ${targetEmail}! Message ID: ${info.messageId}`)
    } catch (err) {
      console.error('⚠️ Failed to send via Resend SMTP:', err)
    }
  } else {
    console.log('\n⚠️ No email service configured in .env!')
    console.log('Add GMAIL_APP_PASS="xxxx xxxx xxxx xxxx" to .env for direct Gmail SMTP delivery.')
  }
}

sendTestEmail().catch(console.error)
