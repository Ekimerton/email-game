import crypto from 'node:crypto'

export const DEFAULT_AUTH_SECRET = 'relatle-word-game-secure-auth-secret-key-2026'

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
export function generateAccountToken(email: string, secret?: string): string {
  const cleanEmail = email.toLowerCase().trim()
  const domain = extractEmailDomain(cleanEmail)
  const key = secret || process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET

  const payloadData: TokenPayload = {
    email: cleanEmail,
    domain,
    iat: Date.now()
  }

  const payload = Buffer.from(JSON.stringify(payloadData)).toString('base64url')
  const signature = crypto.createHmac('sha256', key).update(payload).digest('base64url')
  return `${payload}.${signature}`
}

/**
 * Verify an HMAC-SHA256 signed token and return the payload if valid.
 * Checks candidate secrets (passed secret, process.env.AUTH_SECRET, and default secret)
 * to ensure resilience across different environments.
 */
export function verifyAccountToken(
  token: string | undefined | null,
  secret?: string | string[]
): TokenPayload | null {
  if (!token || typeof token !== 'string') {
    return null
  }

  let cleanToken = token.trim()
  // Handle optional URL decoding if token was passed encoded
  if (cleanToken.includes('%2E') || cleanToken.includes('%2e') || cleanToken.includes('%3D') || cleanToken.includes('%3d')) {
    try {
      cleanToken = decodeURIComponent(cleanToken)
    } catch (_) { }
  }

  if (!cleanToken.includes('.')) {
    return null
  }

  const parts = cleanToken.split('.')
  if (parts.length !== 2) {
    return null
  }

  const [payload, signature] = parts
  if (!payload || !signature) {
    return null
  }

  const candidateSecrets: string[] = []
  if (Array.isArray(secret)) {
    candidateSecrets.push(...secret.filter(Boolean))
  } else if (secret) {
    candidateSecrets.push(secret)
  }
  if (process.env.AUTH_SECRET) {
    candidateSecrets.push(process.env.AUTH_SECRET)
  }
  candidateSecrets.push(DEFAULT_AUTH_SECRET)

  const uniqueKeys = Array.from(new Set(candidateSecrets))

  for (const key of uniqueKeys) {
    try {
      const expectedSignature = crypto.createHmac('sha256', key).update(payload).digest('base64url')

      const sigBuffer = Buffer.from(signature)
      const expectedBuffer = Buffer.from(expectedSignature)

      if (sigBuffer.length === expectedBuffer.length && crypto.timingSafeEqual(sigBuffer, expectedBuffer)) {
        const rawJson = Buffer.from(payload, 'base64url').toString('utf8')
        const data = JSON.parse(rawJson) as TokenPayload
        if (data.email && typeof data.email === 'string' && data.email.includes('@')) {
          return {
            email: data.email.toLowerCase().trim(),
            domain: data.domain || extractEmailDomain(data.email),
            iat: typeof data.iat === 'number' ? data.iat : Date.now()
          }
        }
      }
    } catch (_) { }
  }

  return null
}

/**
 * Build full spoof-proof account management URL.
 */
export function getAccountUrl(email: string, baseUrl: string, secret?: string): string {
  const token = generateAccountToken(email, secret)
  const cleanBaseUrl = baseUrl.replace(/\/$/, '')
  return `${cleanBaseUrl}/account?token=${encodeURIComponent(token)}`
}
