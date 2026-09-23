import { escapeHtml } from '../../game'
import type { SubscriberEntry } from '../../core'
import { DEV_SUBSCRIBERS_CSS } from './devSubscribersTemplate'

export function getDevSubscribersPageHtml(paramsOrSubscribers: SubscriberEntry[] | {
  subscribers: SubscriberEntry[]
  source?: 'prod' | 'local'
  prodOrigin?: string
  fetchError?: string
} = []): string {
  const isArray = Array.isArray(paramsOrSubscribers)
  const subscribers = isArray ? paramsOrSubscribers : (paramsOrSubscribers.subscribers || [])
  const source = (!isArray && paramsOrSubscribers.source) ? paramsOrSubscribers.source : 'prod'
  const prodOrigin = (!isArray && paramsOrSubscribers.prodOrigin) ? paramsOrSubscribers.prodOrigin : 'https://inboxed.fun'
  const fetchError = (!isArray && paramsOrSubscribers.fetchError) ? paramsOrSubscribers.fetchError : ''
  const isProd = source === 'prod'

  const total = subscribers.length
  const activeCount = subscribers.filter(s => s.status === 'active').length
  const unsubscribedCount = total - activeCount
  const domains = Array.from(new Set(subscribers.map(s => s.domain).filter(Boolean)))
  const uniqueDomainsCount = domains.length

  const rowsHtml = subscribers.map((sub) => {
    const safeEmail = escapeHtml(sub.email)
    const safeDomain = escapeHtml(sub.domain || '')
    const isActive = sub.status === 'active'
    const statusClass = isActive ? 'status-active' : 'status-unsubscribed'
    const statusText = isActive ? 'Active' : 'Unsubscribed'
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
          <div class="email-cell">
            <span class="avatar-circle">${initial}</span>
            <div class="email-info">
              <span class="email-text" title="${safeEmail}">${safeEmail}</span>
              <button type="button" class="btn-copy" onclick="copyText('${safeEmail}', this)" title="Copy email address">📋</button>
            </div>
          </div>
        </td>
        <td>
          <span class="domain-badge">${safeDomain ? `@${safeDomain}` : '—'}</span>
        </td>
        <td>
          <span class="date-text" title="${escapeHtml(sub.subscribedAt || '')}">${dateFormatted}</span>
        </td>
        <td>
          <span class="status-pill ${statusClass}">
            <span class="status-dot"></span>
            ${statusText}
          </span>
        </td>
        <td>
          <div class="row-actions">
            <button type="button" class="btn-action btn-workbench" onclick="selectInWorkbench('${safeEmail}')" title="Test this user in Dev Workbench">🎮 Workbench</button>
            <a href="/dev/page/account?email=${encodeURIComponent(sub.email)}" target="_blank" class="btn-action btn-account" title="Open user account preferences">⚙️ Account</a>
            <button type="button" class="btn-action btn-toggle" onclick="toggleStatus('${safeEmail}', this)" title="Toggle active/unsubscribed">${isActive ? 'Deactivate' : 'Activate'}</button>
            <button type="button" class="btn-action btn-purge" onclick="purgeSubscriber('${safeEmail}', this)" title="Permanently delete subscriber from KV">🗑️</button>
          </div>
        </td>
      </tr>
    `
  }).join('')

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev - Subscribed Emails (${isProd ? 'Production' : 'Local'})</title>
  <style>${DEV_SUBSCRIBERS_CSS}</style>
</head>
<body>
  <div class="container">
    <div class="header-area">
      <div class="title-row">
        <div class="title-group">
          <h1>Subscribed Emails</h1>
          <span class="badge-kv ${isProd ? 'badge-prod' : 'badge-local-source'}">
            ${isProd ? '🟢 Production DB' : '💻 Local Dev KV'}
          </span>
          <span style="font-size: 11.5px; color: #64748b; font-family: monospace;">(${escapeHtml(prodOrigin)})</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <div class="source-toggle-group">
            <a href="/dev/page/subscribers?source=prod" class="source-toggle-btn ${isProd ? 'active' : ''}">🌐 Production</a>
            <a href="/dev/page/subscribers?source=local" class="source-toggle-btn ${!isProd ? 'active' : ''}">💻 Local KV</a>
          </div>
          <button type="button" class="btn btn-secondary" onclick="window.location.reload()" title="Refresh subscriber list">🔄 Refresh</button>
          <button type="button" class="btn btn-secondary" onclick="copyActiveEmails()" title="Copy comma-separated active emails">📋 Copy Active</button>
          <button type="button" class="btn btn-secondary" onclick="exportJson()" title="Download subscribers list as JSON">💾 Export JSON</button>
        </div>
      </div>
      <p class="subtitle">
        ${isProd
          ? `Live directory of confirmed email addresses from the production database (<strong>${escapeHtml(prodOrigin)}</strong>).`
          : 'Directory of email addresses registered in the local development KV database.'
        }
      </p>
      ${fetchError ? `
        <div style="margin-top: 10px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12.5px; color: #92400e;">
          ℹ️ <strong>Note:</strong> ${escapeHtml(fetchError)}
        </div>
      ` : ''}
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Subscribers</div>
        <div class="stat-value" id="stat-total">${total}</div>
      </div>
      <div class="stat-card active-card">
        <div class="stat-label">Active (Receiving)</div>
        <div class="stat-value" id="stat-active">${activeCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unsubscribed</div>
        <div class="stat-value" id="stat-unsub">${unsubscribedCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Workplace Domains</div>
        <div class="stat-value" id="stat-domains">${uniqueDomainsCount}</div>
      </div>
    </div>

    <!-- Toolbar: Search, Filters, Add Subscriber -->
    <div class="toolbar-box">
      <div class="toolbar-row">
        <div class="search-wrapper">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" class="search-input" placeholder="Search by email or domain..." oninput="applyFilters()">
        </div>

        <div class="filter-tabs">
          <button type="button" class="filter-tab active" data-filter="all" onclick="setFilter('all', this)">All (${total})</button>
          <button type="button" class="filter-tab" data-filter="active" onclick="setFilter('active', this)">Active (${activeCount})</button>
          <button type="button" class="filter-tab" data-filter="unsubscribed" onclick="setFilter('unsubscribed', this)">Unsubscribed (${unsubscribedCount})</button>
        </div>
      </div>

      <div class="toolbar-row" style="border-top: 1px solid #f1f5f9; padding-top: 12px;">
        <form class="add-form-group" onsubmit="handleAddSubscriber(event)">
          <input type="email" id="add-email-input" class="email-input" placeholder="player@company.com" required>
          <button type="submit" id="btn-add-sub" class="btn btn-primary">+ Add Subscriber</button>
        </form>
        <span style="font-size: 11.5px; color: #94a3b8;">Emails added directly are marked as active in KV.</span>
      </div>
    </div>

    <!-- Subscribers Table -->
    <div class="table-container">
      <table id="subscribers-table">
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
          ${rowsHtml}
        </tbody>
      </table>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    var currentFilter = 'all';
    var currentSource = '${source}';

    function showToast(msg) {
      var toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.style.display = 'block';
      setTimeout(function() {
        toast.style.display = 'none';
      }, 2500);
    }

    function copyText(text, btn) {
      navigator.clipboard.writeText(text).then(function() {
        showToast('Copied ' + text + ' to clipboard!');
      }).catch(function() {
        showToast('Failed to copy.');
      });
    }

    function selectInWorkbench(email) {
      try {
        if (window.parent && window.parent !== window && window.parent.document.getElementById('email-input')) {
          var input = window.parent.document.getElementById('email-input');
          input.value = email;
          var form = window.parent.document.getElementById('dev-params-form');
          if (form) form.submit();
          return;
        }
      } catch (e) {}
      window.top.location.href = '/dev?email=' + encodeURIComponent(email);
    }

    function setFilter(filter, btn) {
      currentFilter = filter;
      document.querySelectorAll('.filter-tab').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');
      applyFilters();
    }

    function applyFilters() {
      var query = (document.getElementById('search-input').value || '').toLowerCase().trim();
      var rows = document.querySelectorAll('#subscribers-tbody .sub-row');
      var visibleCount = 0;

      rows.forEach(function(row) {
        var email = (row.getAttribute('data-email') || '').toLowerCase();
        var domain = (row.getAttribute('data-domain') || '').toLowerCase();
        var status = row.getAttribute('data-status') || '';

        var matchesQuery = !query || email.indexOf(query) !== -1 || domain.indexOf(query) !== -1;
        var matchesStatus = currentFilter === 'all' || status === currentFilter;

        if (matchesQuery && matchesStatus) {
          row.style.display = '';
          visibleCount++;
        } else {
          row.style.display = 'none';
        }
      });
    }

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
          body: JSON.stringify({ email: email, target: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast(data.message || ('Added ' + email + '!'));
          input.value = '';
          setTimeout(function() { window.location.reload(); }, 600);
        } else {
          showToast('Error: ' + (data.error || 'Failed to add subscriber'));
        }
      } catch (err) {
        showToast('Network error while adding subscriber');
      } finally {
        btn.disabled = false;
        btn.textContent = '+ Add Subscriber';
      }
    }

    async function toggleStatus(email, btn) {
      btn.disabled = true;
      btn.textContent = 'Updating...';
      try {
        var res = await fetch('/dev/api/subscribers/toggle', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, target: currentSource })
        });
        var data = await res.json();
        if (data.success) {
          showToast(data.message || 'Status updated!');
          setTimeout(function() { window.location.reload(); }, 600);
        } else {
          showToast('Error: ' + (data.error || 'Failed to update'));
          btn.disabled = false;
          btn.textContent = 'Toggle';
        }
      } catch (err) {
        showToast('Network error updating status');
        btn.disabled = false;
        btn.textContent = 'Toggle';
      }
    }

    async function purgeSubscriber(email, btn) {
      var promptMsg = currentSource === 'prod'
        ? '⚠️ ARE YOU SURE? This will PERMANENTLY delete ' + email + ' from the LIVE PRODUCTION database at ' + '${escapeHtml(prodOrigin)}' + '!'
        : 'Are you sure you want to permanently delete ' + email + ' from the local subscribers list?';

      if (!confirm(promptMsg)) {
        return;
      }
      btn.disabled = true;
      btn.textContent = '...';
      try {
        var res = await fetch('/dev/api/subscribers/remove', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: email, target: currentSource, purge: true })
        });
        var data = await res.json();
        if (data.success) {
          showToast(data.message || ('Purged ' + email));
          setTimeout(function() { window.location.reload(); }, 600);
        } else {
          showToast('Error: ' + (data.error || 'Failed to purge subscriber'));
          btn.disabled = false;
          btn.textContent = '🗑️';
        }
      } catch (err) {
        showToast('Network error purging subscriber');
        btn.disabled = false;
        btn.textContent = '🗑️';
      }
    }

    async function seedDemoSubscribers() {
      try {
        var res = await fetch('/dev/api/subscribers/seed', {
          method: 'POST'
        });
        var data = await res.json();
        if (data.success) {
          showToast(data.message || 'Demo subscribers seeded!');
          window.location.reload();
        } else {
          showToast('Error: ' + (data.error || 'Failed to seed subscribers'));
        }
      } catch (err) {
        showToast('Network error while seeding demo data');
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

    function exportJson() {
      var rows = document.querySelectorAll('#subscribers-tbody .sub-row');
      var list = [];
      rows.forEach(function(row) {
        list.push({
          email: row.getAttribute('data-email'),
          domain: row.getAttribute('data-domain'),
          status: row.getAttribute('data-status')
        });
      });
      var blob = new Blob([JSON.stringify(list, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = 'inboxed-subscribers.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showToast('Exported subscribers JSON');
    }
  </script>
</body>
</html>`
}

// Render Development-only Workbench page for inspecting live game HTML, confirmation, and other pages
