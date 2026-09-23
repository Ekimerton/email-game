/**
 * emailService.ts
 *
 * Handles email dispatch via Mailgun REST API.
 * Works natively in Cloudflare Workers and Node.js using standard fetch.
 */

import { escapeHtml } from '../game'

export interface SendEmailOptions {
  apiKey?: string
  domain?: string
  from?: string
  to: string
  subject: string
  text: string
  html: string
  ampHtml?: string
  headers?: Record<string, string>
}

/**
 * Dispatch an email via Mailgun's Messages REST API.
 * In development or testing without API keys, logs a notice and returns success.
 */
export async function sendMailgunEmail(
  options: SendEmailOptions
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const apiKey = options.apiKey || process.env.MAILGUN_API_KEY
  const domain = options.domain || process.env.MAILGUN_DOMAIN || 'inboxed.fun'
  const rawFrom = options.from || process.env.SENDER_EMAIL || 'Inboxed <game@inboxed.fun>'
  const from = rawFrom.includes('<') && rawFrom.includes('>')
    ? rawFrom.trim()
    : `Inboxed <${rawFrom.trim()}>`

  if (!apiKey) {
    console.warn(`[emailService] Mailgun API key not provided. Simulated send to ${options.to} (${options.subject})`)
    return { ok: true, id: `simulated-${Date.now()}` }
  }

  try {
    const endpoint = `https://api.mailgun.net/v3/${domain}/messages`
    const form = new FormData()
    form.append('from', from)
    form.append('to', options.to)
    form.append('subject', options.subject)
    form.append('text', options.text)
    form.append('html', options.html)

    if (options.ampHtml) {
      form.append('amp-html', options.ampHtml)
    }

    if (options.headers) {
      for (const [key, val] of Object.entries(options.headers)) {
        form.append(`h:${key}`, val)
      }
    }

    const basicAuth = typeof btoa === 'function'
      ? btoa(`api:${apiKey}`)
      : Buffer.from(`api:${apiKey}`).toString('base64')

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${basicAuth}`,
      },
      body: form,
    })

    if (!res.ok) {
      const errText = await res.text().catch(() => '')
      console.error(`[emailService] Mailgun send error [${res.status}]: ${errText}`)
      return { ok: false, error: errText || `Status ${res.status}` }
    }

    const json = (await res.json().catch(() => ({}))) as { id?: string; message?: string }
    return { ok: true, id: json.id }
  } catch (err: any) {
    console.error('[emailService] Network or fetch error sending email:', err)
    return { ok: false, error: err?.message || 'Network error' }
  }
}

export interface ConfirmationEmailOptions {
  origin?: string
  playUrl?: string
  logoUrl?: string
}

/**
 * Render responsive HTML for the double opt-in confirmation email.
 */
export function renderConfirmationEmailHtml(
  confirmUrl: string,
  options?: ConfirmationEmailOptions
): string {
  let origin = options?.origin
  if (!origin) {
    try {
      origin = new URL(confirmUrl).origin
    } catch {
      origin = 'https://inboxed.fun'
    }
  }
  const cleanOrigin = origin.replace(/\/$/, '')
  const playUrl = options?.playUrl || cleanOrigin
  const logoUrl = options?.logoUrl || `${cleanOrigin}/logo.png`

  const safeConfirmUrl = escapeHtml(confirmUrl)
  const safePlayUrl = escapeHtml(playUrl)
  const safeLogoUrl = escapeHtml(logoUrl)

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Confirm your Inboxed subscription</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f4f4f5; margin: 0; padding: 32px 16px; color: #18181b;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 480px; background-color: #ffffff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px 24px; text-align: center;" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td align="center">
              <div style="text-align: center; margin: 0 0 20px;">
                <a href="${safePlayUrl}" style="text-decoration: none; display: inline-block;">
                  <img src="${safeLogoUrl}" alt="INBOXED" width="160" height="38" style="display: block; margin: 0 auto; width: 160px; height: 38px; border: 0; outline: none; text-decoration: none; font-size: 22px; font-weight: 900; color: #14532d; letter-spacing: 2px;">
                </a>
              </div>
              <h1 style="font-size: 20px; font-weight: 800; color: #18181b; margin: 0 0 12px 0;">
                Confirm your subscription
              </h1>
              <p style="font-size: 14px; color: #52525b; line-height: 1.5; margin: 0 0 24px 0;">
                Thanks for signing up! Please confirm your email address to start receiving daily word puzzles directly inside your inbox every morning at 9:00 AM PST.
              </p>
              <div style="margin: 28px 0;">
                <a href="${safeConfirmUrl}" style="background-color: #14532d; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 13px 26px; border-radius: 8px; display: inline-block;">
                  Confirm Subscription
                </a>
              </div>
              <p style="font-size: 12px; color: #71717a; line-height: 1.5; margin: 20px 0 0 0;">
                Button not working? Copy and paste this link into your browser:<br>
                <a href="${safeConfirmUrl}" style="color: #14532d; word-break: break-all;">${safeConfirmUrl}</a>
              </p>
              <hr style="border: none; border-top: 1px solid #e4e4e7; margin: 24px 0 16px 0;">
              <p style="font-size: 11px; color: #a1a1aa; margin: 0;">
                If you did not request this email, you can safely ignore it.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

export function renderConfirmationEmailText(confirmUrl: string): string {
  return `Confirm your subscription to Inboxed:

Click the link below to start receiving daily word puzzles every morning at 9:00 AM PST:
${confirmUrl}

If you did not request this, you can safely ignore this email.`
}
