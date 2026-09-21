export const DEV_SUBSCRIBERS_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 20px;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .header-area {
      margin-bottom: 20px;
    }
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 6px;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .badge-kv {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-prod {
      background: #C4F7CA;
      color: #064e3b;
      border: 1px solid #86efac;
    }
    .badge-local-source {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .source-toggle-group {
      display: inline-flex;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .source-toggle-btn {
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      color: #64748b;
      transition: all 0.15s ease;
    }
    .source-toggle-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
    }
    /* Stat Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-card.active-card {
      border-color: #86efac;
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
    }
    .stat-card.active-card .stat-value {
      color: #15803d;
    }
    /* Toolbar & Search */
    .toolbar-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 220px;
      max-width: 400px;
    }
    .search-input {
      width: 100%;
      padding: 7px 12px 7px 32px;
      font-size: 13px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background: #f8fafc;
      color: #0f172a;
    }
    .search-input:focus {
      border-color: #0f172a;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: #94a3b8;
      pointer-events: none;
    }
    .filter-tabs {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 7px;
      gap: 2px;
    }
    .filter-tab {
      padding: 5px 11px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      border: none;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-tab.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }
    /* Add form & Action group */
    .add-form-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .email-input {
      padding: 7px 10px;
      font-size: 13px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      min-width: 200px;
      background: #ffffff;
    }
    .email-input:focus {
      border-color: #0f172a;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-primary {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
    }
    .btn-primary:hover {
      background-color: #bbf4c3;
    }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    /* Table styling */
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
      vertical-align: middle;
    }
    tr.sub-row:hover td {
      background: #fbfcfe;
    }
    .email-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .email-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .email-text {
      font-weight: 600;
      color: #0f172a;
    }
    .btn-copy {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      color: #94a3b8;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .btn-copy:hover {
      background: #f1f5f9;
      color: #334155;
    }
    .domain-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    }
    .date-text {
      color: #64748b;
      font-size: 12px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-active {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .status-active .status-dot {
      background: #16a34a;
    }
    .status-unsubscribed {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .status-unsubscribed .status-dot {
      background: #94a3b8;
    }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action {
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .btn-workbench {
      background: #eefdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .btn-workbench:hover {
      background: #dcfce7;
      border-color: #86efac;
    }
    .btn-purge {
      color: #dc2626;
      border-color: #fca5a5;
      background: #fff5f5;
    }
    .btn-purge:hover {
      background: #fee2e2;
    }
    /* Empty State */
    .empty-box {
      padding: 48px 24px;
      text-align: center;
      display: \${total === 0 ? 'block' : 'none'};
    }
    .empty-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .empty-desc {
      font-size: 13px;
      color: #64748b;
      max-width: 380px;
      margin: 0 auto 16px auto;
    }
    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15);
      display: none;
      z-index: 9999;
    }
`;

export const DEV_SUBSCRIBERS_HTML = `  return \`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev - Subscribed Emails (\${isProd ? 'Production' : 'Local'})</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      line-height: 1.5;
      padding: 24px 20px;
    }
    .container {
      max-width: 1040px;
      margin: 0 auto;
    }
    .header-area {
      margin-bottom: 20px;
    }
    .title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 12px;
      margin-bottom: 6px;
    }
    .title-group {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    h1 {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.3px;
    }
    .badge-kv {
      font-size: 11px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 6px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .badge-prod {
      background: #C4F7CA;
      color: #064e3b;
      border: 1px solid #86efac;
    }
    .badge-local-source {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }
    .source-toggle-group {
      display: inline-flex;
      border: 1.5px solid #cbd5e1;
      border-radius: 7px;
      overflow: hidden;
      background: #f1f5f9;
    }
    .source-toggle-btn {
      padding: 5px 10px;
      font-size: 12px;
      font-weight: 600;
      text-decoration: none;
      color: #64748b;
      transition: all 0.15s ease;
    }
    .source-toggle-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .subtitle {
      font-size: 13px;
      color: #64748b;
    }
    /* Stat Cards Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    .stat-card {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .stat-label {
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      margin-bottom: 4px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .stat-value {
      font-size: 22px;
      font-weight: 800;
      color: #0f172a;
    }
    .stat-card.active-card {
      border-color: #86efac;
      background: linear-gradient(180deg, #ffffff 0%, #f0fdf4 100%);
    }
    .stat-card.active-card .stat-value {
      color: #15803d;
    }
    /* Toolbar & Search */
    .toolbar-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 14px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
    }
    .toolbar-row {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .search-wrapper {
      position: relative;
      flex: 1;
      min-width: 220px;
      max-width: 400px;
    }
    .search-input {
      width: 100%;
      padding: 7px 12px 7px 32px;
      font-size: 13px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      background: #f8fafc;
      color: #0f172a;
    }
    .search-input:focus {
      border-color: #0f172a;
      background: #ffffff;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .search-icon {
      position: absolute;
      left: 10px;
      top: 50%;
      transform: translateY(-50%);
      font-size: 13px;
      color: #94a3b8;
      pointer-events: none;
    }
    .filter-tabs {
      display: inline-flex;
      background: #f1f5f9;
      padding: 3px;
      border-radius: 7px;
      gap: 2px;
    }
    .filter-tab {
      padding: 5px 11px;
      font-size: 12px;
      font-weight: 600;
      color: #64748b;
      border: none;
      background: transparent;
      border-radius: 5px;
      cursor: pointer;
      transition: all 0.15s ease;
    }
    .filter-tab.active {
      background: #ffffff;
      color: #0f172a;
      box-shadow: 0 1px 2px rgba(0,0,0,0.08);
    }
    /* Add form & Action group */
    .add-form-group {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .email-input {
      padding: 7px 10px;
      font-size: 13px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      outline: none;
      min-width: 200px;
      background: #ffffff;
    }
    .email-input:focus {
      border-color: #0f172a;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 7px 12px;
      font-size: 12.5px;
      font-weight: 600;
      border-radius: 6px;
      cursor: pointer;
      text-decoration: none;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .btn-primary {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
    }
    .btn-primary:hover {
      background-color: #bbf4c3;
    }
    .btn-secondary {
      background: #ffffff;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background: #f1f5f9;
      color: #0f172a;
    }
    /* Table styling */
    .table-container {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.03);
      overflow-x: auto;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 13px;
    }
    th {
      background: #f8fafc;
      color: #475569;
      font-weight: 700;
      padding: 12px 16px;
      border-bottom: 1px solid #e2e8f0;
      font-size: 11.5px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    td {
      padding: 12px 16px;
      border-bottom: 1px solid #f1f5f9;
      color: #0f172a;
      vertical-align: middle;
    }
    tr.sub-row:hover td {
      background: #fbfcfe;
    }
    .email-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .avatar-circle {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: #e2e8f0;
      color: #334155;
      font-weight: 700;
      font-size: 12px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .email-info {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .email-text {
      font-weight: 600;
      color: #0f172a;
    }
    .btn-copy {
      background: none;
      border: none;
      cursor: pointer;
      font-size: 12px;
      color: #94a3b8;
      padding: 2px 4px;
      border-radius: 4px;
    }
    .btn-copy:hover {
      background: #f1f5f9;
      color: #334155;
    }
    .domain-badge {
      display: inline-flex;
      align-items: center;
      padding: 3px 8px;
      border-radius: 6px;
      background: #f1f5f9;
      color: #475569;
      font-size: 12px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, monospace;
    }
    .date-text {
      color: #64748b;
      font-size: 12px;
    }
    .status-pill {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 3px 9px;
      border-radius: 9999px;
      font-size: 11.5px;
      font-weight: 700;
    }
    .status-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
    }
    .status-active {
      background: #dcfce7;
      color: #15803d;
      border: 1px solid #bbf7d0;
    }
    .status-active .status-dot {
      background: #16a34a;
    }
    .status-unsubscribed {
      background: #f1f5f9;
      color: #64748b;
      border: 1px solid #e2e8f0;
    }
    .status-unsubscribed .status-dot {
      background: #94a3b8;
    }
    .row-actions {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .btn-action {
      padding: 4px 8px;
      font-size: 11px;
      font-weight: 600;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      border: 1px solid #cbd5e1;
      background: #ffffff;
      color: #334155;
      transition: all 0.15s ease;
    }
    .btn-action:hover {
      background: #f8fafc;
      color: #0f172a;
      border-color: #94a3b8;
    }
    .btn-workbench {
      background: #eefdf4;
      color: #166534;
      border-color: #bbf7d0;
    }
    .btn-workbench:hover {
      background: #dcfce7;
      border-color: #86efac;
    }
    .btn-purge {
      color: #dc2626;
      border-color: #fca5a5;
      background: #fff5f5;
    }
    .btn-purge:hover {
      background: #fee2e2;
    }
    /* Empty State */
    .empty-box {
      padding: 48px 24px;
      text-align: center;
      display: \${total === 0 ? 'block' : 'none'};
    }
    .empty-icon {
      font-size: 36px;
      margin-bottom: 12px;
    }
    .empty-title {
      font-size: 16px;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 6px;
    }
    .empty-desc {
      font-size: 13px;
      color: #64748b;
      max-width: 380px;
      margin: 0 auto 16px auto;
    }
    /* Toast */
    .toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #0f172a;
      color: #ffffff;
      padding: 10px 18px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 600;
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.15);
      display: none;
      z-index: 9999;
    }</style>
</head>
<body>
  <div class="container">
    <div class="header-area">
      <div class="title-row">
        <div class="title-group">
          <h1>Subscribed Emails</h1>
          <span class="badge-kv \${isProd ? 'badge-prod' : 'badge-local-source'}">
            \${isProd ? '🟢 Production DB' : '💻 Local Dev KV'}
          </span>
          <span style="font-size: 11.5px; color: #64748b; font-family: monospace;">(\${escapeHtml(prodOrigin)})</span>
        </div>
        <div style="display: flex; gap: 8px; flex-wrap: wrap; align-items: center;">
          <div class="source-toggle-group">
            <a href="/dev/page/subscribers?source=prod" class="source-toggle-btn \${isProd ? 'active' : ''}">🌐 Production</a>
            <a href="/dev/page/subscribers?source=local" class="source-toggle-btn \${!isProd ? 'active' : ''}">💻 Local KV</a>
          </div>
          <button type="button" class="btn btn-secondary" onclick="window.location.reload()" title="Refresh subscriber list">🔄 Refresh</button>
          <button type="button" class="btn btn-secondary" onclick="copyActiveEmails()" title="Copy comma-separated active emails">📋 Copy Active</button>
          <button type="button" class="btn btn-secondary" onclick="exportJson()" title="Download subscribers list as JSON">💾 Export JSON</button>
        </div>
      </div>
      <p class="subtitle">
        \${isProd
          ? \`Live directory of confirmed email addresses from the production database (<strong>\${escapeHtml(prodOrigin)}</strong>).\`
          : 'Directory of email addresses registered in the local development KV database.'
        }
      </p>
      \${fetchError ? \`
        <div style="margin-top: 10px; padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; font-size: 12.5px; color: #92400e;">
          ℹ️ <strong>Note:</strong> \${escapeHtml(fetchError)}
        </div>
      \` : ''}
    </div>

    <!-- Stats Cards -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-label">Total Subscribers</div>
        <div class="stat-value" id="stat-total">\${total}</div>
      </div>
      <div class="stat-card active-card">
        <div class="stat-label">Active (Receiving)</div>
        <div class="stat-value" id="stat-active">\${activeCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Unsubscribed</div>
        <div class="stat-value" id="stat-unsub">\${unsubscribedCount}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Workplace Domains</div>
        <div class="stat-value" id="stat-domains">\${uniqueDomainsCount}</div>
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
          <button type="button" class="filter-tab active" data-filter="all" onclick="setFilter('all', this)">All (\${total})</button>
          <button type="button" class="filter-tab" data-filter="active" onclick="setFilter('active', this)">Active (\${activeCount})</button>
          <button type="button" class="filter-tab" data-filter="unsubscribed" onclick="setFilter('unsubscribed', this)">Unsubscribed (\${unsubscribedCount})</button>
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
      <table id="subscribers-table" style="display: \${total === 0 ? 'none' : 'table'};">
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
          \${rowsHtml}
        </tbody>
      </table>

      <!-- Empty State -->
      <div id="empty-state" class="empty-box">
        <div class="empty-icon">📬</div>
        <div class="empty-title">No Subscribers Yet</div>
        <div class="empty-desc">There are currently no subscribers stored in the KV database. Add a test subscriber above or seed demo accounts to test.</div>
        <button type="button" class="btn btn-primary" onclick="seedDemoSubscribers()">🌱 Seed Demo Subscribers</button>
      </div>
    </div>
  </div>

  <div id="toast" class="toast"></div>

  <script>
    var currentFilter = 'all';
    var currentSource = '\${source}';

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
        ? '⚠️ ARE YOU SURE? This will PERMANENTLY delete ' + email + ' from the LIVE PRODUCTION database at ' + '\${escapeHtml(prodOrigin)}' + '!'
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
</html>
`;
