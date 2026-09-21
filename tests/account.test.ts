import { describe, it, expect } from 'vitest'
import { app, getFallbackHtml } from '../src/index'
import { generateAccountToken, verifyAccountToken } from '../src/core'

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

  it('should reject request with raw email parameter and no token with 401 Unauthorized', async () => {
    const res = await app.request('/api/account?email=victim@company.com')
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

  it('should toggle theme between light and dark with a valid token', async () => {
    // 1. Initially default to light
    const initRes = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    const initData = await initRes.json() as any
    expect(initData.theme).toBe('light')
    expect(initData.darkMode).toBe(false)

    // 2. Enable dark mode
    const darkRes = await app.request('/api/account/toggle-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, theme: 'dark' })
    })
    expect(darkRes.status).toBe(200)
    const darkData = await darkRes.json() as any
    expect(darkData.success).toBe(true)
    expect(darkData.theme).toBe('dark')
    expect(darkData.darkMode).toBe(true)
    expect(darkData.message).toContain('Dark mode enabled')

    // 3. Verify settings reflect dark mode
    const checkDarkRes = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    const checkDarkData = await checkDarkRes.json() as any
    expect(checkDarkData.theme).toBe('dark')
    expect(checkDarkData.darkMode).toBe(true)

    // 4. Switch back to light mode using darkMode boolean
    const lightRes = await app.request('/api/account/toggle-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: validToken, darkMode: false })
    })
    expect(lightRes.status).toBe(200)
    const lightData = await lightRes.json() as any
    expect(lightData.success).toBe(true)
    expect(lightData.theme).toBe('light')
    expect(lightData.darkMode).toBe(false)
    expect(lightData.message).toContain('Light mode enabled')

    // 5. Verify settings reflect light mode
    const checkLightRes = await app.request(`/api/account?token=${encodeURIComponent(validToken)}`)
    const checkLightData = await checkLightRes.json() as any
    expect(checkLightData.theme).toBe('light')
    expect(checkLightData.darkMode).toBe(false)
  })

  it('should reject subscription, privacy, and theme toggles with invalid token', async () => {
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

    const themeRes = await app.request('/api/account/toggle-theme', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: invalidToken, theme: 'dark' })
    })
    expect(themeRes.status).toBe(401)
  })

  it('should include the spoof-proof account link in the fallback HTML', () => {
    const html = getFallbackHtml({
      email: testEmail,
      domain: 'example.com',
      daysPlayed: 3,
      coworkerCount: 5,
      playerCount: 10,
      playUrl: 'https://inboxed.fun',
    })

    expect(html).toContain('update your account preferences')
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

  it('should completely hide users from the leaderboard when showOnLeaderboard is false', async () => {
    const userA = 'visible_player@acme.corp'
    const userB = 'hidden_player@acme.corp'
    const tokenB = generateAccountToken(userB)

    // 1. Submit winning guesses for both users
    const puzzle = (await import('../src/game')).getDailyPuzzle()
    await app.request(`/api/guess?email=${encodeURIComponent(userA)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })
    await app.request(`/api/guess?email=${encodeURIComponent(userB)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
    })

    // 2. Hide userB from leaderboard
    await app.request('/api/account/toggle-privacy', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: tokenB, showOnLeaderboard: false })
    })

    // 3. Fetch leaderboard
    const lbRes = await app.request(`/api/leaderboard?domain=acme.corp&email=${encodeURIComponent(userA)}`)
    expect(lbRes.status).toBe(200)
    const lbData = await lbRes.json() as any
    const players = lbData.items?.[0]?.players || []

    const emails = players.map((p: any) => p.email)
    expect(emails).toContain(userA)
    expect(emails).not.toContain(userB)
  })

  it('should render the account preferences SPA page matching the AMP game aesthetic', async () => {
    const res = await app.request('/account?token=' + encodeURIComponent(validToken))
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('<!doctype html>')
    expect(html).toContain('INBOXED')
    expect(html).toContain('Account &amp; Preferences')
    expect(html).toContain('background-color: #ffffff')
    expect(html).toContain('section-divider')
    expect(html).toContain('#14532d')
    expect(html).toContain('Game made with ❤️ by')
    expect(html).toContain('https://ekimerton.github.io')
    expect(html).toContain('Ekim')
  })

  it('should return top 5 players plus the current player if they are ranked outside top 5', async () => {
    const domain = `testdomain-${Date.now()}.com`
    const puzzle = (await import('../src/game')).getDailyPuzzle()

    // Create 8 players with different scores
    for (let i = 1; i <= 8; i++) {
      const email = `player${i}@${domain}`
      for (let w = 0; w < i - 1; w++) {
        await app.request(`/api/guess?email=${encodeURIComponent(email)}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ 'user-guess': 'ZZZZZ' }).toString()
        })
      }
      await app.request(`/api/guess?email=${encodeURIComponent(email)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ 'user-guess': puzzle.word }).toString()
      })
    }

    // Fetch as player8 (rank 8, outside top 5)
    const player8Email = `player8@${domain}`
    const res8 = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(player8Email)}&date=${puzzle.date}`)
    expect(res8.status).toBe(200)
    const data8 = (await res8.json()) as any
    const players8 = data8.items[0].players

    // Should return top 5 + player 8 (total 6 entries)
    expect(players8.length).toBe(6)
    expect(players8[0].rank).toBe(1)
    expect(players8[0].email).toBe(`player1@${domain}`)
    expect(players8[0].isCurrentPlayer).toBe(false)

    expect(players8[1].rank).toBe(2)
    expect(players8[2].rank).toBe(3)
    expect(players8[3].rank).toBe(4)
    expect(players8[4].rank).toBe(5)

    expect(players8[5].rank).toBe(8)
    expect(players8[5].email).toBe(player8Email)
    expect(players8[5].isCurrentPlayer).toBe(true)

    // Fetch as player3 (rank 3, inside top 5)
    const player3Email = `player3@${domain}`
    const res3 = await app.request(`/api/leaderboard?domain=${domain}&email=${encodeURIComponent(player3Email)}&date=${puzzle.date}`)
    expect(res3.status).toBe(200)
    const data3 = (await res3.json()) as any
    const players3 = data3.items[0].players

    // Should return exactly top 5 without duplicates
    expect(players3.length).toBe(5)
    expect(players3[2].rank).toBe(3)
    expect(players3[2].email).toBe(player3Email)
    expect(players3[2].isCurrentPlayer).toBe(true)
  })

  it('should render dark mode fallback HTML when theme is dark', () => {
    const html = getFallbackHtml({
      email: testEmail,
      domain: 'example.com',
      daysPlayed: 3,
      coworkerCount: 5,
      playerCount: 10,
      playUrl: 'https://inboxed.fun',
      theme: 'dark',
    })

    expect(html).toContain('background-color: #121212')
    expect(html).toContain('background-color: #18181b')
    expect(html).toContain('color: #f4f4f5')
  })

  it('should render dark mode AMP email when theme=dark parameter is provided', async () => {
    const res = await app.request(`/?email=${encodeURIComponent(testEmail)}&theme=dark&forceHttps=true`)
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('background-color: #121212')
    expect(html).toContain('background-color: #18181b')
    expect(html).toContain('color: #f4f4f5')
  })

  it('should render the Dark Mode switch in the account preferences page', async () => {
    const res = await app.request('/account?token=' + encodeURIComponent(validToken))
    expect(res.status).toBe(200)
    const html = await res.text()

    expect(html).toContain('Dark Mode')
    expect(html).toContain('/api/account/toggle-theme')
    expect(html).toContain('body.dark-theme')
  })
})
