import crypto from 'node:crypto'

const DEFAULT_AUTH_SECRET = 'relatle-word-game-secure-auth-secret-key-2026'

export interface TokenPayload {
  email: string
  domain: string
  iat: number
}

// Extract domain from email
export function extractEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return 'public'
  const domain = email.split('@')[1].toLowerCase().trim()
  return domain || 'public'
}

/**
 * Generate a tamper-proof HMAC-SHA256 signed token for a user email.
 * Format: <base64url_payload>.<base64url_signature>
 */
export function generateAccountToken(email: string, secret: string = DEFAULT_AUTH_SECRET): string {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractEmailDomain(cleanEmail)
  const payloadData: TokenPayload = {
    email: cleanEmail,
    domain,
    iat: Date.now()
  }

  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url')
  const signature = crypto.createHmac('sha256', secret || DEFAULT_AUTH_SECRET).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

/**
 * Verify an HMAC-SHA256 signed token and return the payload if valid.
 * Returns null if token is forged, tampered with, or malformed.
 */
export function verifyAccountToken(token: string | undefined | null, secret: string = DEFAULT_AUTH_SECRET): TokenPayload | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) {
    return null
  }

  const parts = token.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payload, signature] = parts
  if (!payload || !signature) {
    return null
  }

  const key = secret || DEFAULT_AUTH_SECRET
  const expectedSignature = crypto.createHmac('sha256', key).update(payload).digest('base64url')

  const sigBuffer = Buffer.from(signature)
  const expectedBuffer = Buffer.from(expectedSignature)

  if (sigBuffer.length !== expectedBuffer.length) {
    return null
  }

  // Constant-time comparison to prevent timing attacks
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
    return null
  }

  try {
    const rawJson = Buffer.from(payload, 'base64url').toString('utf8')
    const data = JSON.parse(rawJson) as TokenPayload
    if (!data.email || typeof data.email !== 'string' || !data.email.includes('@')) {
      return null
    }

    return {
      email: data.email.toLowerCase().trim(),
      domain: data.domain || extractEmailDomain(data.email),
      iat: typeof data.iat === 'number' ? data.iat : Date.now()
    }
  } catch {
    return null
  }
}

/**
 * Build full spoof-proof account management URL.
 */
export function getAccountUrl(email: string, baseUrl: string, secret?: string): string {
  const token = generateAccountToken(email, secret)
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  return `${cleanBaseUrl}/account?token=${encodeURIComponent(token)}`
}
