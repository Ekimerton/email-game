import { getDailyPuzzle } from '../puzzleLogic'
import { getAccountUrl } from '../auth'
import type { EmailTheme } from '../emailThemes'
import { COMMON_EMAIL_DOMAINS, escapeHtml } from './htmlUtils'

export function getFallbackHtml(options: {
  email: string
  domain: string
  daysPlayed: number
  coworkerCount: number
  playerCount?: number
  playUrl: string
  accountUrl?: string
  theme?: EmailTheme
}): string {
  const { email, domain, coworkerCount, playerCount = 0, playUrl, theme = 'light' } = options
  const puzzle = getDailyPuzzle()
  const isDark = theme === 'dark'

  // Use clean public URL without raw query string email parameters to pass Gmail security filters
  const cleanPlayUrl = playUrl.split('?')[0]
  const origin = cleanPlayUrl.replace(/\/$/, '')
  const logoUrl = `${origin}/logo.png`
  const accountUrl = options.accountUrl || getAccountUrl(email, cleanPlayUrl)
  const safeEmail = escapeHtml(email)
  const safeDomain = escapeHtml(domain)
  const safePlayUrl = escapeHtml(cleanPlayUrl)
  const safeAccountUrl = escapeHtml(accountUrl)
  const safeLogoUrl = escapeHtml(logoUrl)
  const communityMessage = COMMON_EMAIL_DOMAINS.has(domain.toLowerCase())
    ? `Join ${playerCount} players playing the game today.`
    : `Join ${coworkerCount} coworkers playing in the ${safeDomain} org.`

  const bodyBg = isDark ? '#121212' : '#ffffff'
  const cardBg = isDark ? '#18181b' : '#f4f4f5'
  const cardBorder = isDark ? '#27272a' : '#e4e4e7'
  const bodyText = isDark ? '#f4f4f5' : '#18181b'
  const strongText = isDark ? '#ffffff' : '#18181b'
  const pText = isDark ? '#e4e4e7' : '#27272a'
  const dividerColor = isDark ? '#27272a' : '#e4e4e7'
  const mutedText = isDark ? '#a1a1aa' : '#71717a'
  const subStrongText = isDark ? '#d4d4d8' : '#52525b'
  const ctaColor = isDark ? '#C4F7CA' : '#14532d'

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed #${puzzle.id} - Daily Word Puzzle</title>
</head>
<body style="margin: 0; padding: 0; background-color: ${bodyBg}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: ${bodyText};">
  <div style="max-width: 480px; margin: 0 auto; padding: 12px 8px;">
    <div style="background-color: ${cardBg}; border: 1px solid ${cardBorder}; border-radius: 12px; padding: 20px 16px; box-sizing: border-box;">
      <div style="text-align: center; margin: 0 0 20px;">
        <a href="${safePlayUrl}" style="text-decoration: none; display: inline-block;">
          <img src="${safeLogoUrl}" alt="INBOXED" width="160" height="38" style="display: block; margin: 0 auto; width: 160px; height: 38px; border: 0; outline: none; text-decoration: none;">
        </a>
      </div>

      <div style="padding: 4px 0 16px; text-align: left;">
        <p style="font-size: 15px; font-weight: 600; line-height: 1.55; color: ${pText}; margin: 0;">
          <strong style="color: ${strongText};">${safeEmail}</strong> is inviting you to play Inboxed, the daily word game in your inbox. ${communityMessage}
        </p>
        <a href="${safePlayUrl}" style="display: block; color: ${ctaColor}; font-size: 14px; font-weight: 800; margin-top: 16px; text-align: center; text-decoration: underline;">Sign up to play →</a>
      </div>

      <div style="border-top: 1px solid ${dividerColor};"></div>
      <div style="padding: 14px 0 2px; text-align: left; font-size: 12px; line-height: 1.5; color: ${mutedText};">
        <strong style="color: ${subStrongText};">Seeing this while trying to load the game?</strong><br>
        <p style="margin: 6px 0 0;">Your email client might not be supported. This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.</p>
        <p style="margin: 4px 0 0;">You can <a href="${safeAccountUrl}" style="color: ${ctaColor}; font-weight: 700; text-decoration: underline;">update your account preferences</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>`
}
