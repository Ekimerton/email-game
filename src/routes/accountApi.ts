import type { Hono } from 'hono'
import { verifyAccountToken, type Bindings, type EmailTheme } from '../core'
import { getUserSettings, updateUserSettings, getSubscribers, addSubscriber, removeSubscriber } from '../services'

export function registerAccountApiRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.get('/api/account', async (c) => {
    const token = c.req.query('token') || c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyAccountToken(token, authSecret)

    if (!verified) {
      return c.json({ success: false, message: 'Invalid or missing authentication token.' }, 401)
    }

    const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
    const subscribers = await getSubscribers(c.env?.GAME_STATE_KV)
    const isSubscribed = subscribers.some(s => s.email.toLowerCase() === verified.email.toLowerCase() && s.status === 'active')
    const theme = userProfile.theme || 'light'

    return c.json({
      success: true,
      email: userProfile.email,
      domain: userProfile.domain,
      token,
      isSubscribed,
      showOnLeaderboard: userProfile.showOnLeaderboard,
      theme,
      darkMode: theme === 'dark'
    })
  })

  // React API Endpoint: Toggle Subscription (AJAX)
  app.post('/api/account/toggle-subscription', async (c) => {
    try {
      const body = await c.req.json()
      const token = body?.token
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const verified = verifyAccountToken(token, authSecret)

      if (!verified) {
        return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
      }

      const targetSubscribed = Boolean(body.subscribed)
      if (targetSubscribed) {
        await addSubscriber(c.env?.GAME_STATE_KV, verified.email)
      } else {
        await removeSubscriber(c.env?.GAME_STATE_KV, verified.email)
      }

      return c.json({
        success: true,
        isSubscribed: targetSubscribed,
        message: targetSubscribed ? '🎉 Subscribed to daily 9:00 AM PST emails!' : 'Unsubscribed from daily emails.'
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to update subscription.' }, 500)
    }
  })

  // React API Endpoint: Toggle Leaderboard Privacy (AJAX)
  app.post('/api/account/toggle-privacy', async (c) => {
    try {
      const body = await c.req.json()
      const token = body?.token
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const verified = verifyAccountToken(token, authSecret)

      if (!verified) {
        return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
      }

      const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
      const showOnLeaderboard = Boolean(body.showOnLeaderboard)
      userProfile.showOnLeaderboard = showOnLeaderboard
      await updateUserSettings(c.env?.GAME_STATE_KV, userProfile)

      return c.json({
        success: true,
        showOnLeaderboard,
        message: showOnLeaderboard
          ? `🏆 Your email is now visible on the ${userProfile.domain} leaderboard!`
          : `🔒 You are now hidden from the ${userProfile.domain} leaderboard.`
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to update privacy preference.' }, 500)
    }
  })

  // React API Endpoint: Toggle Theme / Dark Mode (AJAX)
  app.post('/api/account/toggle-theme', async (c) => {
    try {
      const body = await c.req.json()
      const token = body?.token
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const verified = verifyAccountToken(token, authSecret)

      if (!verified) {
        return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
      }

      const userProfile = await getUserSettings(c.env?.GAME_STATE_KV, verified.email)
      let nextTheme: EmailTheme = 'light'
      if (typeof body.theme === 'string') {
        nextTheme = body.theme === 'dark' ? 'dark' : 'light'
      } else if (typeof body.darkMode === 'boolean') {
        nextTheme = body.darkMode ? 'dark' : 'light'
      } else {
        nextTheme = userProfile.theme === 'dark' ? 'light' : 'dark'
      }

      userProfile.theme = nextTheme
      await updateUserSettings(c.env?.GAME_STATE_KV, userProfile)

      return c.json({
        success: true,
        theme: nextTheme,
        darkMode: nextTheme === 'dark',
        message: nextTheme === 'dark'
          ? '🌙 Dark mode enabled for your daily emails!'
          : '☀️ Light mode enabled for your daily emails!'
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to update theme preference.' }, 500)
    }
  })
}
