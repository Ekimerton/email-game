import type { Hono } from 'hono'
import {
  verifyAccountToken,
  isGeneralLeaderboardDomain,
  COLOR_COMBINATIONS,
  parseColorCombo,
  getColorComboLabel,
  type Bindings,
  type EmailTheme,
  type LeaderboardType
} from '../core'
import {
  getUserSettings,
  updateUserSettings,
  getSubscribers,
  addSubscriber,
  removeSubscriber,
  getEffectiveLeaderboard,
} from '../services'

export function registerAccountApiRoutes(app: Hono<{ Bindings: Bindings }>) {
  app.get('/api/account', async (c) => {
    const token = c.req.query('token') || c.req.header('Authorization')?.replace(/^Bearer\s+/i, '')
    const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
    const verified = verifyAccountToken(token, authSecret)

    if (!verified) {
      return c.json({ success: false, message: 'Invalid or missing authentication token.' }, 401)
    }

    const userProfile = await getUserSettings(c.env, verified.email)
    const subscribers = await getSubscribers(c.env)
    const isSubscribed = subscribers.some(s => s.email.toLowerCase() === verified.email.toLowerCase() && s.status === 'active')
    const theme = userProfile.theme || 'light'

    const colorCombo = userProfile.colorCombo || 'amber-blue'
    const isCustomDomain = !isGeneralLeaderboardDomain(userProfile.domain)
    const currentEffective = getEffectiveLeaderboard(userProfile)

    return c.json({
      success: true,
      email: userProfile.email,
      domain: userProfile.domain,
      isCustomDomain,
      token,
      isSubscribed,
      showOnLeaderboard: userProfile.showOnLeaderboard,
      theme,
      darkMode: theme === 'dark',
      colorCombo,
      primaryColor: userProfile.primaryColor,
      secondaryColor: userProfile.secondaryColor,
      colorCombos: COLOR_COMBINATIONS,
      leaderboardType: userProfile.leaderboardType || currentEffective.type,
      customLeaderboardId: userProfile.customLeaderboardId,
      activeLeaderboardName: currentEffective.name,
      activeLeaderboardType: currentEffective.type,
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
        await addSubscriber(c.env, verified.email)
      } else {
        await removeSubscriber(c.env, verified.email)
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

      const userProfile = await getUserSettings(c.env, verified.email)
      const showOnLeaderboard = Boolean(body.showOnLeaderboard)
      userProfile.showOnLeaderboard = showOnLeaderboard
      await updateUserSettings(c.env, userProfile)

      return c.json({
        success: true,
        showOnLeaderboard,
        message: showOnLeaderboard
          ? '🏆 Your score is now visible on the leaderboard!'
          : '🔒 Your score is now hidden from the leaderboard.'
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

      const userProfile = await getUserSettings(c.env, verified.email)
      let nextTheme: EmailTheme = 'light'
      if (typeof body.theme === 'string') {
        nextTheme = body.theme === 'dark' ? 'dark' : 'light'
      } else if (typeof body.darkMode === 'boolean') {
        nextTheme = body.darkMode ? 'dark' : 'light'
      } else {
        nextTheme = userProfile.theme === 'dark' ? 'light' : 'dark'
      }

      userProfile.theme = nextTheme
      await updateUserSettings(c.env, userProfile)

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

  // React API Endpoint: Toggle Color Combination (AJAX)
  app.post('/api/account/toggle-color-combo', async (c) => {
    try {
      const body = await c.req.json()
      const token = body?.token
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const verified = verifyAccountToken(token, authSecret)

      if (!verified) {
        return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
      }

      const requestedCombo = typeof body.colorCombo === 'string' ? body.colorCombo.trim() : undefined
      if (!requestedCombo) {
        return c.json({ success: false, message: 'Missing colorCombo in request body.' }, 400)
      }

      const { primary, secondary } = parseColorCombo(requestedCombo)
      const userProfile = await getUserSettings(c.env, verified.email)
      userProfile.colorCombo = requestedCombo
      userProfile.primaryColor = primary
      userProfile.secondaryColor = secondary
      await updateUserSettings(c.env, userProfile)

      const comboLabel = getColorComboLabel(requestedCombo)
      return c.json({
        success: true,
        colorCombo: requestedCombo,
        primaryColor: primary,
        secondaryColor: secondary,
        message: `🎨 Color palette updated to ${comboLabel}!`
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to update color preference.' }, 500)
    }
  })

  // React API Endpoint: Toggle Leaderboard (General, Domain, Custom)
  app.post('/api/account/toggle-leaderboard', async (c) => {
    try {
      const body = await c.req.json()
      const token = body?.token
      const authSecret = c.env?.AUTH_SECRET || process.env.AUTH_SECRET
      const verified = verifyAccountToken(token, authSecret)

      if (!verified) {
        return c.json({ success: false, message: 'Invalid authentication token.' }, 401)
      }

      const userProfile = await getUserSettings(c.env, verified.email)
      const requestedType = body?.leaderboardType as LeaderboardType
      const requestedCustomId = typeof body?.customLeaderboardId === 'string' ? body.customLeaderboardId.trim().toUpperCase() : undefined

      if (!['general', 'domain', 'custom'].includes(requestedType)) {
        return c.json({ success: false, message: 'Invalid leaderboardType. Must be general, domain, or custom.' }, 400)
      }

      if (requestedType === 'custom' && !requestedCustomId) {
        return c.json({ success: false, message: 'Missing customLeaderboardId for custom leaderboard.' }, 400)
      }

      // If user is on a public email provider, they cannot select 'domain'
      if (requestedType === 'domain' && isGeneralLeaderboardDomain(userProfile.domain)) {
        return c.json({ success: false, message: 'Domain leaderboards are only available for organization email domains.' }, 400)
      }

      const prevType = userProfile.leaderboardType || (!isGeneralLeaderboardDomain(userProfile.domain) ? 'domain' : 'general')
      const prevCustomId = userProfile.customLeaderboardId

      const isUnchanged =
        requestedType === prevType &&
        (requestedType !== 'custom' || requestedCustomId === prevCustomId)

      userProfile.leaderboardType = requestedType
      if (requestedCustomId) {
        userProfile.customLeaderboardId = requestedCustomId
      }

      await updateUserSettings(c.env, userProfile)

      const targetLabel = requestedType === 'custom'
        ? `Custom (${requestedCustomId})`
        : (requestedType === 'domain' ? `${userProfile.domain}` : 'General')

      const currentEffective = getEffectiveLeaderboard(userProfile)

      return c.json({
        success: true,
        leaderboardType: userProfile.leaderboardType,
        customLeaderboardId: userProfile.customLeaderboardId,
        activeLeaderboardName: currentEffective.name,
        activeLeaderboardType: currentEffective.type,
        message: isUnchanged
          ? `Kept on ${targetLabel} leaderboard.`
          : `Leaderboard updated to ${targetLabel}! Changes will take effect starting tomorrow.`
      })
    } catch (error: any) {
      return c.json({ success: false, message: 'Failed to update leaderboard preference.' }, 500)
    }
  })
}
