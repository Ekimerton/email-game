import { escapeHtml } from '../../game'
import type { DashboardStats, PlayerScoreRecord, DomainStats } from '../../services'
import type { SubscriberEntry } from '../../core'
import { DEV_DASHBOARD_CSS } from './devDashboardTemplate'

export interface DevDashboardViewParams {
  stats: DashboardStats
  source?: 'prod' | 'local'
  prodOrigin?: string
  fetchError?: string
  activeTab?: 'gameplay' | 'subscribers'
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
    return `
      <tr>
        <td><span class="domain-pill">@${safeDomain}</span></td>
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
            <button type="button" class="btn-action btn-dev-toggle ${isDev ? 'btn-dev-active' : ''}" onclick="toggleDevStatus('${safeEmail}', this)" title="${isDev ? 'Remove from dev prescreen list' : 'Add to dev prescreen list (42 days ahead)'}">${isDev ? '🧪 Remove Dev' : '🧪 Make Dev'}</button>
            <a href="/dev/page/account?email=${encodeURIComponent(sub.email)}" target="_blank" class="btn-action" title="Open user account preferences">⚙️ Account</a>
            <button type="button" class="btn-action" onclick="toggleStatus('${safeEmail}', this)" title="Toggle active/unsubscribed">${isActive ? 'Deactivate' : 'Activate'}</button>
            <button type="button" class="btn-action btn-purge" onclick="purgeSubscriber('${safeEmail}', this)" title="Permanently delete subscriber">🗑️</button>
          </div>
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
        <div class="logo-tiles" aria-label="INBOXED">
          <span class="logo-tile" style="background-color: #D8FFC5;">I</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">N</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">B</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">O</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">X</span>
          <span class="logo-tile" style="background-color: #C4F7CA;">E</span>
          <span class="logo-tile" style="background-color: #D8FFC5;">D</span>
        </div>
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

    <!-- Main Section Tabs: Gameplay vs Subscribed Emails -->
    <nav class="dashboard-nav-tabs">
      <button type="button" id="tab-btn-gameplay" class="nav-tab-btn ${initialTab === 'gameplay' ? 'active' : ''}" onclick="switchDashboardTab('gameplay')">
        🎮 Gameplay &amp; Scores
      </button>
      <button type="button" id="tab-btn-subscribers" class="nav-tab-btn ${initialTab === 'subscribers' ? 'active' : ''}" onclick="switchDashboardTab('subscribers')">
        👥 Subscribed Emails &amp; Dev Testers <span class="nav-tab-badge">${stats.subscribers.total}</span>
      </button>
    </nav>

    <!-- TAB 1: GAMEPLAY & SCORES SECTION -->
    <div id="section-gameplay" style="display: ${initialTab === 'gameplay' ? 'block' : 'none'};">
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
  </main>

  <div id="toast" class="toast"></div>

  <script>
    var currentData = ${dashboardJson};
    var currentSource = '${source}';
    var activeFilter = 'all';
    var activeSubFilter = 'all';
    var currentTab = '${initialTab}';

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

      document.getElementById('tab-btn-gameplay').classList.toggle('active', tab === 'gameplay');
      document.getElementById('tab-btn-subscribers').classList.toggle('active', tab === 'subscribers');

      try {
        var url = new URL(window.location);
        url.searchParams.set('tab', tab);
        window.history.replaceState({}, '', url);
      } catch (e) {}
    }

    function setFilter(filter, btn) {
      activeFilter = filter;
      document.querySelectorAll('#section-gameplay .tab-btn').forEach(function(b) { b.classList.remove('active'); });
      if (btn) btn.classList.add('active');
      applyFilters();
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

    async function handlePuzzleChange(puzzleId) {
      await refreshData(puzzleId);
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

      applyFilters();
      applySubFilters();
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
  </script>
</body>
</html>
`
}
