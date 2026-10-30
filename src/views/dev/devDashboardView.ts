import { escapeHtml } from '../../game'
import { computeDailyActiveUsers, type DashboardStats, type PlayerScoreRecord, type DomainStats, type DailyActiveUsersPoint } from '../../services'
import type { SubscriberEntry } from '../../core'
import { DEV_DASHBOARD_CSS } from './devDashboardTemplate'

export interface DevDashboardViewParams {
  stats: DashboardStats
  source?: 'prod' | 'local'
  prodOrigin?: string
  fetchError?: string
  activeTab?: 'gameplay' | 'subscribers' | 'settings'
}

function formatShortChartDate(dateStr: string): string {
  if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr || '—'
  const parts = dateStr.split('-')
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const m = parseInt(parts[1], 10)
  const d = parseInt(parts[2], 10)
  return `${months[m - 1] || parts[1]} ${d}`
}

export function getDevDashboardPageHtml(params: DevDashboardViewParams): string {
  const { stats } = params
  const source = params.source || 'prod'
  const isProd = source === 'prod'
  const prodOrigin = params.prodOrigin || 'https://inboxed.fun'
  const fetchError = params.fetchError || ''
  const initialTab = params.activeTab || 'gameplay'

  const devSet = new Set((stats.devTesters || []).map(e => e.toLowerCase().trim()))
  const uniqueAllTimePlayersCount = new Set(stats.allPlays.map(p => p.email.toLowerCase().trim())).size

  const dailyActiveSeries: DailyActiveUsersPoint[] = Array.isArray(stats.dailyActiveUsers) && stats.dailyActiveUsers.length > 0 && typeof stats.dailyActiveUsers[0].unopenedUsers === 'number'
    ? stats.dailyActiveUsers
    : computeDailyActiveUsers(stats.allPlays || [], stats.todayPuzzle?.date, stats.userProfiles, stats.subscribers?.list)
  stats.dailyActiveUsers = dailyActiveSeries

  // Compute DAU chart summary stats and initial SSR bars
  const todayPoint = dailyActiveSeries.find(p => p.date === stats.todayPuzzle?.date) || dailyActiveSeries[dailyActiveSeries.length - 1]
  const todayActiveTotal = todayPoint ? todayPoint.totalActive : 0
  const todayNewCount = todayPoint ? todayPoint.newUsers : 0
  const todayReturningCount = todayPoint ? todayPoint.returningUsers : 0
  const todayFinishedCount = todayPoint ? todayPoint.finishedUsers : 0
  const todayUnfinishedCount = todayPoint ? todayPoint.unfinishedUsers : 0
  const todayOpenedOnlyCount = todayPoint ? (todayPoint.openedOnlyUsers || 0) : 0
  const todayUnopenedCount = todayPoint ? (todayPoint.unopenedUsers || 0) : 0
  const todayOpensTotal = todayPoint ? (todayPoint.totalOpens ?? (todayActiveTotal + todayOpenedOnlyCount)) : 0
  const todayAudienceTotal = todayPoint ? (todayPoint.totalAudience ?? (todayOpensTotal + todayUnopenedCount)) : 0
  const todayCompletionRate = todayPoint ? todayPoint.completionRate : 0

  const peakPoint = dailyActiveSeries.reduce<DailyActiveUsersPoint | null>((best, cur) => {
    if (!best || cur.totalActive >= best.totalActive) return cur
    return best
  }, null)
  const peakActiveTotal = peakPoint ? peakPoint.totalActive : 0
  const peakActiveSub = peakPoint && peakPoint.totalActive > 0
    ? `${formatShortChartDate(peakPoint.date)}${peakPoint.puzzleId ? ` (Puzzle #${peakPoint.puzzleId})` : ''}`
    : 'No plays recorded yet'

  const activeDaysList = dailyActiveSeries.filter(p => p.totalActive > 0)
  const openDaysList = dailyActiveSeries.filter(p => (p.totalOpens ?? p.totalActive) > 0)
  const audienceDaysList = dailyActiveSeries.filter(p => (p.totalAudience ?? p.totalOpens ?? p.totalActive) > 0)
  const totalActiveSessions = dailyActiveSeries.reduce((acc, p) => acc + p.totalActive, 0)
  const totalNewSessions = dailyActiveSeries.reduce((acc, p) => acc + p.newUsers, 0)
  const totalReturningSessions = dailyActiveSeries.reduce((acc, p) => acc + p.returningUsers, 0)
  const totalFinishedSessions = dailyActiveSeries.reduce((acc, p) => acc + (p.finishedUsers || 0), 0)
  const totalUnfinishedSessions = dailyActiveSeries.reduce((acc, p) => acc + (p.unfinishedUsers || 0), 0)
  const totalOpenedOnlySessions = dailyActiveSeries.reduce((acc, p) => acc + (p.openedOnlyUsers || 0), 0)
  const totalUnopenedSessions = dailyActiveSeries.reduce((acc, p) => acc + (p.unopenedUsers || 0), 0)
  const totalOpensSessions = totalFinishedSessions + totalUnfinishedSessions + totalOpenedOnlySessions
  const totalAudienceSessions = totalOpensSessions + totalUnopenedSessions
  const avgActivePerDay = activeDaysList.length > 0
    ? (totalActiveSessions / activeDaysList.length).toFixed(1)
    : '0.0'
  const funnelDayDenom = audienceDaysList.length > 0 ? audienceDaysList.length : (openDaysList.length > 0 ? openDaysList.length : activeDaysList.length)
  const avgFinishedPerDay = funnelDayDenom > 0
    ? (totalFinishedSessions / funnelDayDenom).toFixed(1)
    : '0.0'
  const avgUnfinishedPerDay = funnelDayDenom > 0
    ? (totalUnfinishedSessions / funnelDayDenom).toFixed(1)
    : '0.0'
  const avgOpenedOnlyPerDay = funnelDayDenom > 0
    ? (totalOpenedOnlySessions / funnelDayDenom).toFixed(1)
    : '0.0'
  const avgUnopenedPerDay = funnelDayDenom > 0
    ? (totalUnopenedSessions / funnelDayDenom).toFixed(1)
    : '0.0'
  const returningSharePct = totalActiveSessions > 0
    ? Math.round((totalReturningSessions / totalActiveSessions) * 100)
    : 0
  const overallCompletionPct = totalActiveSessions > 0
    ? Math.round((totalFinishedSessions / totalActiveSessions) * 100)
    : 0
  const overallAttemptRatePct = totalOpensSessions > 0
    ? Math.round((totalActiveSessions / totalOpensSessions) * 100)
    : 0
  const overallOpenRatePct = totalAudienceSessions > 0
    ? Math.round((totalOpensSessions / totalAudienceSessions) * 100)
    : 0

  const rawMaxDau = Math.max(4, ...dailyActiveSeries.map(p => p.totalActive))
  const maxScaleDau = Math.max(4, Math.ceil(rawMaxDau / 4) * 4)
  const yTicks = [
    maxScaleDau,
    Math.round(maxScaleDau * 0.75),
    Math.round(maxScaleDau * 0.5),
    Math.round(maxScaleDau * 0.25),
    0
  ]

  const rawMaxCompletion = Math.max(4, ...dailyActiveSeries.map(p => p.totalAudience ?? p.totalOpens ?? p.totalActive))
  const maxScaleCompletion = Math.max(4, Math.ceil(rawMaxCompletion / 4) * 4)
  const yTicksCompletion = [
    maxScaleCompletion,
    Math.round(maxScaleCompletion * 0.75),
    Math.round(maxScaleCompletion * 0.5),
    Math.round(maxScaleCompletion * 0.25),
    0
  ]

  const defaultSelectedPoint: DailyActiveUsersPoint = [...dailyActiveSeries].reverse().find(p => (p.totalAudience ?? p.totalOpens ?? p.totalActive) > 0) || todayPoint || {
    date: stats.todayPuzzle?.date || '',
    puzzleId: stats.todayPuzzle?.id || '1',
    totalActive: 0,
    newUsers: 0,
    returningUsers: 0,
    newUserEmails: [],
    returningUserEmails: [],
    finishedUsers: 0,
    unfinishedUsers: 0,
    completionRate: 0,
    finishedUserEmails: [],
    unfinishedUserEmails: [],
    totalOpens: 0,
    openedOnlyUsers: 0,
    openedOnlyUserEmails: [],
    unopenedUsers: 0,
    unopenedUserEmails: [],
    totalAudience: 0
  }

  const dauBarsHtml = dailyActiveSeries.map((pt) => {
    const isSelected = pt.date === defaultSelectedPoint.date
    const totalPct = pt.totalActive > 0
      ? Math.max(6, Math.round((pt.totalActive / maxScaleDau) * 100))
      : 0
    const newPct = pt.totalActive > 0 ? Math.round((pt.newUsers / pt.totalActive) * 100) : 0
    const retPct = pt.totalActive > 0 ? (100 - newPct) : 0
    const shortDate = escapeHtml(formatShortChartDate(pt.date))
    const puzLabel = pt.puzzleId ? `#${escapeHtml(String(pt.puzzleId))}` : ''
    const tooltip = `${pt.date}${pt.puzzleId ? ` (Puzzle #${pt.puzzleId})` : ''}: ${pt.totalActive} active (${pt.newUsers} new, ${pt.returningUsers} returning)`

    return `
      <div class="dau-bar-col ${isSelected ? 'selected' : ''}" data-date="${escapeHtml(pt.date)}" data-total="${pt.totalActive}" data-new="${pt.newUsers}" data-returning="${pt.returningUsers}" onclick="selectDauDay('${escapeHtml(pt.date)}')" onmouseenter="selectDauDay('${escapeHtml(pt.date)}')" title="${escapeHtml(tooltip)}">
        <div class="dau-bar-track-wrap">
          <span class="dau-bar-total ${pt.totalActive === 0 ? 'dau-bar-total-zero' : ''}">${pt.totalActive}</span>
          <div class="dau-bar-stack" style="height: ${totalPct}%;">
            <div class="dau-bar-segment dau-bar-new" style="height: ${newPct}%;" title="New users: ${pt.newUsers}">${pt.newUsers > 0 && totalPct >= 22 ? pt.newUsers : ''}</div>
            <div class="dau-bar-segment dau-bar-returning" style="height: ${retPct}%;" title="Returning users: ${pt.returningUsers}">${pt.returningUsers > 0 && totalPct >= 22 ? pt.returningUsers : ''}</div>
          </div>
        </div>
        <div class="dau-bar-x-axis">
          <span class="dau-bar-date-label">${shortDate}</span>
          <span class="dau-bar-puzzle-label">${puzLabel}</span>
        </div>
      </div>
    `
  }).join('\n')

  const completionBarsHtml = dailyActiveSeries.map((pt) => {
    const isSelected = pt.date === defaultSelectedPoint.date
    const fin = pt.finishedUsers || 0
    const unfin = pt.unfinishedUsers || 0
    const openedOnly = pt.openedOnlyUsers || 0
    const unopened = pt.unopenedUsers || 0
    const totalOpens = pt.totalOpens ?? (fin + unfin + openedOnly)
    const totalFunnel = pt.totalAudience ?? (totalOpens + unopened)
    const totalPct = totalFunnel > 0
      ? Math.max(6, Math.round((totalFunnel / maxScaleCompletion) * 100))
      : 0
    const unopenedPct = totalFunnel > 0 ? Math.round((unopened / totalFunnel) * 100) : 0
    const openedOnlyPct = totalFunnel > 0 ? Math.round((openedOnly / totalFunnel) * 100) : 0
    const unfinPct = totalFunnel > 0 ? Math.round((unfin / totalFunnel) * 100) : 0
    const finPct = totalFunnel > 0 && fin > 0 ? Math.max(1, 100 - unopenedPct - openedOnlyPct - unfinPct) : 0
    const shortDate = escapeHtml(formatShortChartDate(pt.date))
    const puzLabel = pt.puzzleId ? `#${escapeHtml(String(pt.puzzleId))}` : ''
    const tooltip = `${pt.date}${pt.puzzleId ? ` (Puzzle #${pt.puzzleId})` : ''}: ${totalFunnel} total (${fin} finished, ${unfin} didn't finish, ${openedOnly} opened only, ${unopened} subscribed not opened)`

    return `
      <div class="dau-bar-col completion-bar-col ${isSelected ? 'selected' : ''}" data-date="${escapeHtml(pt.date)}" data-total="${pt.totalActive}" data-opens="${totalOpens}" data-audience="${totalFunnel}" data-finished="${fin}" data-unfinished="${unfin}" data-opened-only="${openedOnly}" data-unopened="${unopened}" onclick="selectCompletionDay('${escapeHtml(pt.date)}')" onmouseenter="selectCompletionDay('${escapeHtml(pt.date)}')" title="${escapeHtml(tooltip)}">
        <div class="dau-bar-track-wrap">
          <span class="dau-bar-total ${totalFunnel === 0 ? 'dau-bar-total-zero' : ''}">${totalFunnel}</span>
          <div class="dau-bar-stack" style="height: ${totalPct}%;">
            <div class="dau-bar-segment dau-bar-unopened" style="height: ${unopenedPct}%;" title="Subscribed (not opened): ${unopened}">${unopened > 0 && totalPct >= 22 ? unopened : ''}</div>
            <div class="dau-bar-segment dau-bar-opened" style="height: ${openedOnlyPct}%;" title="Opened (no guess): ${openedOnly}">${openedOnly > 0 && totalPct >= 22 ? openedOnly : ''}</div>
            <div class="dau-bar-segment dau-bar-unfinished" style="height: ${unfinPct}%;" title="Attempted & didn't finish: ${unfin}">${unfin > 0 && totalPct >= 22 ? unfin : ''}</div>
            <div class="dau-bar-segment dau-bar-finished" style="height: ${finPct}%;" title="Finished (Solved): ${fin}">${fin > 0 && totalPct >= 22 ? fin : ''}</div>
          </div>
        </div>
        <div class="dau-bar-x-axis">
          <span class="dau-bar-date-label">${shortDate}</span>
          <span class="dau-bar-puzzle-label">${puzLabel}</span>
        </div>
      </div>
    `
  }).join('\n')

  const defaultNewChipsHtml = defaultSelectedPoint.newUserEmails.length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : defaultSelectedPoint.newUserEmails.map(e => `<span class="dau-user-chip dau-chip-new" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  const defaultReturningChipsHtml = defaultSelectedPoint.returningUserEmails.length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : defaultSelectedPoint.returningUserEmails.map(e => `<span class="dau-user-chip dau-chip-returning" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  const defaultFinishedChipsHtml = (defaultSelectedPoint.finishedUserEmails || []).length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : (defaultSelectedPoint.finishedUserEmails || []).map(e => `<span class="dau-user-chip dau-chip-finished" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  const defaultUnfinishedChipsHtml = (defaultSelectedPoint.unfinishedUserEmails || []).length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : (defaultSelectedPoint.unfinishedUserEmails || []).map(e => `<span class="dau-user-chip dau-chip-unfinished" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  const defaultOpenedOnlyChipsHtml = (defaultSelectedPoint.openedOnlyUserEmails || []).length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : (defaultSelectedPoint.openedOnlyUserEmails || []).map(e => `<span class="dau-user-chip dau-chip-opened" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  const defaultUnopenedChipsHtml = (defaultSelectedPoint.unopenedUserEmails || []).length === 0
    ? `<span style="color: #64748b; font-size: 11.5px;">None</span>`
    : (defaultSelectedPoint.unopenedUserEmails || []).map(e => `<span class="dau-user-chip dau-chip-unopened" onclick="openUserSettings('${escapeHtml(e)}')" title="Inspect ${escapeHtml(e)}">${escapeHtml(e)}</span>`).join(' ')

  // Puzzle dropdown options
  const puzzleOptionsHtml = stats.availablePuzzles.map((p) => {
    const isSelected = String(p.id) === String(stats.selectedPuzzle.id)
    const isToday = String(p.id) === String(stats.todayPuzzle.id)
    const label = `${isToday ? '⭐ Today: ' : ''}Puzzle #${p.id} (${p.date || 'Active'}) — ${p.playCount} play${p.playCount === 1 ? '' : 's'}`
    return `<option value="${p.id}" ${isSelected ? 'selected' : ''}>${escapeHtml(label)}</option>`
  }).join('\n')

  // Score rows
  const scoreRowsHtml = stats.selectedPlays.map((play: PlayerScoreRecord) => {
    const safeEmail = escapeHtml(play.email)
    const safeDomain = escapeHtml(play.domain || '')
    const initial = (play.email[0] || '?').toUpperCase()
    const devBadge = play.isDev ? `<span class="dev-badge-small" title="Dev tester prescreen track">🧪 Dev</span>` : ''

    const statusPill = play.hasWon
      ? `<span class="status-pill status-won">🎉 Solved</span>`
      : `<span class="status-pill status-playing">⏳ Playing</span>`

    const scoreTierClass = play.score >= 900
      ? 'score-tier-high'
      : (play.score >= 700 ? 'score-tier-med' : (play.score > 0 ? 'score-tier-low' : 'score-tier-zero'))

    const guessesChips = (play.guesses || []).map((g, idx) => {
      const isLastAndWon = play.hasWon && idx === play.guesses.length - 1
      return `<span class="guess-chip ${isLastAndWon ? 'guess-chip-target' : ''}">${escapeHtml(g)}</span>`
    }).join(' ')

    const guessLabel = play.guessCount === 1 ? '1 guess' : `${play.guessCount} guesses`

    const timeFormatted = play.wonAt || play.updatedAt
      ? new Date(play.wonAt || play.updatedAt!).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '—'

    return `
      <tr class="score-row" data-email="${safeEmail}" data-domain="${safeDomain}" data-status="${play.status}">
        <td>
          <div class="player-cell">
            <div class="avatar">${initial}</div>
            <div class="player-details">
              <span class="player-email">${safeEmail} ${devBadge}</span>
              <span class="domain-pill">@${safeDomain}</span>
            </div>
          </div>
        </td>
        <td>${statusPill}</td>
        <td><span class="score-badge ${scoreTierClass}">${play.score} pts</span></td>
        <td>
          <div class="guesses-wrapper">
            <span class="guess-count-pill">${guessLabel}</span>
            <div class="guess-chips">${guessesChips}</div>
          </div>
        </td>
        <td>${play.hintsUsed > 0 ? `💡 ${play.hintsUsed}` : '—'}</td>
        <td style="color: #94a3b8; font-size: 12px;">${timeFormatted}</td>
      </tr>
    `
  }).join('\n')

  // Domain ranking rows
  const domainRowsHtml = stats.domainRankings.map((d: DomainStats) => {
    const safeDomain = escapeHtml(d.domain)
    const domainLabel = safeDomain === 'general' ? 'general' : `@${safeDomain}`
    return `
      <tr>
        <td><span class="domain-pill">${domainLabel}</span></td>
        <td><strong style="color: #38bdf8;">${d.playerCount}</strong></td>
        <td>${d.subscriberCount}</td>
        <td>${d.avgScore > 0 ? `${d.avgScore} pts` : '—'}</td>
        <td><strong style="color: #34d399;">${d.topScore > 0 ? `${d.topScore} pts` : '—'}</strong></td>
      </tr>
    `
  }).join('\n')

  // Subscriber rows
  const subscribers = stats.subscribers.list || []
  const subRowsHtml = subscribers.map((sub: SubscriberEntry) => {
    const safeEmail = escapeHtml(sub.email)
    const safeDomain = escapeHtml(sub.domain || '')
    const isActive = sub.status === 'active'
    const isDev = devSet.has(sub.email.toLowerCase().trim())
    const statusClass = isActive ? 'status-won' : 'status-lost'
    const statusText = isActive ? 'Active' : 'Unsubscribed'
    const devBadge = isDev ? `<span class="dev-badge-small" title="Dev tester prescreening 42 days ahead">🧪 Dev</span>` : ''
    const dateFormatted = sub.subscribedAt ? new Date(sub.subscribedAt).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }) : 'Unknown'
    const initial = (sub.email[0] || '?').toUpperCase()

    return `
      <tr class="sub-row" data-email="${safeEmail}" data-domain="${safeDomain}" data-status="${sub.status}">
        <td>
          <div class="player-cell">
            <div class="avatar">${initial}</div>
            <div class="player-details">
              <span class="player-email">${safeEmail} ${devBadge}</span>
              <button type="button" class="copy-btn" onclick="copyText('${safeEmail}', this)" title="Copy email address">📋</button>
            </div>
          </div>
        </td>
        <td><span class="domain-pill">${safeDomain ? `@${safeDomain}` : '—'}</span></td>
        <td style="color: #94a3b8; font-size: 12px;">${dateFormatted}</td>
        <td><span class="status-pill ${statusClass}">${statusText}</span></td>
        <td>
          <div class="sub-actions-wrapper">
            <button type="button" class="btn-action" onclick="openUserSettings('${safeEmail}')" title="Inspect user profile & preferences">👤 Settings</button>
            <button type="button" class="btn-action btn-dev-toggle ${isDev ? 'btn-dev-active' : ''}" onclick="toggleDevStatus('${safeEmail}', this)" title="${isDev ? 'Remove from dev prescreen list' : 'Add to dev prescreen list (42 days ahead)'}">${isDev ? '🧪 Remove Dev' : '🧪 Make Dev'}</button>
            <a href="/dev/page/account?email=${encodeURIComponent(sub.email)}" target="_blank" class="btn-action" title="Open user account preferences">⚙️ Account</a>
            <button type="button" class="btn-action" onclick="toggleStatus('${safeEmail}', this)" title="Toggle active/unsubscribed">${isActive ? 'Deactivate' : 'Activate'}</button>
            <button type="button" class="btn-action btn-purge" onclick="purgeSubscriber('${safeEmail}', this)" title="Permanently delete subscriber">🗑️</button>
          </div>
        </td>
      </tr>
    `
  }).join('\n')

  // User profile directory rows
  const userProfiles = stats.userProfiles || []
  const userDirectoryRowsHtml = userProfiles.map((user) => {
    const safeEmail = escapeHtml(user.email)
    const safeDomain = escapeHtml(user.domain || '')
    const initial = (user.email[0] || '?').toUpperCase()
    const devBadge = user.isDev ? `<span class="dev-badge-small" title="Dev tester prescreen track">🧪 Dev</span>` : ''
    const visBadge = user.showOnLeaderboard
      ? `<span class="badge-vis-public">👁️ Visible</span>`
      : `<span class="badge-vis-hidden">🔒 Hidden</span>`
    const themeBadge = user.theme === 'dark'
      ? `<span class="badge-theme-dark">🌙 Dark</span>`
      : `<span class="badge-theme-light">☀️ Light</span>`
    const subBadge = user.isSubscribed
      ? `<span class="status-pill status-won">Active</span>`
      : `<span class="status-pill status-lost">Unsubscribed</span>`
    const trackBadge = user.isDev
      ? `<span class="badge-dev-prescreen" style="font-size: 11px;">42d Ahead</span>`
      : `<span style="color: #64748b; font-size: 12px;">Standard</span>`

    return `
      <tr class="user-profile-row" data-email="${safeEmail}" data-domain="${safeDomain}" data-subscribed="${user.isSubscribed}" data-dev="${user.isDev}" data-played="${user.daysPlayed > 0}">
        <td>
          <div class="player-cell">
            <div class="avatar">${initial}</div>
            <div class="player-details">
              <span class="player-email">${safeEmail} ${devBadge}</span>
              <button type="button" class="copy-btn" onclick="copyText('${safeEmail}', this)" title="Copy email address">📋</button>
            </div>
          </div>
        </td>
        <td><span class="domain-pill">@${safeDomain}</span></td>
        <td>${visBadge}</td>
        <td>${themeBadge}</td>
        <td><strong style="color: #38bdf8;">${user.daysPlayed}</strong> <span style="font-size: 11px; color: #64748b;">day${user.daysPlayed === 1 ? '' : 's'}</span></td>
        <td>${subBadge}</td>
        <td>${trackBadge}</td>
        <td>
          <button type="button" class="btn-inspect" onclick="openUserSettings('${safeEmail}')" title="Inspect user profile & preferences">
            🔍 Inspect
          </button>
        </td>
      </tr>
    `
  }).join('\n')

  // Dev team chips
  const devChipsHtml = (stats.devTesters || []).length === 0
    ? `<span class="dev-empty-notice">No dev testers configured in ${isProd ? 'Production KV' : 'Local KV'}.</span>`
    : (stats.devTesters || []).map((tEmail: string) => `
      <span class="dev-team-chip">
        <span>${escapeHtml(tEmail)}</span>
        <button type="button" class="btn-chip-remove" onclick="removeDevTester('${escapeHtml(tEmail)}')" title="Remove ${escapeHtml(tEmail)} from dev prescreen list">×</button>
      </span>
    `).join('')

  // Safe serialized JSON for client script
  const dashboardJson = JSON.stringify(stats).replace(/</g, '\\u003c')
  const css = typeof DEV_DASHBOARD_CSS !== 'undefined' ? DEV_DASHBOARD_CSS : ''

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev - Live Production Analytics Dashboard</title>
  <style>${css}</style>
</head>
<body>
  <header class="dev-header">
    <div class="header-inner">
      <div class="brand-section">
        <img src="/logo-new.png" alt="INBOXED" height="28" style="height: 28px; width: auto; display: block;">
        <span class="badge-dev">ANALYTICS DASHBOARD</span>
        <span id="source-badge" class="badge-source ${isProd ? 'badge-prod' : 'badge-local-source'}">
          ${isProd ? '🟢 Live Production DB' : '💻 Local Dev KV'}
        </span>
      </div>

      <div class="header-actions">
        <div class="source-toggle">
          <a href="/dev/dashboard?source=prod&tab=${initialTab}" class="source-toggle-btn ${isProd ? 'active' : ''}">🌐 Production Live</a>
          <a href="/dev/dashboard?source=local&tab=${initialTab}" class="source-toggle-btn ${!isProd ? 'active' : ''}">💻 Local Dev</a>
        </div>
        <button type="button" id="refresh-btn" class="btn btn-primary" onclick="refreshData()" title="Fetch latest production numbers">
          <span id="refresh-icon">🔄</span> Refresh Live
        </button>
        <a href="/dev" class="btn btn-secondary" title="Go to UI &amp; Email Preview Workbench">
          🎨 UI Preview Workbench
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="hero-bar">
      <div class="hero-title">
        <h1>📊 Live Production Analytics &amp; Scores</h1>
        <p class="hero-subtitle">
          Real-time operations, confirmed email subscribers, and individual player score records from Cloudflare D1/KV.
        </p>
      </div>
      <div class="hero-meta">
        <span id="last-updated-text">Generated just now</span> &bull; 
        <span style="color: #38bdf8;">${escapeHtml(prodOrigin)}</span>
      </div>
    </div>

    ${fetchError ? `
      <div style="margin-bottom: 20px; padding: 12px 16px; background: rgba(245, 158, 11, 0.15); border: 1px solid rgba(245, 158, 11, 0.4); border-radius: 8px; font-size: 13px; color: #fbbf24;">
        ⚠️ <strong>Note:</strong> ${escapeHtml(fetchError)} (showing local dev database)
      </div>
    ` : ''}

    <!-- KPI Metric Cards Grid -->
    <section class="kpi-grid">
      <!-- Subscribers Card -->
      <div class="kpi-card" onclick="switchDashboardTab('subscribers')" style="cursor: pointer;" title="View Subscribed Emails directory">
        <div class="kpi-header">
          <span class="kpi-title">Active (Receiving)</span>
          <span class="kpi-icon">📬</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-active-subs">${stats.subscribers.activeCount}</span>
          <span class="kpi-unit">/ ${stats.subscribers.total} Total Subscribers</span>
        </div>
        <div class="kpi-subtext">
          <span>Across <strong class="kpi-highlight" id="kpi-domains-count">${stats.subscribers.uniqueDomainsCount}</strong> company domains</span>
        </div>
      </div>

      <!-- Today's Players Card -->
      <div class="kpi-card" onclick="switchDashboardTab('gameplay')" style="cursor: pointer;" title="View Today's Gameplay Scores">
        <div class="kpi-header">
          <span class="kpi-title">Today's Players (Puzzle #${stats.todayPuzzle.id})</span>
          <span class="kpi-icon">🎮</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-today-players">${stats.todayStats.totalPlayers}</span>
          <span class="kpi-unit">played today</span>
        </div>
        <div class="kpi-subtext">
          <span><strong class="kpi-highlight" id="kpi-today-won">${stats.todayStats.totalWon}</strong> solved (${stats.todayStats.winRate}% win rate)</span>
        </div>
      </div>

      <!-- Today's Performance Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Avg Score</span>
          <span class="kpi-icon">🎯</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-today-avg-score">${stats.todayStats.avgScore}</span>
          <span class="kpi-unit">pts</span>
        </div>
        <div class="kpi-subtext">
          <span>Top score: <strong class="kpi-highlight" id="kpi-today-top-score">${stats.todayStats.topScore} pts</strong> (${stats.todayStats.avgGuesses} avg guesses)</span>
        </div>
      </div>

      <!-- All-Time Activity Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Games Played</span>
          <span class="kpi-icon">📈</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-all-plays">${stats.allPlays.length}</span>
          <span class="kpi-unit">all-time plays</span>
        </div>
        <div class="kpi-subtext">
          <span>Unique players: <strong class="kpi-highlight">${uniqueAllTimePlayersCount}</strong></span>
        </div>
      </div>
    </section>

    <!-- Main Section Tabs: Gameplay vs Subscribed Emails vs User Settings -->
    <nav class="dashboard-nav-tabs">
      <button type="button" id="tab-btn-gameplay" class="nav-tab-btn ${initialTab === 'gameplay' ? 'active' : ''}" onclick="switchDashboardTab('gameplay')">
        🎮 Gameplay &amp; Scores
      </button>
      <button type="button" id="tab-btn-subscribers" class="nav-tab-btn ${initialTab === 'subscribers' ? 'active' : ''}" onclick="switchDashboardTab('subscribers')">
        👥 Subscribed Emails &amp; Dev Testers <span class="nav-tab-badge">${stats.subscribers.total}</span>
      </button>
      <button type="button" id="tab-btn-settings" class="nav-tab-btn ${initialTab === 'settings' ? 'active' : ''}" onclick="switchDashboardTab('settings')">
        👤 User Settings &amp; Profiles <span class="nav-tab-badge" id="tab-badge-users">${userProfiles.length}</span>
      </button>
    </nav>

    <!-- TAB 1: GAMEPLAY & SCORES SECTION -->
    <div id="section-gameplay" style="display: ${initialTab === 'gameplay' ? 'block' : 'none'};">
      <!-- Daily Active Users (New vs. Returning) Chart -->
      <section class="dau-chart-card" id="dau-chart-section">
        <div class="dau-chart-header">
          <div class="dau-header-left">
            <div class="panel-title">
              <span>📊 Daily Active Users — New vs. Returning</span>
              <span class="panel-count" id="dau-days-count">${dailyActiveSeries.length} day${dailyActiveSeries.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="dau-header-right">
            <div class="dau-legend">
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-new"></span>
                <span>New Users (<strong id="dau-legend-new-total" style="color: #34d399;">${totalNewSessions}</strong>)</span>
              </span>
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-returning"></span>
                <span>Returning Users (<strong id="dau-legend-returning-total" style="color: #38bdf8;">${totalReturningSessions}</strong>)</span>
              </span>
            </div>
            <div class="segmented-toggle" id="dau-range-toggle">
              <button type="button" class="seg-btn dau-range-btn" id="dau-range-7d" onclick="setDauRange(7, this)">7D</button>
              <button type="button" class="seg-btn dau-range-btn" id="dau-range-14d" onclick="setDauRange(14, this)">14D</button>
              <button type="button" class="seg-btn dau-range-btn active" id="dau-range-all" onclick="setDauRange(0, this)">All</button>
            </div>
          </div>
        </div>

        <div class="dau-summary-strip">
          <div class="dau-summary-item">
            <span class="dau-summary-label">Today's Active Users</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="dau-kpi-today">${todayActiveTotal}</span>
              <span class="dau-summary-sub" id="dau-kpi-today-sub"><span style="color: #34d399; font-weight: 700;">${todayNewCount} new</span> &bull; <span style="color: #38bdf8; font-weight: 700;">${todayReturningCount} returning</span></span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Peak Daily Active</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="dau-kpi-peak">${peakActiveTotal}</span>
              <span class="dau-summary-sub" id="dau-kpi-peak-sub">${escapeHtml(peakActiveSub)}</span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Avg Daily Active</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="dau-kpi-avg">${avgActivePerDay}</span>
              <span class="dau-summary-sub" id="dau-kpi-avg-sub">across ${activeDaysList.length} active day${activeDaysList.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Returning Activity Share</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="dau-kpi-retention" style="color: #38bdf8;">${returningSharePct}%</span>
              <span class="dau-summary-sub" id="dau-kpi-retention-sub">${totalReturningSessions} returning / ${totalActiveSessions} total daily active</span>
            </div>
          </div>
        </div>

        <div class="dau-chart-viewport">
          <div class="dau-chart-area">
            <div class="dau-y-axis" id="dau-y-axis">
              ${yTicks.map(t => `<span>${t}</span>`).join('')}
            </div>
            <div class="dau-plot-wrap">
              <div class="dau-grid-lines">
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
              </div>
              <div class="dau-bars-track" id="dau-bars-track">
                ${dauBarsHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="dau-day-detail-bar" id="dau-day-detail-bar">
          <div class="dau-detail-title">
            <span id="dau-detail-date">📅 ${escapeHtml(formatShortChartDate(defaultSelectedPoint.date))} (${escapeHtml(defaultSelectedPoint.date)})${defaultSelectedPoint.puzzleId ? ` &bull; Puzzle #${escapeHtml(String(defaultSelectedPoint.puzzleId))}` : ''}</span>
            <span class="status-pill status-won" id="dau-detail-total">${defaultSelectedPoint.totalActive} Active User${defaultSelectedPoint.totalActive === 1 ? '' : 's'}</span>
          </div>
          <div class="dau-detail-groups">
            <div class="dau-detail-group">
              <span style="color: #34d399; font-weight: 700; font-size: 12px;">🟢 New (<span id="dau-detail-new-count">${defaultSelectedPoint.newUsers}</span>):</span>
              <div class="dau-detail-group" id="dau-detail-new-chips">${defaultNewChipsHtml}</div>
            </div>
            <div class="dau-detail-group">
              <span style="color: #38bdf8; font-weight: 700; font-size: 12px;">🔵 Returning (<span id="dau-detail-returning-count">${defaultSelectedPoint.returningUsers}</span>):</span>
              <div class="dau-detail-group" id="dau-detail-returning-chips">${defaultReturningChipsHtml}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Daily Puzzle Completion & Opens Funnel Chart -->
      <section class="dau-chart-card" id="completion-chart-section">
        <div class="dau-chart-header">
          <div class="dau-header-left">
            <div class="panel-title">
              <span>🎯 Daily Puzzle Completion — Finished vs. Attempted &amp; Didn't Finish vs. Opened vs. Subscribed</span>
              <span class="panel-count" id="completion-days-count">${dailyActiveSeries.length} day${dailyActiveSeries.length === 1 ? '' : 's'}</span>
            </div>
          </div>
          <div class="dau-header-right">
            <div class="dau-legend">
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-finished"></span>
                <span>Finished (<strong id="completion-legend-finished-total" style="color: #34d399;">${totalFinishedSessions}</strong>)</span>
              </span>
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-unfinished"></span>
                <span>Attempted &amp; Didn't Finish (<strong id="completion-legend-unfinished-total" style="color: #fbbf24;">${totalUnfinishedSessions}</strong>)</span>
              </span>
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-opened"></span>
                <span>Opened — No Guess (<strong id="completion-legend-opened-total" style="color: #a78bfa;">${totalOpenedOnlySessions}</strong>)</span>
              </span>
              <span class="dau-legend-item">
                <span class="dau-legend-dot dau-dot-unopened"></span>
                <span>Subscribed — Not Opened (<strong id="completion-legend-unopened-total" style="color: #94a3b8;">${totalUnopenedSessions}</strong>)</span>
              </span>
            </div>
            <div class="segmented-toggle" id="completion-range-toggle">
              <button type="button" class="seg-btn completion-range-btn" id="completion-range-7d" onclick="setCompletionRange(7, this)">7D</button>
              <button type="button" class="seg-btn completion-range-btn" id="completion-range-14d" onclick="setCompletionRange(14, this)">14D</button>
              <button type="button" class="seg-btn completion-range-btn active" id="completion-range-all" onclick="setCompletionRange(0, this)">All</button>
            </div>
          </div>
        </div>

        <div class="dau-summary-strip">
          <div class="dau-summary-item">
            <span class="dau-summary-label">Today's Funnel</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="completion-kpi-today">${todayFinishedCount} / ${todayAudienceTotal}</span>
              <span class="dau-summary-sub" id="completion-kpi-today-sub"><span style="color: #34d399; font-weight: 700;">${todayFinishedCount} finished</span> &bull; <span style="color: #fbbf24; font-weight: 700;">${todayUnfinishedCount} didn't finish</span> &bull; <span style="color: #a78bfa; font-weight: 700;">${todayOpenedOnlyCount} opened only</span> &bull; <span style="color: #94a3b8; font-weight: 700;">${todayUnopenedCount} not opened</span></span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Total Finished / Unfinished / Opened / Unopened</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="completion-kpi-totals"><span style="color: #34d399;">${totalFinishedSessions}</span> / <span style="color: #fbbf24;">${totalUnfinishedSessions}</span> / <span style="color: #a78bfa;">${totalOpenedOnlySessions}</span> / <span style="color: #94a3b8;">${totalUnopenedSessions}</span></span>
              <span class="dau-summary-sub" id="completion-kpi-totals-sub">${totalOpensSessions} total opens (${totalActiveSessions} attempted, ${totalOpenedOnlySessions} opened only) &bull; ${totalUnopenedSessions} unopened</span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Avg Daily Funnel</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="completion-kpi-avg">${avgFinishedPerDay} / ${avgUnfinishedPerDay} / ${avgOpenedOnlyPerDay} / ${avgUnopenedPerDay}</span>
              <span class="dau-summary-sub" id="completion-kpi-avg-sub">${avgFinishedPerDay} fin &bull; ${avgUnfinishedPerDay} unfin &bull; ${avgOpenedOnlyPerDay} open &bull; ${avgUnopenedPerDay} unopened/d</span>
            </div>
          </div>
          <div class="dau-summary-item">
            <span class="dau-summary-label">Open, Attempt &amp; Completion Rate</span>
            <div class="dau-summary-val-row">
              <span class="dau-summary-val" id="completion-kpi-rate" style="color: #34d399;">${overallCompletionPct}%</span>
              <span class="dau-summary-sub" id="completion-kpi-rate-sub">${overallCompletionPct}% solved &bull; ${overallAttemptRatePct}% of opens attempted &bull; ${overallOpenRatePct}% opened</span>
            </div>
          </div>
        </div>

        <div class="dau-chart-viewport">
          <div class="dau-chart-area">
            <div class="dau-y-axis" id="completion-y-axis">
              ${yTicksCompletion.map(t => `<span>${t}</span>`).join('')}
            </div>
            <div class="dau-plot-wrap">
              <div class="dau-grid-lines">
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
                <div class="dau-grid-line"></div>
              </div>
              <div class="dau-bars-track" id="completion-bars-track">
                ${completionBarsHtml}
              </div>
            </div>
          </div>
        </div>

        <div class="dau-day-detail-bar" id="completion-day-detail-bar">
          <div class="dau-detail-title">
            <span id="completion-detail-date">📅 ${escapeHtml(formatShortChartDate(defaultSelectedPoint.date))} (${escapeHtml(defaultSelectedPoint.date)})${defaultSelectedPoint.puzzleId ? ` &bull; Puzzle #${escapeHtml(String(defaultSelectedPoint.puzzleId))}` : ''}</span>
            <span class="status-pill status-won" id="completion-detail-total">${defaultSelectedPoint.finishedUsers || 0} Finished / ${defaultSelectedPoint.totalActive} Attempted / ${defaultSelectedPoint.totalOpens ?? defaultSelectedPoint.totalActive} Opened / ${defaultSelectedPoint.unopenedUsers || 0} Not Opened</span>
          </div>
          <div class="dau-detail-groups">
            <div class="dau-detail-group">
              <span style="color: #34d399; font-weight: 700; font-size: 12px;">🎉 Finished (<span id="completion-detail-finished-count">${defaultSelectedPoint.finishedUsers || 0}</span>):</span>
              <div class="dau-detail-group" id="completion-detail-finished-chips">${defaultFinishedChipsHtml}</div>
            </div>
            <div class="dau-detail-group">
              <span style="color: #fbbf24; font-weight: 700; font-size: 12px;">⏳ Attempted &amp; Didn't Finish (<span id="completion-detail-unfinished-count">${defaultSelectedPoint.unfinishedUsers || 0}</span>):</span>
              <div class="dau-detail-group" id="completion-detail-unfinished-chips">${defaultUnfinishedChipsHtml}</div>
            </div>
            <div class="dau-detail-group">
              <span style="color: #a78bfa; font-weight: 700; font-size: 12px;">📬 Opened — No Guess (<span id="completion-detail-opened-count">${defaultSelectedPoint.openedOnlyUsers || 0}</span>):</span>
              <div class="dau-detail-group" id="completion-detail-opened-chips">${defaultOpenedOnlyChipsHtml}</div>
            </div>
            <div class="dau-detail-group">
              <span style="color: #94a3b8; font-weight: 700; font-size: 12px;">📭 Subscribed — Not Opened (<span id="completion-detail-unopened-count">${defaultSelectedPoint.unopenedUsers || 0}</span>):</span>
              <div class="dau-detail-group" id="completion-detail-unopened-chips">${defaultUnopenedChipsHtml}</div>
            </div>
          </div>
        </div>
      </section>

      <!-- Toolbar: Puzzle Switcher & Filter -->
      <section class="toolbar-card">
        <div class="toolbar-main-row">
          <div class="puzzle-selector-group">
            <label for="puzzle-select" class="puzzle-select-label">Select Puzzle:</label>
            <select id="puzzle-select" class="puzzle-select" onchange="handlePuzzleChange(this.value)">
              ${puzzleOptionsHtml}
            </select>
          </div>

          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="search-input" class="search-input" placeholder="Search by player email or domain..." oninput="applyFilters()">
          </div>

          <div class="filter-tabs">
            <button type="button" class="tab-btn active" data-filter="all" onclick="setFilter('all', this)">
              All (<span id="count-all">${stats.selectedPlays.length}</span>)
            </button>
            <button type="button" class="tab-btn" data-filter="won" onclick="setFilter('won', this)">
              🎉 Solved (<span id="count-won">${stats.selectedPuzzleStats.totalWon}</span>)
            </button>
            <button type="button" class="tab-btn" data-filter="playing" onclick="setFilter('playing', this)">
              ⏳ In Progress (<span id="count-playing">${stats.selectedPuzzleStats.totalPlaying}</span>)
            </button>
          </div>

          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="exportCsv()" title="Export scores table to CSV">
              💾 Export CSV
            </button>
            <button type="button" class="btn btn-secondary" onclick="exportJson()" title="Export complete data as JSON">
              💾 JSON
            </button>
          </div>
        </div>
      </section>

      <!-- Main Two-Column Layout -->
      <div class="dashboard-grid">
        <!-- Left Column: Player Scores Table -->
        <section class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              <span>🎮 Player Scores for Puzzle #<span id="selected-puzzle-title">${stats.selectedPuzzle.id}</span></span>
              <span class="panel-count" id="table-row-count">${stats.selectedPlays.length} plays</span>
            </div>
            <div style="font-size: 12px; color: #94a3b8;">
              Date: <span id="selected-puzzle-date" style="font-family: monospace;">${stats.selectedPuzzle.date}</span>
            </div>
          </div>

          <div class="table-responsive">
            <table id="scores-table" style="display: ${stats.selectedPlays.length === 0 ? 'none' : 'table'};">
              <thead>
                <tr>
                  <th>Player</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Guesses</th>
                  <th>Hints</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody id="scores-tbody">
                ${scoreRowsHtml}
              </tbody>
            </table>

            <div id="empty-scores" class="empty-state" style="display: ${stats.selectedPlays.length === 0 ? 'block' : 'none'};">
              <div class="empty-icon">📭</div>
              <div class="empty-text">No recorded gameplay or scores for Puzzle #<span id="empty-puzzle-id">${stats.selectedPuzzle.id}</span> yet today!</div>
              <div style="margin-top: 6px; font-size: 12px; color: #475569;">Players will appear here in real-time as they make guesses and submit words.</div>
            </div>
          </div>
        </section>

        <!-- Right Column: Workplace Domains Leaderboard -->
        <section class="panel-card">
          <div class="panel-header">
            <div class="panel-title">
              <span>🏢 Workplace Leaderboard</span>
              <span class="panel-count">${stats.domainRankings.length} domains</span>
            </div>
          </div>

          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Domain</th>
                  <th>Players</th>
                  <th>Subs</th>
                  <th>Avg Score</th>
                  <th>Best</th>
                </tr>
              </thead>
              <tbody id="domains-tbody">
                ${domainRowsHtml}
              </tbody>
            </table>

            <div id="empty-domains" class="empty-state" style="display: ${stats.domainRankings.length === 0 ? 'block' : 'none'};">
              <div class="empty-icon">🏢</div>
              <div class="empty-text">No workplace domains registered yet.</div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- TAB 2: SUBSCRIBED EMAILS & DEV TESTERS SECTION -->
    <div id="section-subscribers" style="display: ${initialTab === 'subscribers' ? 'block' : 'none'};">
      <!-- Dev Prescreen Team Management Card -->
      <div class="dev-prescreen-card">
        <div class="dev-prescreen-header">
          <div class="dev-prescreen-title">
            <span>🧪 Dev Tester Prescreen Team (<span id="dev-testers-count">${stats.devTesters.length}</span>)</span>
            <span class="badge-dev-prescreen">42 Days Ahead (#43 on Sept 28, #44 next)</span>
            <span class="badge-source ${isProd ? 'badge-prod' : 'badge-local-source'}">
              ${isProd ? '🟢 Production KV' : '💻 Local Dev KV'}
            </span>
          </div>
          <p class="dev-prescreen-desc">
            Emails on this prescreen list receive future puzzles 42 days in advance to verify clues, definitions, and game mechanics before standard subscribers receive them.
          </p>
        </div>
        <div class="dev-prescreen-body">
          <form class="dev-add-form" onsubmit="handleAddDevTester(event)">
            <input type="email" id="dev-email-input" class="search-input" style="max-width: 280px;" placeholder="tester@example.com" required>
            <button type="submit" id="btn-add-dev" class="btn-dev-add">+ Add Dev Tester</button>
          </form>
          <div class="dev-chips-list" id="dev-chips-container">
            ${devChipsHtml}
          </div>
        </div>
      </div>

      <!-- Subscribers Directory Panel -->
      <section class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>👥 Subscribed Emails</span>
            <span class="panel-count" id="sub-table-count">${subscribers.length} total</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="copyActiveEmails()" title="Copy comma-separated active emails">
              📋 Copy Active
            </button>
            <button type="button" class="btn btn-secondary" onclick="exportSubscribersJson()" title="Download subscribers as JSON">
              💾 Export JSON
            </button>
          </div>
        </div>

        <div style="padding: 16px 20px; border-bottom: 1px solid #1f2937; background: #0f172a; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="sub-search-input" class="search-input" placeholder="Search by email or domain..." oninput="applySubFilters()">
          </div>

          <div class="filter-tabs">
            <button type="button" class="tab-btn active" data-subfilter="all" onclick="setSubFilter('all', this)">
              All (${stats.subscribers.total})
            </button>
            <button type="button" class="tab-btn" data-subfilter="active" onclick="setSubFilter('active', this)">
              Active (${stats.subscribers.activeCount})
            </button>
            <button type="button" class="tab-btn" data-subfilter="unsubscribed" onclick="setSubFilter('unsubscribed', this)">
              Unsubscribed (${stats.subscribers.unsubscribedCount})
            </button>
          </div>

          <form onsubmit="handleAddSubscriber(event)" style="display: flex; align-items: center; gap: 8px;">
            <input type="email" id="add-email-input" class="search-input" style="max-width: 240px;" placeholder="player@company.com" required>
            <button type="submit" id="btn-add-sub" class="btn btn-primary">+ Add Subscriber</button>
          </form>
        </div>

        <div class="table-responsive">
          <table id="subscribers-table" style="display: ${subscribers.length === 0 ? 'none' : 'table'};">
            <thead>
              <tr>
                <th>Email</th>
                <th>Domain</th>
                <th>Subscribed Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="subscribers-tbody">
              ${subRowsHtml}
            </tbody>
          </table>

          <div id="empty-subscribers" class="empty-state" style="display: ${subscribers.length === 0 ? 'block' : 'none'};">
            <div class="empty-icon">👥</div>
            <div class="empty-text">No subscribers found in database.</div>
          </div>
        </div>
      </section>
    </div>

    <!-- TAB 3: USER SETTINGS & PROFILES SECTION -->
    <div id="section-user-settings" style="display: ${initialTab === 'settings' ? 'block' : 'none'};">
      <!-- Active User Inspector Card -->
      <section class="inspector-card" id="user-inspector-card">
        <div class="inspector-header">
          <div class="inspector-identity">
            <div class="inspector-avatar" id="inspector-avatar">?</div>
            <div class="inspector-titles">
              <div class="inspector-email-row">
                <span class="inspector-email" id="inspector-email">—</span>
                <button type="button" class="copy-btn" onclick="copyInspectorEmail()" title="Copy email address">📋</button>
                <span id="inspector-dev-badge" class="badge-dev-prescreen" style="display: none;">🧪 42 Days Ahead</span>
              </div>
              <div class="inspector-tags-row">
                <span class="domain-pill" id="inspector-domain">@company</span>
                <span id="inspector-sub-status" class="status-pill status-won">Active</span>
                <span id="inspector-visibility-pill" class="badge-vis-public">👁️ Public</span>
                <span id="inspector-theme-pill" class="badge-theme-light">☀️ Light</span>
              </div>
            </div>
          </div>

          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            <a id="inspector-account-link" href="#" target="_blank" class="btn btn-secondary" title="Open user's private account settings page in new tab">
              🔗 Open User Account Page
            </a>
            <button type="button" class="btn btn-secondary" onclick="copyInspectorAccountLink()" title="Copy user's tamper-proof account link">
              📋 Copy Link
            </button>
          </div>
        </div>

        <!-- 3-Column Settings Grid -->
        <div class="inspector-grid">
          <!-- Col 1: Preferences & Privacy -->
          <div class="inspector-section">
            <div class="inspector-section-title">
              <span>🔒 Preferences &amp; Privacy</span>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Leaderboard Visibility</span>
                <span class="setting-desc">Visible on workplace &amp; global leaderboards</span>
              </div>
              <div class="segmented-toggle" id="toggle-group-leaderboard">
                <button type="button" class="seg-btn active" id="btn-vis-public" onclick="setUserSetting('showOnLeaderboard', true)">👁️ Visible</button>
                <button type="button" class="seg-btn" id="btn-vis-hidden" onclick="setUserSetting('showOnLeaderboard', false)">🔒 Hidden</button>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Email Theme</span>
                <span class="setting-desc">Visual theme rendered in daily puzzle emails</span>
              </div>
              <div class="segmented-toggle" id="toggle-group-theme">
                <button type="button" class="seg-btn active-amber" id="btn-theme-light" onclick="setUserSetting('theme', 'light')">☀️ Light</button>
                <button type="button" class="seg-btn" id="btn-theme-dark" onclick="setUserSetting('theme', 'dark')">🌙 Dark</button>
              </div>
            </div>
          </div>

          <!-- Col 2: Account & Access -->
          <div class="inspector-section">
            <div class="inspector-section-title">
              <span>📬 Subscription &amp; Track</span>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Subscription Status</span>
                <span class="setting-desc">Daily 9:00 AM puzzle email dispatch</span>
              </div>
              <div class="segmented-toggle" id="toggle-group-sub">
                <button type="button" class="seg-btn active-emerald" id="btn-sub-active" onclick="setUserSetting('status', 'active')">Active</button>
                <button type="button" class="seg-btn" id="btn-sub-unsub" onclick="setUserSetting('status', 'unsubscribed')">Unsubscribed</button>
              </div>
            </div>

            <div class="setting-row">
              <div class="setting-info">
                <span class="setting-label">Dev Prescreen Track</span>
                <span class="setting-desc">Test future puzzles 42 days in advance</span>
              </div>
              <div class="segmented-toggle" id="toggle-group-dev">
                <button type="button" class="seg-btn active" id="btn-track-std" onclick="setUserSetting('isDev', false)">Standard</button>
                <button type="button" class="seg-btn" id="btn-track-dev" onclick="setUserSetting('isDev', true)">🧪 Dev (42d+)</button>
              </div>
            </div>

            <div class="token-container">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-size: 11px; font-weight: 700; color: #94a3b8; text-transform: uppercase;">Signed Account Token</span>
                <button type="button" class="copy-btn" onclick="copyInspectorToken()" title="Copy token only">📋</button>
              </div>
              <div class="token-code" id="inspector-token-text">—</div>
            </div>
          </div>

          <!-- Col 3: Gameplay History & Stats -->
          <div class="inspector-section">
            <div class="inspector-section-title">
              <span>🎮 Gameplay Activity</span>
            </div>

            <div class="stats-strip">
              <div class="stat-item">
                <span class="stat-item-label">Days Played</span>
                <span class="stat-item-val" id="inspector-stat-days">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-item-label">Puzzles</span>
                <span class="stat-item-val" id="inspector-stat-puzzles">0</span>
              </div>
              <div class="stat-item">
                <span class="stat-item-label">Games Won</span>
                <span class="stat-item-val" id="inspector-stat-won" style="color: #34d399;">0</span>
              </div>
            </div>

            <div>
              <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Played Puzzles:</span>
              <div class="history-chips-row" id="inspector-played-puzzles-chips">
                <span style="color: #64748b; font-size: 12px;">No puzzles played yet</span>
              </div>
            </div>

            <div>
              <span style="font-size: 12px; color: #94a3b8; font-weight: 600;">Played Dates:</span>
              <div class="history-chips-row" id="inspector-played-dates-chips">
                <span style="color: #64748b; font-size: 12px;">No activity dates recorded</span>
              </div>
            </div>
          </div>
        </div>

        <!-- User's Individual Score Records Table -->
        <div style="border-top: 1px solid #1e293b; padding-top: 16px;">
          <div style="font-size: 13px; font-weight: 700; color: #94a3b8; text-transform: uppercase; margin-bottom: 12px;">
            User Game History Records (<span id="inspector-history-count">0</span>)
          </div>
          <div class="table-responsive">
            <table>
              <thead>
                <tr>
                  <th>Puzzle</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Guesses</th>
                  <th>Hints</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody id="inspector-history-tbody">
                <tr><td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No plays found for this user.</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- All Users Directory Table Panel -->
      <section class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>👤 All User Profiles &amp; Settings Directory</span>
            <span class="panel-count" id="user-table-count">${userProfiles.length} users</span>
          </div>
          <div style="display: flex; gap: 8px;">
            <button type="button" class="btn btn-secondary" onclick="exportUsersJson()" title="Download user profiles as JSON">
              💾 Export JSON
            </button>
          </div>
        </div>

        <div style="padding: 16px 20px; border-bottom: 1px solid #1f2937; background: #0f172a; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px;">
          <div class="search-box">
            <span class="search-icon">🔍</span>
            <input type="text" id="user-search-input" class="search-input" placeholder="Search users by email or domain..." oninput="applyUserFilters()">
          </div>

          <div class="filter-tabs">
            <button type="button" class="tab-btn active" data-userfilter="all" onclick="setUserFilter('all', this)">
              All (${userProfiles.length})
            </button>
            <button type="button" class="tab-btn" data-userfilter="active" onclick="setUserFilter('active', this)">
              Active Subs (${userProfiles.filter(u => u.isSubscribed).length})
            </button>
            <button type="button" class="tab-btn" data-userfilter="dev" onclick="setUserFilter('dev', this)">
              Dev Testers (${userProfiles.filter(u => u.isDev).length})
            </button>
            <button type="button" class="tab-btn" data-userfilter="played" onclick="setUserFilter('played', this)">
              Has Played (${userProfiles.filter(u => u.daysPlayed > 0).length})
            </button>
          </div>
        </div>

        <div class="table-responsive">
          <table id="users-directory-table" style="display: ${userProfiles.length === 0 ? 'none' : 'table'};">
            <thead>
              <tr>
                <th>User</th>
                <th>Domain</th>
                <th>Leaderboard</th>
                <th>Theme</th>
                <th>Days Played</th>
                <th>Subscription</th>
                <th>Track</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="users-directory-tbody">
              ${userDirectoryRowsHtml}
            </tbody>
          </table>

          <div id="empty-users" class="empty-state" style="display: ${userProfiles.length === 0 ? 'block' : 'none'};">
            <div class="empty-icon">👤</div>
            <div class="empty-text">No user profiles found in database.</div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <div id="toast" class="toast"></div>

  <script>
    var currentData = ${dashboardJson};
    var currentSource = '${source}';
    var activeFilter = 'all';
    var activeSubFilter = 'all';
    var activeUserFilter = 'all';
    var currentTab = '${initialTab}';
    var selectedUserEmail = (currentData.userProfiles && currentData.userProfiles.length > 0)
      ? currentData.userProfiles[0].email
      : '';

    function showToast(msg) {
      var toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(function() { toast.style.display = 'none'; }, 2500);
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied ' + text + ' to clipboard!');
      }).catch(function() {
        showToast('Failed to copy.');
      });
    }

    function switchDashboardTab(tab) {
      currentTab = tab;
      document.getElementById('section-gameplay').style.display = tab === 'gameplay' ? 'block' : 'none';
      document.getElementById('section-subscribers').style.display = tab === 'subscribers' ? 'block' : 'none';
      document.getElementById('section-user-settings').style.display = tab === 'settings' ? 'block' : 'none';

      document.getElementById('tab-btn-gameplay').classList.toggle('active', tab === 'gameplay');
      document.getElementById('tab-btn-subscribers').classList.toggle('active', tab === 'subscribers');
      document.getElementById('tab-btn-settings').classList.toggle('active', tab === 'settings');

      if (tab === 'settings' && selectedUserEmail) {
        selectUser(selectedUserEmail);
      }

      try {
        var url = new URL(window.location);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url);
      } catch (e) {}
    }

    function setFilter(filter, btn) {
      activeFilter = filter;
      document.querySelectorAll('.toolbar-card .tab-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      applyFilters();
    }

    var dauRange = 0;
    var selectedDauDate = '${escapeHtml(defaultSelectedPoint.date)}';

    function formatShortDateJs(dateStr) {
      if (!dateStr || !/^\\d{4}-\\d{2}-\\d{2}$/.test(dateStr)) return dateStr || '—';
      var parts = dateStr.split('-');
      var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      var m = parseInt(parts[1], 10);
      var d = parseInt(parts[2], 10);
      return (months[m - 1] || parts[1]) + ' ' + d;
    }

    function setDauRange(days, btn) {
      dauRange = days || 0;
      document.querySelectorAll('.dau-range-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      renderDauChart(currentData.dailyActiveUsers || []);
    }

    function selectDauDay(dateStr) {
      var series = (currentData && currentData.dailyActiveUsers) ? currentData.dailyActiveUsers : [];
      var pt = series.find(function(p) { return p.date === dateStr; });
      if (!pt) return;
      selectedDauDate = dateStr;

      document.querySelectorAll('#dau-bars-track .dau-bar-col').forEach(function(col) {
        col.classList.toggle('selected', col.getAttribute('data-date') === dateStr);
      });

      var dateEl = document.getElementById('dau-detail-date');
      if (dateEl) {
        dateEl.innerHTML = '📅 ' + escapeHtmlStr(formatShortDateJs(pt.date)) + ' (' + escapeHtmlStr(pt.date) + ')' + (pt.puzzleId ? (' &bull; Puzzle #' + escapeHtmlStr(pt.puzzleId)) : '');
      }
      var totalEl = document.getElementById('dau-detail-total');
      if (totalEl) {
        totalEl.textContent = pt.totalActive + ' Active User' + (pt.totalActive === 1 ? '' : 's');
      }
      var newCountEl = document.getElementById('dau-detail-new-count');
      if (newCountEl) newCountEl.textContent = pt.newUsers;
      var retCountEl = document.getElementById('dau-detail-returning-count');
      if (retCountEl) retCountEl.textContent = pt.returningUsers;

      var newChipsEl = document.getElementById('dau-detail-new-chips');
      if (newChipsEl) {
        var newEmails = pt.newUserEmails || [];
        newChipsEl.innerHTML = newEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : newEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-new" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }

      var retChipsEl = document.getElementById('dau-detail-returning-chips');
      if (retChipsEl) {
        var retEmails = pt.returningUserEmails || [];
        retChipsEl.innerHTML = retEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : retEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-returning" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }
    }

    function renderDauChart(fullSeries) {
      if (!Array.isArray(fullSeries)) return;
      var sliced = (dauRange > 0 && fullSeries.length > dauRange)
        ? fullSeries.slice(fullSeries.length - dauRange)
        : fullSeries;

      var daysCountEl = document.getElementById('dau-days-count');
      if (daysCountEl) {
        daysCountEl.textContent = sliced.length + (sliced.length === 1 ? ' day' : ' days');
      }

      var sumActive = 0;
      var sumNew = 0;
      var sumRet = 0;
      var activeDays = 0;
      var peakPt = null;
      var rawMax = 4;

      sliced.forEach(function(p) {
        sumActive += p.totalActive;
        sumNew += p.newUsers;
        sumRet += p.returningUsers;
        if (p.totalActive > 0) activeDays++;
        if (!peakPt || p.totalActive >= peakPt.totalActive) peakPt = p;
        if (p.totalActive > rawMax) rawMax = p.totalActive;
      });

      var legNew = document.getElementById('dau-legend-new-total');
      if (legNew) legNew.textContent = sumNew;
      var legRet = document.getElementById('dau-legend-returning-total');
      if (legRet) legRet.textContent = sumRet;

      var todayDate = (currentData && currentData.todayPuzzle && currentData.todayPuzzle.date) ? currentData.todayPuzzle.date : '';
      var todayPt = fullSeries.find(function(p) { return p.date === todayDate; }) || fullSeries[fullSeries.length - 1];
      if (todayPt) {
        var kpiToday = document.getElementById('dau-kpi-today');
        if (kpiToday) kpiToday.textContent = todayPt.totalActive;
        var kpiTodaySub = document.getElementById('dau-kpi-today-sub');
        if (kpiTodaySub) {
          kpiTodaySub.innerHTML = '<span style="color: #34d399; font-weight: 700;">' + todayPt.newUsers + ' new</span> &bull; <span style="color: #38bdf8; font-weight: 700;">' + todayPt.returningUsers + ' returning</span>';
        }
      }

      var kpiPeak = document.getElementById('dau-kpi-peak');
      if (kpiPeak) kpiPeak.textContent = peakPt ? peakPt.totalActive : 0;
      var kpiPeakSub = document.getElementById('dau-kpi-peak-sub');
      if (kpiPeakSub) {
        kpiPeakSub.textContent = (peakPt && peakPt.totalActive > 0)
          ? (formatShortDateJs(peakPt.date) + (peakPt.puzzleId ? (' (Puzzle #' + peakPt.puzzleId + ')') : ''))
          : 'No plays recorded yet';
      }

      var kpiAvg = document.getElementById('dau-kpi-avg');
      if (kpiAvg) kpiAvg.textContent = activeDays > 0 ? (sumActive / activeDays).toFixed(1) : '0.0';
      var kpiAvgSub = document.getElementById('dau-kpi-avg-sub');
      if (kpiAvgSub) kpiAvgSub.textContent = 'across ' + activeDays + ' active day' + (activeDays === 1 ? '' : 's');

      var retPct = sumActive > 0 ? Math.round((sumRet / sumActive) * 100) : 0;
      var kpiRet = document.getElementById('dau-kpi-retention');
      if (kpiRet) kpiRet.textContent = retPct + '%';
      var kpiRetSub = document.getElementById('dau-kpi-retention-sub');
      if (kpiRetSub) kpiRetSub.textContent = sumRet + ' returning / ' + sumActive + ' total daily active';

      var maxScale = Math.max(4, Math.ceil(rawMax / 4) * 4);
      var yAxisEl = document.getElementById('dau-y-axis');
      if (yAxisEl) {
        var ticks = [maxScale, Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25), 0];
        yAxisEl.innerHTML = ticks.map(function(t) { return '<span>' + t + '</span>'; }).join('');
      }

      var trackEl = document.getElementById('dau-bars-track');
      if (trackEl) {
        trackEl.innerHTML = sliced.map(function(pt) {
          var isSel = pt.date === selectedDauDate;
          var totalPct = pt.totalActive > 0 ? Math.max(6, Math.round((pt.totalActive / maxScale) * 100)) : 0;
          var newPct = pt.totalActive > 0 ? Math.round((pt.newUsers / pt.totalActive) * 100) : 0;
          var rPct = pt.totalActive > 0 ? (100 - newPct) : 0;
          var shortDate = escapeHtmlStr(formatShortDateJs(pt.date));
          var puzLabel = pt.puzzleId ? ('#' + escapeHtmlStr(pt.puzzleId)) : '';
          var safeDate = escapeHtmlStr(pt.date);
          var tooltip = safeDate + (pt.puzzleId ? (' (Puzzle #' + escapeHtmlStr(pt.puzzleId) + ')') : '') + ': ' + pt.totalActive + ' active (' + pt.newUsers + ' new, ' + pt.returningUsers + ' returning)';

          return '<div class="dau-bar-col ' + (isSel ? 'selected' : '') + '" data-date="' + safeDate + '" data-total="' + pt.totalActive + '" data-new="' + pt.newUsers + '" data-returning="' + pt.returningUsers + '" onclick="selectDauDay(\\'' + safeDate + '\\')" onmouseenter="selectDauDay(\\'' + safeDate + '\\')" title="' + tooltip + '">' +
            '<div class="dau-bar-track-wrap">' +
              '<span class="dau-bar-total ' + (pt.totalActive === 0 ? 'dau-bar-total-zero' : '') + '">' + pt.totalActive + '</span>' +
              '<div class="dau-bar-stack" style="height: ' + totalPct + '%;">' +
                '<div class="dau-bar-segment dau-bar-new" style="height: ' + newPct + '%;" title="New users: ' + pt.newUsers + '">' + (pt.newUsers > 0 && totalPct >= 22 ? pt.newUsers : '') + '</div>' +
                '<div class="dau-bar-segment dau-bar-returning" style="height: ' + rPct + '%;" title="Returning users: ' + pt.returningUsers + '">' + (pt.returningUsers > 0 && totalPct >= 22 ? pt.returningUsers : '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="dau-bar-x-axis">' +
              '<span class="dau-bar-date-label">' + shortDate + '</span>' +
              '<span class="dau-bar-puzzle-label">' + puzLabel + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      if (selectedDauDate && sliced.some(function(p) { return p.date === selectedDauDate; })) {
        selectDauDay(selectedDauDate);
      } else if (sliced.length > 0) {
        var lastActive = sliced.slice().reverse().find(function(p) { return p.totalActive > 0; }) || sliced[sliced.length - 1];
        selectDauDay(lastActive.date);
      }
    }

    var completionRange = 0;
    var selectedCompletionDate = '${escapeHtml(defaultSelectedPoint.date)}';

    function setCompletionRange(days, btn) {
      completionRange = days || 0;
      document.querySelectorAll('.completion-range-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      renderCompletionChart(currentData.dailyActiveUsers || []);
    }

    function selectCompletionDay(dateStr) {
      var series = (currentData && currentData.dailyActiveUsers) ? currentData.dailyActiveUsers : [];
      var pt = series.find(function(p) { return p.date === dateStr; });
      if (!pt) return;
      selectedCompletionDate = dateStr;

      document.querySelectorAll('#completion-bars-track .completion-bar-col').forEach(function(col) {
        col.classList.toggle('selected', col.getAttribute('data-date') === dateStr);
      });

      var fin = pt.finishedUsers || 0;
      var unfin = pt.unfinishedUsers || 0;
      var openedOnly = pt.openedOnlyUsers || 0;
      var unopened = pt.unopenedUsers || 0;
      var totalOpens = (typeof pt.totalOpens === 'number') ? pt.totalOpens : (fin + unfin + openedOnly);

      var dateEl = document.getElementById('completion-detail-date');
      if (dateEl) {
        dateEl.innerHTML = '📅 ' + escapeHtmlStr(formatShortDateJs(pt.date)) + ' (' + escapeHtmlStr(pt.date) + ')' + (pt.puzzleId ? (' &bull; Puzzle #' + escapeHtmlStr(pt.puzzleId)) : '');
      }
      var totalEl = document.getElementById('completion-detail-total');
      if (totalEl) {
        totalEl.textContent = fin + ' Finished / ' + pt.totalActive + ' Attempted / ' + totalOpens + ' Opened / ' + unopened + ' Not Opened';
      }
      var finCountEl = document.getElementById('completion-detail-finished-count');
      if (finCountEl) finCountEl.textContent = fin;
      var unfinCountEl = document.getElementById('completion-detail-unfinished-count');
      if (unfinCountEl) unfinCountEl.textContent = unfin;
      var openCountEl = document.getElementById('completion-detail-opened-count');
      if (openCountEl) openCountEl.textContent = openedOnly;
      var unopenCountEl = document.getElementById('completion-detail-unopened-count');
      if (unopenCountEl) unopenCountEl.textContent = unopened;

      var finChipsEl = document.getElementById('completion-detail-finished-chips');
      if (finChipsEl) {
        var finEmails = pt.finishedUserEmails || [];
        finChipsEl.innerHTML = finEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : finEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-finished" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }

      var unfinChipsEl = document.getElementById('completion-detail-unfinished-chips');
      if (unfinChipsEl) {
        var unfinEmails = pt.unfinishedUserEmails || [];
        unfinChipsEl.innerHTML = unfinEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : unfinEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-unfinished" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }

      var openChipsEl = document.getElementById('completion-detail-opened-chips');
      if (openChipsEl) {
        var openEmails = pt.openedOnlyUserEmails || [];
        openChipsEl.innerHTML = openEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : openEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-opened" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }

      var unopenChipsEl = document.getElementById('completion-detail-unopened-chips');
      if (unopenChipsEl) {
        var unopenEmails = pt.unopenedUserEmails || [];
        unopenChipsEl.innerHTML = unopenEmails.length === 0
          ? '<span style="color: #64748b; font-size: 11.5px;">None</span>'
          : unopenEmails.map(function(e) {
              var safe = escapeHtmlStr(e);
              return '<span class="dau-user-chip dau-chip-unopened" onclick="openUserSettings(\\'' + safe + '\\')" title="Inspect ' + safe + '">' + safe + '</span>';
            }).join(' ');
      }
    }

    function renderCompletionChart(fullSeries) {
      if (!Array.isArray(fullSeries)) return;
      var sliced = (completionRange > 0 && fullSeries.length > completionRange)
        ? fullSeries.slice(fullSeries.length - completionRange)
        : fullSeries;

      var daysCountEl = document.getElementById('completion-days-count');
      if (daysCountEl) {
        daysCountEl.textContent = sliced.length + (sliced.length === 1 ? ' day' : ' days');
      }

      var sumActive = 0;
      var sumFin = 0;
      var sumUnfin = 0;
      var sumOpenedOnly = 0;
      var sumUnopened = 0;
      var sumOpens = 0;
      var sumAudience = 0;
      var funnelDays = 0;
      var rawMax = 4;

      sliced.forEach(function(p) {
        var fin = p.finishedUsers || 0;
        var unfin = p.unfinishedUsers || 0;
        var openedOnly = p.openedOnlyUsers || 0;
        var unopened = p.unopenedUsers || 0;
        var totalOpens = (typeof p.totalOpens === 'number') ? p.totalOpens : (fin + unfin + openedOnly);
        var totalFunnel = (typeof p.totalAudience === 'number') ? p.totalAudience : (totalOpens + unopened);
        sumActive += p.totalActive;
        sumFin += fin;
        sumUnfin += unfin;
        sumOpenedOnly += openedOnly;
        sumUnopened += unopened;
        sumOpens += totalOpens;
        sumAudience += totalFunnel;
        if (totalFunnel > 0) funnelDays++;
        if (totalFunnel > rawMax) rawMax = totalFunnel;
      });

      var legFin = document.getElementById('completion-legend-finished-total');
      if (legFin) legFin.textContent = sumFin;
      var legUnfin = document.getElementById('completion-legend-unfinished-total');
      if (legUnfin) legUnfin.textContent = sumUnfin;
      var legOpen = document.getElementById('completion-legend-opened-total');
      if (legOpen) legOpen.textContent = sumOpenedOnly;
      var legUnopen = document.getElementById('completion-legend-unopened-total');
      if (legUnopen) legUnopen.textContent = sumUnopened;

      var todayDate = (currentData && currentData.todayPuzzle && currentData.todayPuzzle.date) ? currentData.todayPuzzle.date : '';
      var todayPt = fullSeries.find(function(p) { return p.date === todayDate; }) || fullSeries[fullSeries.length - 1];
      if (todayPt) {
        var tFin = todayPt.finishedUsers || 0;
        var tUnfin = todayPt.unfinishedUsers || 0;
        var tOpenOnly = todayPt.openedOnlyUsers || 0;
        var tUnopened = todayPt.unopenedUsers || 0;
        var tOpens = (typeof todayPt.totalOpens === 'number') ? todayPt.totalOpens : (tFin + tUnfin + tOpenOnly);
        var tAudience = (typeof todayPt.totalAudience === 'number') ? todayPt.totalAudience : (tOpens + tUnopened);
        var kpiToday = document.getElementById('completion-kpi-today');
        if (kpiToday) kpiToday.textContent = tFin + ' / ' + tAudience;
        var kpiTodaySub = document.getElementById('completion-kpi-today-sub');
        if (kpiTodaySub) {
          kpiTodaySub.innerHTML = '<span style="color: #34d399; font-weight: 700;">' + tFin + ' finished</span> &bull; <span style="color: #fbbf24; font-weight: 700;">' + tUnfin + ' didn\\'t finish</span> &bull; <span style="color: #a78bfa; font-weight: 700;">' + tOpenOnly + ' opened only</span> &bull; <span style="color: #94a3b8; font-weight: 700;">' + tUnopened + ' not opened</span>';
        }
      }

      var kpiTotals = document.getElementById('completion-kpi-totals');
      if (kpiTotals) kpiTotals.innerHTML = '<span style="color: #34d399;">' + sumFin + '</span> / <span style="color: #fbbf24;">' + sumUnfin + '</span> / <span style="color: #a78bfa;">' + sumOpenedOnly + '</span> / <span style="color: #94a3b8;">' + sumUnopened + '</span>';
      var kpiTotalsSub = document.getElementById('completion-kpi-totals-sub');
      if (kpiTotalsSub) kpiTotalsSub.innerHTML = sumOpens + ' total opens (' + sumActive + ' attempted, ' + sumOpenedOnly + ' opened only) &bull; ' + sumUnopened + ' unopened';

      var avgFin = funnelDays > 0 ? (sumFin / funnelDays).toFixed(1) : '0.0';
      var avgUnfin = funnelDays > 0 ? (sumUnfin / funnelDays).toFixed(1) : '0.0';
      var avgOpenOnly = funnelDays > 0 ? (sumOpenedOnly / funnelDays).toFixed(1) : '0.0';
      var avgUnopen = funnelDays > 0 ? (sumUnopened / funnelDays).toFixed(1) : '0.0';
      var kpiAvg = document.getElementById('completion-kpi-avg');
      if (kpiAvg) kpiAvg.textContent = avgFin + ' / ' + avgUnfin + ' / ' + avgOpenOnly + ' / ' + avgUnopen;
      var kpiAvgSub = document.getElementById('completion-kpi-avg-sub');
      if (kpiAvgSub) kpiAvgSub.innerHTML = avgFin + ' fin &bull; ' + avgUnfin + ' unfin &bull; ' + avgOpenOnly + ' open &bull; ' + avgUnopen + ' unopened/d';

      var ratePct = sumActive > 0 ? Math.round((sumFin / sumActive) * 100) : 0;
      var attemptPct = sumOpens > 0 ? Math.round((sumActive / sumOpens) * 100) : 0;
      var openPct = sumAudience > 0 ? Math.round((sumOpens / sumAudience) * 100) : 0;
      var kpiRate = document.getElementById('completion-kpi-rate');
      if (kpiRate) kpiRate.textContent = ratePct + '%';
      var kpiRateSub = document.getElementById('completion-kpi-rate-sub');
      if (kpiRateSub) kpiRateSub.innerHTML = ratePct + '% solved &bull; ' + attemptPct + '% of opens attempted &bull; ' + openPct + '% opened';

      var maxScale = Math.max(4, Math.ceil(rawMax / 4) * 4);
      var yAxisEl = document.getElementById('completion-y-axis');
      if (yAxisEl) {
        var ticks = [maxScale, Math.round(maxScale * 0.75), Math.round(maxScale * 0.5), Math.round(maxScale * 0.25), 0];
        yAxisEl.innerHTML = ticks.map(function(t) { return '<span>' + t + '</span>'; }).join('');
      }

      var trackEl = document.getElementById('completion-bars-track');
      if (trackEl) {
        trackEl.innerHTML = sliced.map(function(pt) {
          var isSel = pt.date === selectedCompletionDate;
          var fin = pt.finishedUsers || 0;
          var unfin = pt.unfinishedUsers || 0;
          var openedOnly = pt.openedOnlyUsers || 0;
          var unopened = pt.unopenedUsers || 0;
          var totalOpens = (typeof pt.totalOpens === 'number') ? pt.totalOpens : (fin + unfin + openedOnly);
          var totalFunnel = (typeof pt.totalAudience === 'number') ? pt.totalAudience : (totalOpens + unopened);
          var totalPct = totalFunnel > 0 ? Math.max(6, Math.round((totalFunnel / maxScale) * 100)) : 0;
          var unopenedPct = totalFunnel > 0 ? Math.round((unopened / totalFunnel) * 100) : 0;
          var openedOnlyPct = totalFunnel > 0 ? Math.round((openedOnly / totalFunnel) * 100) : 0;
          var unfinPct = totalFunnel > 0 ? Math.round((unfin / totalFunnel) * 100) : 0;
          var finPct = (totalFunnel > 0 && fin > 0) ? Math.max(1, 100 - unopenedPct - openedOnlyPct - unfinPct) : 0;
          var shortDate = escapeHtmlStr(formatShortDateJs(pt.date));
          var puzLabel = pt.puzzleId ? ('#' + escapeHtmlStr(pt.puzzleId)) : '';
          var safeDate = escapeHtmlStr(pt.date);
          var tooltip = safeDate + (pt.puzzleId ? (' (Puzzle #' + escapeHtmlStr(pt.puzzleId) + ')') : '') + ': ' + totalFunnel + ' total (' + fin + ' finished, ' + unfin + ' didn\\'t finish, ' + openedOnly + ' opened only, ' + unopened + ' subscribed not opened)';

          return '<div class="dau-bar-col completion-bar-col ' + (isSel ? 'selected' : '') + '" data-date="' + safeDate + '" data-total="' + pt.totalActive + '" data-opens="' + totalOpens + '" data-audience="' + totalFunnel + '" data-finished="' + fin + '" data-unfinished="' + unfin + '" data-opened-only="' + openedOnly + '" data-unopened="' + unopened + '" onclick="selectCompletionDay(\\'' + safeDate + '\\')" onmouseenter="selectCompletionDay(\\'' + safeDate + '\\')" title="' + tooltip + '">' +
            '<div class="dau-bar-track-wrap">' +
              '<span class="dau-bar-total ' + (totalFunnel === 0 ? 'dau-bar-total-zero' : '') + '">' + totalFunnel + '</span>' +
              '<div class="dau-bar-stack" style="height: ' + totalPct + '%;">' +
                '<div class="dau-bar-segment dau-bar-unopened" style="height: ' + unopenedPct + '%;" title="Subscribed (not opened): ' + unopened + '">' + (unopened > 0 && totalPct >= 22 ? unopened : '') + '</div>' +
                '<div class="dau-bar-segment dau-bar-opened" style="height: ' + openedOnlyPct + '%;" title="Opened (no guess): ' + openedOnly + '">' + (openedOnly > 0 && totalPct >= 22 ? openedOnly : '') + '</div>' +
                '<div class="dau-bar-segment dau-bar-unfinished" style="height: ' + unfinPct + '%;" title="Attempted & didn\\'t finish: ' + unfin + '">' + (unfin > 0 && totalPct >= 22 ? unfin : '') + '</div>' +
                '<div class="dau-bar-segment dau-bar-finished" style="height: ' + finPct + '%;" title="Finished (Solved): ' + fin + '">' + (fin > 0 && totalPct >= 22 ? fin : '') + '</div>' +
              '</div>' +
            '</div>' +
            '<div class="dau-bar-x-axis">' +
              '<span class="dau-bar-date-label">' + shortDate + '</span>' +
              '<span class="dau-bar-puzzle-label">' + puzLabel + '</span>' +
            '</div>' +
          '</div>';
        }).join('');
      }

      if (selectedCompletionDate && sliced.some(function(p) { return p.date === selectedCompletionDate; })) {
        selectCompletionDay(selectedCompletionDate);
      } else if (sliced.length > 0) {
        var lastActive = sliced.slice().reverse().find(function(p) { return (p.totalAudience || p.totalOpens || p.totalActive) > 0; }) || sliced[sliced.length - 1];
        selectCompletionDay(lastActive.date);
      }
    }

    function applyFilters() {
      var query = (document.getElementById('search-input').value || '').toLowerCase().trim();
      var rows = document.querySelectorAll('.score-row');
      var visibleCount = 0;

      rows.forEach(function(row) {
        var email = row.getAttribute('data-email') || '';
        var domain = row.getAttribute('data-domain') || '';
        var status = row.getAttribute('data-status') || '';

        var matchesFilter = (activeFilter === 'all') || (status === activeFilter);
        var matchesQuery = !query || email.includes(query) || domain.includes(query);

        if (matchesFilter && matchesQuery) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      var emptyEl = document.getElementById('empty-scores');
      var tableEl = document.getElementById('scores-table');
      if (visibleCount === 0) {
        emptyEl.style.display = 'block';
        tableEl.style.display = 'none';
      } else {
        emptyEl.style.display = 'none';
        tableEl.style.display = 'table';
      }
      document.getElementById('table-row-count').textContent = visibleCount + ' plays';
    }

    function setSubFilter(filter, btn) {
      activeSubFilter = filter;
      document.querySelectorAll('#section-subscribers .tab-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      applySubFilters();
    }

    function applySubFilters() {
      var query = (document.getElementById('sub-search-input').value || '').toLowerCase().trim();
      var rows = document.querySelectorAll('#subscribers-tbody .sub-row');
      var visibleCount = 0;

      rows.forEach(function(row) {
        var email = (row.getAttribute('data-email') || '').toLowerCase();
        var domain = (row.getAttribute('data-domain') || '').toLowerCase();
        var status = row.getAttribute('data-status') || '';

        var matchesQuery = !query || email.includes(query) || domain.includes(query);
        var matchesStatus = activeSubFilter === 'all' || status === activeSubFilter;

        if (matchesQuery && matchesStatus) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      var emptyEl = document.getElementById('empty-subscribers');
      var tableEl = document.getElementById('subscribers-table');
      if (visibleCount === 0) {
        emptyEl.style.display = 'block';
        tableEl.style.display = 'none';
      } else {
        emptyEl.style.display = 'none';
        tableEl.style.display = 'table';
      }
      document.getElementById('sub-table-count').textContent = visibleCount + ' shown';
    }

    function handlePuzzleChange(puzzleId) {
      var url = new URL(window.location.href);
      url.searchParams.set('puzzle', puzzleId);
      if (currentSource) url.searchParams.set('source', currentSource);
      if (currentTab) url.searchParams.set('tab', currentTab);
      window.location.href = url.toString();
    }

    async function refreshData(puzzleId) {
      var refreshBtn = document.getElementById('refresh-btn');
      var refreshIcon = document.getElementById('refresh-icon');
      refreshIcon.classList.add('refresh-spin');
      refreshBtn.disabled = true;

      var targetPuzzle = puzzleId || document.getElementById('puzzle-select').value;

      try {
        var res = await fetch('/dev/api/dashboard-data?puzzle=' + encodeURIComponent(targetPuzzle) + '&source=' + encodeURIComponent(currentSource));
        if (!res.ok) throw new Error('HTTP ' + res.status);
        var data = await res.json();
        if (data.success) {
          currentData = data;
          updateDashboardUI(data);
          document.getElementById('last-updated-text').textContent = 'Updated just now (' + new Date().toLocaleTimeString() + ')';
        }
      } catch (err) {
        alert('Could not refresh live dashboard data: ' + err.message);
      } finally {
        refreshIcon.classList.remove('refresh-spin');
        refreshBtn.disabled = false;
      }
    }

    function escapeHtmlStr(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    function renderScoresTable(plays) {
      var tbody = document.getElementById('scores-tbody');
      if (!tbody) return;

      var emptyEl = document.getElementById('empty-scores');
      var tableEl = document.getElementById('scores-table');

      if (!plays || plays.length === 0) {
        tbody.innerHTML = '';
        if (emptyEl) emptyEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
        var rowCountEl = document.getElementById('table-row-count');
        if (rowCountEl) rowCountEl.textContent = '0 plays';
        return;
      }

      var html = plays.map(function(play) {
        var safeEmail = escapeHtmlStr(play.email);
        var safeDomain = escapeHtmlStr(play.domain || '');
        var initial = (play.email[0] || '?').toUpperCase();
        var devBadge = play.isDev ? '<span class="dev-badge-small" title="Dev tester prescreen track">🧪 Dev</span>' : '';

        var statusPill = play.hasWon
          ? '<span class="status-pill status-won">🎉 Solved</span>'
          : '<span class="status-pill status-playing">⏳ Playing</span>';

        var scoreTierClass = play.score >= 900
          ? 'score-tier-high'
          : (play.score >= 700 ? 'score-tier-med' : (play.score > 0 ? 'score-tier-low' : 'score-tier-zero'));

        var guessesChips = (play.guesses || []).map(function(g, idx) {
          var isLastAndWon = play.hasWon && idx === play.guesses.length - 1;
          return '<span class="guess-chip ' + (isLastAndWon ? 'guess-chip-target' : '') + '">' + escapeHtmlStr(g) + '</span>';
        }).join(' ');

        var guessLabel = play.guessCount === 1 ? '1 guess' : (play.guessCount + ' guesses');

        var timeFormatted = '—';
        if (play.wonAt || play.updatedAt) {
          try {
            timeFormatted = new Date(play.wonAt || play.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
          } catch (e) {}
        }

        return '<tr class="score-row" data-email="' + safeEmail + '" data-domain="' + safeDomain + '" data-status="' + play.status + '">' +
          '<td>' +
            '<div class="player-cell">' +
              '<div class="avatar">' + initial + '</div>' +
              '<div class="player-details">' +
                '<span class="player-email">' + safeEmail + ' ' + devBadge + '</span>' +
                '<span class="domain-pill">@' + safeDomain + '</span>' +
              '</div>' +
            '</div>' +
          '</td>' +
          '<td>' + statusPill + '</td>' +
          '<td><span class="score-badge ' + scoreTierClass + '">' + play.score + ' pts</span></td>' +
          '<td>' +
            '<div class="guesses-wrapper">' +
              '<span class="guess-count-pill">' + guessLabel + '</span>' +
              '<div class="guess-chips">' + guessesChips + '</div>' +
            '</div>' +
          '</td>' +
          '<td>' + (play.hintsUsed > 0 ? ('💡 ' + play.hintsUsed) : '—') + '</td>' +
          '<td style="color: #94a3b8; font-size: 12px;">' + timeFormatted + '</td>' +
        '</tr>';
      }).join('');

      tbody.innerHTML = html;
      if (emptyEl) emptyEl.style.display = 'none';
      if (tableEl) tableEl.style.display = 'table';
      var rowCountEl = document.getElementById('table-row-count');
      if (rowCountEl) rowCountEl.textContent = plays.length + (plays.length === 1 ? ' play' : ' plays');
    }

    function updateDashboardUI(data) {
      document.getElementById('kpi-active-subs').textContent = data.subscribers.activeCount;
      document.getElementById('kpi-domains-count').textContent = data.subscribers.uniqueDomainsCount;
      document.getElementById('kpi-today-players').textContent = data.todayStats.totalPlayers;
      document.getElementById('kpi-today-won').textContent = data.todayStats.totalWon;
      document.getElementById('kpi-today-avg-score').textContent = data.todayStats.avgScore;
      document.getElementById('kpi-today-top-score').textContent = data.todayStats.topScore + ' pts';
      document.getElementById('kpi-all-plays').textContent = data.allPlays.length;

      document.getElementById('selected-puzzle-title').textContent = data.selectedPuzzle.id;
      document.getElementById('selected-puzzle-date').textContent = data.selectedPuzzle.date;
      document.getElementById('count-all').textContent = data.selectedPlays.length;
      document.getElementById('count-won').textContent = data.selectedPuzzleStats.totalWon;
      document.getElementById('count-playing').textContent = data.selectedPuzzleStats.totalPlaying;

      if (data.dailyActiveUsers) {
        currentData.dailyActiveUsers = data.dailyActiveUsers;
        renderDauChart(data.dailyActiveUsers);
        renderCompletionChart(data.dailyActiveUsers);
      }

      renderScoresTable(data.selectedPlays);
      applyFilters();
      applySubFilters();

      if (data.userProfiles) {
        currentData.userProfiles = data.userProfiles;
        var badgeUsers = document.getElementById('tab-badge-users');
        if (badgeUsers) badgeUsers.textContent = data.userProfiles.length;
        if (selectedUserEmail) selectUser(selectedUserEmail);
        applyUserFilters();
      }
    }

    // Subscriber Actions
    async function handleAddSubscriber(e) {
      e.preventDefault();
      var input = document.getElementById('add-email-input');
      var email = input.value.trim();
      if (!email) return;

      var btn = document.getElementById('btn-add-sub');
      btn.disabled = true;
      btn.textContent = 'Adding...';

      try {
        var res = await fetch('/dev/api/subscribers/add', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast('Added ' + email + ' to subscribers!');
          input.value = '';
          window.location.reload();
        } else {
          alert(data.error || 'Failed to add subscriber');
        }
      } catch (err) {
        alert('Failed to connect to subscriber API: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Add Subscriber';
      }
    }

    async function handleAddDevTester(e) {
      e.preventDefault();
      var input = document.getElementById('dev-email-input');
      var email = input.value.trim();
      if (!email) return;

      var btn = document.getElementById('btn-add-dev');
      btn.disabled = true;
      btn.textContent = 'Adding...';

      try {
        var res = await fetch('/dev/api/subscribers/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, isDev: true, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast('Added ' + email + ' to Dev Prescreen team!');
          input.value = '';
          window.location.reload();
        } else {
          alert(data.error || 'Failed to add dev tester');
        }
      } catch (err) {
        alert('Failed to update dev tester: ' + err.message);
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Add Dev Tester';
      }
    }

    async function toggleDevStatus(email, btn) {
      var isCurrentlyDev = btn.classList.contains('btn-dev-active');
      btn.disabled = true;
      try {
        var res = await fetch('/dev/api/subscribers/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, isDev: !isCurrentlyDev, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast((!isCurrentlyDev ? 'Added to' : 'Removed from') + ' Dev Prescreen!');
          window.location.reload();
        } else {
          alert(data.error || 'Failed to toggle dev status');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    async function removeDevTester(email) {
      if (!confirm('Remove ' + email + ' from the Dev Prescreen team?')) return;
      try {
        var res = await fetch('/dev/api/subscribers/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, isDev: false, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast('Removed ' + email + ' from Dev Prescreen team');
          window.location.reload();
        } else {
          alert(data.error || 'Failed to remove dev tester');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      }
    }

    async function toggleStatus(email, btn) {
      var row = btn.closest('.sub-row');
      var currentStatus = row.getAttribute('data-status');
      var newStatus = currentStatus === 'active' ? 'unsubscribed' : 'active';
      btn.disabled = true;

      try {
        var res = await fetch('/dev/api/subscribers/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, status: newStatus, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast('Updated status for ' + email);
          window.location.reload();
        } else {
          alert(data.error || 'Failed to toggle subscriber status');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    async function purgeSubscriber(email, btn) {
      if (!confirm('Permanently delete ' + email + ' from ' + (currentSource === 'prod' ? 'Production DB' : 'Local KV') + '? This cannot be undone.')) return;
      btn.disabled = true;

      try {
        var res = await fetch('/dev/api/subscribers/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, purge: true, source: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast('Purged ' + email + ' successfully');
          window.location.reload();
        } else {
          alert(data.error || 'Failed to purge subscriber');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    function copyActiveEmails() {
      var rows = document.querySelectorAll('#subscribers-tbody .sub-row');
      var activeEmails = [];
      rows.forEach(function(row) {
        if (row.getAttribute('data-status') === 'active') {
          activeEmails.push(row.getAttribute('data-email'));
        }
      });
      if (activeEmails.length === 0) {
        showToast('No active subscribers to copy.');
        return;
      }
      var text = activeEmails.join(', ');
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied ' + activeEmails.length + ' active email(s) to clipboard!');
      }).catch(function() {
        showToast('Failed to copy active emails.');
      });
    }

    function exportSubscribersJson() {
      if (!currentData || !currentData.subscribers || !currentData.subscribers.list) return;
      var blob = new Blob([JSON.stringify(currentData.subscribers.list, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inboxed-subscribers.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported subscribers JSON');
    }

    function exportCsv() {
      if (!currentData || !currentData.selectedPlays) return;
      var headers = ['Email', 'Domain', 'Puzzle', 'Date', 'Status', 'Score', 'GuessesCount', 'Guesses', 'HintsUsed', 'Timestamp'];
      var rows = currentData.selectedPlays.map(function(p) {
        return [
          p.email,
          p.domain,
          p.puzzleId,
          p.date,
          p.status,
          p.score,
          p.guessCount,
          (p.guesses || []).join('; '),
          p.hintsUsed,
          p.wonAt || p.updatedAt || ''
        ].map(function(v) { return '"' + String(v).replace(/"/g, '""') + '"'; }).join(',');
      });
      var csv = [headers.join(','), rows.join('\\n')].join('\\n');
      var blob = new Blob([csv], { type: 'text/csv' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inboxed-puzzle-' + currentData.selectedPuzzle.id + '-scores.csv';
      a.click();
      URL.revokeObjectURL(url);
    }

    function exportJson() {
      if (!currentData) return;
      var blob = new Blob([JSON.stringify(currentData, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inboxed-dashboard-data.json';
      a.click();
      URL.revokeObjectURL(url);
    }

    // User Settings & Profile Inspector Actions
    function openUserSettings(email) {
      switchDashboardTab('settings');
      selectUser(email);
      var card = document.getElementById('user-inspector-card');
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }

    function selectUser(email) {
      if (!email || !currentData || !currentData.userProfiles) return;
      var clean = email.toLowerCase().trim();
      var user = currentData.userProfiles.find(function(u) { return u.email.toLowerCase().trim() === clean; });
      if (!user) return;

      selectedUserEmail = clean;

      // Update Inspector Identity
      var avatarEl = document.getElementById('inspector-avatar');
      if (avatarEl) avatarEl.textContent = (clean[0] || '?').toUpperCase();
      var emailEl = document.getElementById('inspector-email');
      if (emailEl) emailEl.textContent = clean;
      var domainEl = document.getElementById('inspector-domain');
      if (domainEl) domainEl.textContent = user.domain ? ('@' + user.domain) : '—';

      var devBadge = document.getElementById('inspector-dev-badge');
      if (devBadge) devBadge.style.display = user.isDev ? 'inline-flex' : 'none';

      var subPill = document.getElementById('inspector-sub-status');
      if (subPill) {
        subPill.className = 'status-pill ' + (user.isSubscribed ? 'status-won' : 'status-lost');
        subPill.textContent = user.isSubscribed ? 'Active' : 'Unsubscribed';
      }

      var visPill = document.getElementById('inspector-visibility-pill');
      if (visPill) {
        visPill.className = user.showOnLeaderboard ? 'badge-vis-public' : 'badge-vis-hidden';
        visPill.textContent = user.showOnLeaderboard ? '👁️ Public' : '🔒 Hidden';
      }

      var themePill = document.getElementById('inspector-theme-pill');
      if (themePill) {
        themePill.className = user.theme === 'dark' ? 'badge-theme-dark' : 'badge-theme-light';
        themePill.textContent = user.theme === 'dark' ? '🌙 Dark' : '☀️ Light';
      }

      // Col 1: Privacy & Theme buttons
      var btnVisPub = document.getElementById('btn-vis-public');
      var btnVisHid = document.getElementById('btn-vis-hidden');
      if (btnVisPub && btnVisHid) {
        btnVisPub.className = 'seg-btn ' + (user.showOnLeaderboard ? 'active' : '');
        btnVisHid.className = 'seg-btn ' + (!user.showOnLeaderboard ? 'active-rose' : '');
      }

      var btnThLight = document.getElementById('btn-theme-light');
      var btnThDark = document.getElementById('btn-theme-dark');
      if (btnThLight && btnThDark) {
        btnThLight.className = 'seg-btn ' + (user.theme !== 'dark' ? 'active-amber' : '');
        btnThDark.className = 'seg-btn ' + (user.theme === 'dark' ? 'active-dark' : '');
      }

      // Col 2: Sub & Track buttons
      var btnSubAct = document.getElementById('btn-sub-active');
      var btnSubUn = document.getElementById('btn-sub-unsub');
      if (btnSubAct && btnSubUn) {
        btnSubAct.className = 'seg-btn ' + (user.isSubscribed ? 'active-emerald' : '');
        btnSubUn.className = 'seg-btn ' + (!user.isSubscribed ? 'active-rose' : '');
      }

      var btnTrackStd = document.getElementById('btn-track-std');
      var btnTrackDev = document.getElementById('btn-track-dev');
      if (btnTrackStd && btnTrackDev) {
        btnTrackStd.className = 'seg-btn ' + (!user.isDev ? 'active' : '');
        btnTrackDev.className = 'seg-btn ' + (user.isDev ? 'active-dark' : '');
      }

      // Token and links
      var tokenText = user.accountToken || '';
      var tokenEl = document.getElementById('inspector-token-text');
      if (tokenEl) tokenEl.textContent = tokenText || 'Not generated';

      var accLink = document.getElementById('inspector-account-link');
      if (accLink) {
        var baseOrigin = window.location.origin;
        accLink.href = tokenText ? (baseOrigin + '/account?token=' + encodeURIComponent(tokenText)) : ('/dev/page/account?email=' + encodeURIComponent(clean));
      }

      // Col 3: Stats
      var statDays = document.getElementById('inspector-stat-days');
      if (statDays) statDays.textContent = user.daysPlayed || 0;

      var statPuzzles = document.getElementById('inspector-stat-puzzles');
      if (statPuzzles) statPuzzles.textContent = (user.playedPuzzles || []).length;

      // History records for this user from allPlays
      var userPlays = (currentData.allPlays || []).filter(function(p) { return p.email.toLowerCase().trim() === clean; });
      var wonCount = userPlays.filter(function(p) { return p.hasWon; }).length;
      var statWon = document.getElementById('inspector-stat-won');
      if (statWon) statWon.textContent = wonCount;

      // Played Puzzles chips
      var puzChips = document.getElementById('inspector-played-puzzles-chips');
      if (puzChips) {
        var pList = user.playedPuzzles || [];
        if (pList.length === 0) {
          puzChips.innerHTML = '<span style="color: #64748b; font-size: 12px;">No puzzles played yet</span>';
        } else {
          puzChips.innerHTML = pList.map(function(pid) {
            return '<span class="history-chip history-chip-puzzle">#' + escapeHtmlStr(pid) + '</span>';
          }).join(' ');
        }
      }

      // Played Dates chips
      var dateChips = document.getElementById('inspector-played-dates-chips');
      if (dateChips) {
        var dList = user.playedDates || [];
        if (dList.length === 0) {
          dateChips.innerHTML = '<span style="color: #64748b; font-size: 12px;">No dates recorded</span>';
        } else {
          dateChips.innerHTML = dList.map(function(d) {
            return '<span class="history-chip">' + escapeHtmlStr(d) + '</span>';
          }).join(' ');
        }
      }

      // History table
      var histTbody = document.getElementById('inspector-history-tbody');
      var histCount = document.getElementById('inspector-history-count');
      if (histCount) histCount.textContent = userPlays.length;

      if (histTbody) {
        if (userPlays.length === 0) {
          histTbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: #64748b; padding: 20px;">No gameplay records found for this user.</td></tr>';
        } else {
          histTbody.innerHTML = userPlays.map(function(play) {
            var statusPill = play.hasWon
              ? '<span class="status-pill status-won">🎉 Solved</span>'
              : '<span class="status-pill status-playing">⏳ Playing</span>';
            var chips = (play.guesses || []).map(function(g) {
              return '<span class="guess-chip">' + escapeHtmlStr(g) + '</span>';
            }).join(' ');
            var timeFormatted = '—';
            if (play.wonAt || play.updatedAt) {
              try { timeFormatted = new Date(play.wonAt || play.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) {}
            }
            return '<tr>' +
              '<td><strong style="color: #38bdf8;">#' + escapeHtmlStr(play.puzzleId) + '</strong></td>' +
              '<td style="color: #94a3b8; font-family: monospace;">' + escapeHtmlStr(play.date || '—') + '</td>' +
              '<td>' + statusPill + '</td>' +
              '<td><span class="score-badge score-tier-high">' + play.score + ' pts</span></td>' +
              '<td><div class="guess-chips">' + (chips || '—') + '</div></td>' +
              '<td>' + (play.hintsUsed > 0 ? ('💡 ' + play.hintsUsed) : '—') + '</td>' +
              '<td style="color: #94a3b8; font-size: 12px;">' + timeFormatted + '</td>' +
            '</tr>';
          }).join('');
        }
      }
    }

    async function setUserSetting(field, value) {
      if (!selectedUserEmail) {
        alert('Please select a user to inspect first.');
        return;
      }

      var payload = {
        email: selectedUserEmail,
        target: currentSource
      };
      payload[field] = value;

      try {
        var res = await fetch('/dev/api/user-settings/update', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        var data = await res.json();
        if (data.success) {
          showToast(data.message || 'Updated user setting successfully!');
          var user = currentData.userProfiles.find(function(u) { return u.email.toLowerCase().trim() === selectedUserEmail; });
          if (user) {
            if (field === 'showOnLeaderboard') user.showOnLeaderboard = value;
            if (field === 'theme') user.theme = value;
            if (field === 'status') user.isSubscribed = (value === 'active');
            if (field === 'isDev') user.isDev = value;
          }
          selectUser(selectedUserEmail);
        } else {
          alert(data.error || 'Failed to update user setting');
        }
      } catch (err) {
        alert('Network error: ' + err.message);
      }
    }

    function copyInspectorEmail() {
      if (selectedUserEmail) copyText(selectedUserEmail);
    }

    function copyInspectorAccountLink() {
      var accLink = document.getElementById('inspector-account-link');
      if (accLink && accLink.href) copyText(accLink.href);
    }

    function copyInspectorToken() {
      var tokenEl = document.getElementById('inspector-token-text');
      if (tokenEl && tokenEl.textContent) copyText(tokenEl.textContent);
    }

    function setUserFilter(filter, btn) {
      activeUserFilter = filter;
      document.querySelectorAll('#section-user-settings .tab-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      applyUserFilters();
    }

    function applyUserFilters() {
      var query = (document.getElementById('user-search-input').value || '').toLowerCase().trim();
      var rows = document.querySelectorAll('#users-directory-tbody .user-profile-row');
      var visibleCount = 0;

      rows.forEach(function(row) {
        var email = (row.getAttribute('data-email') || '').toLowerCase();
        var domain = (row.getAttribute('data-domain') || '').toLowerCase();
        var isSub = row.getAttribute('data-subscribed') === 'true';
        var isDev = row.getAttribute('data-dev') === 'true';
        var hasPlayed = row.getAttribute('data-played') === 'true';

        var matchesQuery = !query || email.includes(query) || domain.includes(query);
        var matchesFilter = true;
        if (activeUserFilter === 'active') matchesFilter = isSub;
        else if (activeUserFilter === 'dev') matchesFilter = isDev;
        else if (activeUserFilter === 'played') matchesFilter = hasPlayed;

        if (matchesQuery && matchesFilter) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });

      var emptyEl = document.getElementById('empty-users');
      var tableEl = document.getElementById('users-directory-table');
      if (visibleCount === 0) {
        if (emptyEl) emptyEl.style.display = 'block';
        if (tableEl) tableEl.style.display = 'none';
      } else {
        if (emptyEl) emptyEl.style.display = 'none';
        if (tableEl) tableEl.style.display = 'table';
      }
      document.getElementById('user-table-count').textContent = visibleCount + ' shown';
    }

    function exportUsersJson() {
      if (!currentData || !currentData.userProfiles) return;
      var blob = new Blob([JSON.stringify(currentData.userProfiles, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inboxed-user-profiles.json';
      a.click();
      URL.revokeObjectURL(url);
      showToast('Exported user profiles JSON');
    }

    if (selectedUserEmail) {
      selectUser(selectedUserEmail);
    }
  </script>
</body>
</html>
`
}
