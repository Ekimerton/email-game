export const COMMON_EMAIL_DOMAINS = new Set([
  'aol.com', 'att.net', 'comcast.net', 'gmail.com', 'googlemail.com', 'hotmail.com',
  'icloud.com', 'live.com', 'mac.com', 'mail.com', 'me.com', 'msn.com', 'outlook.com',
  'proton.me', 'protonmail.com', 'verizon.net', 'yahoo.com',
])

export function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  }[character] || character))
}
