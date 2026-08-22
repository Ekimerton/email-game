import { describe, it, expect } from 'vitest'
import { app, getFallbackHtml } from '../src/index'
import { generateAccountToken, verifyAccountToken } from '../src/auth'

describe('Spoof-Proof Account & Preferences API', () => {
  const testEmail = 'alice@example.com'
  const validToken = generateAccountToken(testEmail)

  it('should authenticate user and return preferences with a valid signed token', async () => {
    const res = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    expect(res.status).toBe(200)

    const data = await res.json() as any
    expect(data.success).toBe(true)
    expect(data.email).toBe(testEmail)
    expect(data.domain).toBe('example.com')
    expect(data.token).toBe(validToken)
    expect(typeof data.isSubscribed).toBe('boolean')
    expect(typeof data.showOnLeaderboard).toBe('boolean')
  })

  it('should reject request without token with 401 Unauthorized', async () => {
    const res = await app.request('/api/account')
    expect(res.status).toBe(401)

    const data = await res.json() as any
    expect(data.success).toBe(false)
    expect(data.message).toContain('Invalid or missing')
  })

  it('should reject request with forged or tampered token with 401 Unauthorized', async () => {
    const [payload, signature] = validToken.split('.')
    // Tamper with payload
    const tamperedPayload = Buffer.from(JSON.stringify({ email: 'hacker@example.com', domain: 'example.com', iat: Date.now() })).toString('base64url')
    const tamperedToken = `${tamperedPayload}.${signature}`

    const res = await app.request(`/api/account?token=${encodeURIComponent(tamperedToken)}`)
    expect(res.status).toBe(401)

    const data = await res.json() as any
    expect(data.success).toBe(false)
  })

  it('should toggle email subscription with a valid token', async () => {
    // 1. Subscribe
    const subRes = await app.request('/api/account/toggle-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, subscribed: true })
    })
    expect(subRes.status).toBe(200)
    const subData = await subRes.json() as any
    expect(subData.success).toBe(true)
    expect(subData.isSubscribed).toBe(true)

    // 2. Verify account status shows subscribed
    const checkRes = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    const checkData = await checkRes.json() as any
    expect(checkData.isSubscribed).toBe(true)

    // 3. Unsubscribe
    const unsubRes = await app.request('/api/account/toggle-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, subscribed: false })
    })
    expect(unsubRes.status).toBe(200)
    const unsubData = await unsubRes.json() as any
    expect(unsubData.success).toBe(true)
    expect(unsubData.isSubscribed).toBe(false)
  })

  it('should toggle leaderboard privacy with a valid token', async () => {
    // 1. Set privacy to false (hide name on leaderboard)
    const privRes = await app.request('/api/account/toggle-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, showOnLeaderboard: false })
    })
    expect(privRes.status).toBe(200)
    const privData = await privRes.json() as any
    expect(privData.success).toBe(true)
    expect(privData.showOnLeaderboard).toBe(false)

    // 2. Check settings reflect change
    const checkRes = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    const checkData = await checkRes.json() as any
    expect(checkData.showOnLeaderboard).toBe(false)

    // 3. Reset back to visible
    const resetRes = await app.request('/api/account/toggle-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, showOnLeaderboard: true })
    })
    expect(resetRes.status).toBe(200)
    const resetData = await resetRes.json() as any
    expect(resetData.showOnLeaderboard).toBe(true)
  })

  it('should reject subscription and privacy toggles with invalid token', async () => {
    const invalidToken = 'invalid.token.signature'

    const subRes = await app.request('/api/account/toggle-subscription', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: invalidToken, subscribed: true })
    })
    expect(subRes.status).toBe(401)

    const privRes = await app.request('/api/account/toggle-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: invalidToken, showOnLeaderboard: false })
    })
    expect(privRes.status).toBe(401)
  })

  it('should include the spoof-proof account link in the fallback HTML', () => {
    const html = getFallbackHtml({
      email: testEmail,
      domain: 'example.com',
      daysPlayed: 3,
      coworkerCount: 5,
      playUrl: 'https://email-game.teamify.workers.dev',
    })

    expect(html).toContain('Manage Account &amp; Preferences')
    expect(html).toContain('/account?token=')
    
    // Extract token from fallback HTML and verify validity
    const match = html.match(/\/account\?token=([^"'\s&]+)/)
    expect(match).not.toBeNull()
    const extractedToken = decodeURIComponent(match![1])
    const verified = verifyAccountToken(extractedToken)
    expect(verified?.email).toBe(testEmail)
  })

  it('should include the spoof-proof account link in the rendered root AMP HTML', async () => {
    const res = await app.request(`/?email=${encodeURIComponent(testEmail)}`)
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('Manage')
    expect(html).toContain('Account & Preferences')
    expect(html).toContain('/account?token=')

    const match = html.match(/\/account\?token=([^"'\s&]+)/)
    expect(match).not.toBeNull()
    const extractedToken = decodeURIComponent(match![1])
    const verified = verifyAccountToken(extractedToken)
    expect(verified?.email).toBe(testEmail)
  })

  it('should serve the /account React SPA page', async () => {
    const res = await app.request(`/account?token=${encodeURIComponent(validToken)}`)
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('Word Game Account & Preferences')
    expect(html).toContain('react.production.min.js')
    expect(html).toContain('Daily 9:00 AM PST Emails')
    expect(html).toContain('Domain Leaderboard Visibility')
  })
})
