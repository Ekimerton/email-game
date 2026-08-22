import { describe, it, expect } from 'vitest'
import { generateAccountToken, verifyAccountToken, getAccountUrl, extractEmailDomain } from '../src/auth'

describe('Spoof-Proof Auth Tokens (HMAC-SHA256)', () => {
  it('should extract domain properly from email', () => {
    expect(extractEmailDomain('alice@acme.com')).toBe('acme.com')
    expect(extractEmailDomain('bob@engineering.nvidia.com')).toBe('engineering.nvidia.com')
    expect(extractEmailDomain('invalid')).toBe('public')
  })

  it('should generate and successfully verify a valid signed account token', () => {
    const email = 'player@company.com'
    const token = generateAccountToken(email)

    expect(token).toBeDefined()
    expect(token.includes('.')).toBe(true)

    const payload = verifyAccountToken(token)
    expect(payload).not.toBeNull()
    expect(payload?.email).toBe('player@company.com')
    expect(payload?.domain).toBe('company.com')
    expect(typeof payload?.iat).toBe('number')
  })

  it('should reject a tampered token where the email payload was modified', () => {
    const email = 'alice@company.com'
    const token = generateAccountToken(email)
    const [payload, signature] = token.split('.')

    // Attacker tries to modify payload to impersonate bob@company.com
    const forgedPayload = Buffer.from(JSON.stringify({ email: 'bob@company.com', domain: 'company.com', iat: Date.now() })).toString('base64url')
    const forgedToken = `${forgedPayload}.${signature}`

    const result = verifyAccountToken(forgedToken)
    expect(result).toBeNull()
  })

  it('should reject a token with an invalid signature', () => {
    const email = 'alice@company.com'
    const token = generateAccountToken(email)
    const [payload] = token.split('.')
    const invalidSignatureToken = `${payload}.invalidSignature12345`

    const result = verifyAccountToken(invalidSignatureToken)
    expect(result).toBeNull()
  })

  it('should reject tokens signed with a different secret key', () => {
    const email = 'alice@company.com'
    const tokenWithSecretA = generateAccountToken(email, 'secret-key-A')

    const verifiedWithSecretB = verifyAccountToken(tokenWithSecretA, 'secret-key-B')
    expect(verifiedWithSecretB).toBeNull()

    const verifiedWithSecretA = verifyAccountToken(tokenWithSecretA, 'secret-key-A')
    expect(verifiedWithSecretA).not.toBeNull()
    expect(verifiedWithSecretA?.email).toBe('alice@company.com')
  })

  it('should reject null, undefined, empty, or malformed tokens', () => {
    expect(verifyAccountToken(null)).toBeNull()
    expect(verifyAccountToken(undefined)).toBeNull()
    expect(verifyAccountToken('')).toBeNull()
    expect(verifyAccountToken('not.a.valid.jwt.shape')).toBeNull()
    expect(verifyAccountToken('randomstringwithoutdot')).toBeNull()
  })

  it('should construct correct account URL with encoded token', () => {
    const email = 'user@example.com'
    const baseUrl = 'https://email-game.teamify.workers.dev'
    const accountUrl = getAccountUrl(email, baseUrl)

    expect(accountUrl).toContain('https://email-game.teamify.workers.dev/account?token=')
    const tokenParam = new URL(accountUrl).searchParams.get('token')
    expect(tokenParam).toBeDefined()
    const verified = verifyAccountToken(tokenParam!)
    expect(verified?.email).toBe('user@example.com')
  })
})
