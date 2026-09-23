export const DEV_WORKBENCH_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .dev-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 10px 20px;
    }
    .header-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 2px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      font-size: 12px;
      font-weight: 800;
      border-radius: 4px;
      border: 1.5px solid #18181b;
      margin-right: -2px;
    }
    .badge-dev {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 0 #e8ffea;
    }
    .badge-local {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 600;
    }
    .controls-section {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .dev-input {
      padding: 6px 10px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12.5px;
      color: #0f172a;
      outline: none;
      background: #ffffff;
    }
    .dev-input:focus {
      border-color: #18181b;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn-dev {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 700;
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
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-primary:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 4px rgba(0,0,0,0.08);
    }
    .btn-danger {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1.5px solid #fca5a5;
    }
    .btn-danger:hover {
      background-color: #fecaca;
    }
    .btn-secondary {
      background-color: #f8fafc;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background-color: #e2e8f0;
      color: #0f172a;
    }
    /* Page Switcher Navigation Bar */
    .pages-nav-bar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 20px 0 20px;
    }
    .pages-nav-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .page-tab-btn {
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      border: 1.5px solid transparent;
      border-bottom: none;
      background: transparent;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .page-tab-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .page-tab-btn.active {
      color: #000000;
      background: #f8fafc;
      border-color: #cbd5e1;
      border-bottom: 2px solid #f8fafc;
      font-weight: 700;
      margin-bottom: -1px;
      z-index: 10;
    }
    .workspace-container {
      max-width: 1280px;
      width: 100%;
      margin: 16px auto 32px auto;
      padding: 0 20px;
      flex: 1;
    }
    .page-context-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .page-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .page-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-desc {
      font-size: 12px;
      color: #64748b;
    }
    .page-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sub-switch-btn {
      padding: 4px 8px;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
    }
    .sub-switch-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .spoiler-box {
      background: #1e293b;
      color: #1e293b;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 800;
      letter-spacing: 2px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      transition: all 0.2s ease;
    }
    .spoiler-box.revealed {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      letter-spacing: 1px;
    }
    .mode-toggle-group {
      display: flex;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .mode-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .mode-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .frame-wrapper {
      display: flex;
      justify-content: center;
      background: #ffffff;
      padding: 24px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
    }
    .game-iframe {
      width: 640px;
      height: 820px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      transition: width 0.2s ease;
    }
    .code-container {
      display: none;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .code-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .code-pre {
      background: #0f172a;
      color: #a7f3d0;
      padding: 16px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.5;
      overflow: auto;
      max-height: 750px;
      border: 1px solid #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
    }
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
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      display: none;
      z-index: 9999;
    }
`;

export const DEV_WORKBENCH_HTML = `  return \`<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev Workbench - All Pages &amp; HTML Inspector</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #f8fafc;
      color: #0f172a;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    .dev-header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      position: sticky;
      top: 0;
      z-index: 50;
      padding: 10px 20px;
    }
    .header-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
    }
    .brand-section {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .logo-tiles {
      display: inline-flex;
      padding: 2px 0;
    }
    .logo-tile {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      font-size: 12px;
      font-weight: 800;
      border-radius: 4px;
      border: 1.5px solid #18181b;
      margin-right: -2px;
    }
    .badge-dev {
      background-color: #C4F7CA;
      color: #000000;
      border: 1.5px solid #7ecc84;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 700;
      box-shadow: inset 0 1px 0 0 #e8ffea;
    }
    .badge-local {
      background-color: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 2px 7px;
      font-size: 11px;
      font-weight: 600;
    }
    .controls-section {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .dev-input {
      padding: 6px 10px;
      border: 1.5px solid #cbd5e1;
      border-radius: 6px;
      font-size: 12.5px;
      color: #0f172a;
      outline: none;
      background: #ffffff;
    }
    .dev-input:focus {
      border-color: #18181b;
      box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
    }
    .btn-dev {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 12px;
      font-size: 12.5px;
      font-weight: 700;
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
      box-shadow: inset 0 2px 0 0 #e8ffea, 0 1px 2px rgba(0,0,0,0.05);
    }
    .btn-primary:hover {
      background-color: #bbf4c3;
      border-color: #76c87c;
      box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 4px rgba(0,0,0,0.08);
    }
    .btn-danger {
      background-color: #fee2e2;
      color: #991b1b;
      border: 1.5px solid #fca5a5;
    }
    .btn-danger:hover {
      background-color: #fecaca;
    }
    .btn-secondary {
      background-color: #f8fafc;
      color: #334155;
      border: 1.5px solid #cbd5e1;
    }
    .btn-secondary:hover {
      background-color: #e2e8f0;
      color: #0f172a;
    }
    /* Page Switcher Navigation Bar */
    .pages-nav-bar {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 6px 20px 0 20px;
    }
    .pages-nav-content {
      max-width: 1280px;
      margin: 0 auto;
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }
    .page-tab-btn {
      padding: 8px 14px;
      font-size: 13px;
      font-weight: 600;
      color: #64748b;
      border: 1.5px solid transparent;
      border-bottom: none;
      background: transparent;
      border-radius: 8px 8px 0 0;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 6px;
      transition: all 0.15s ease;
      white-space: nowrap;
    }
    .page-tab-btn:hover {
      color: #0f172a;
      background: #f1f5f9;
    }
    .page-tab-btn.active {
      color: #000000;
      background: #f8fafc;
      border-color: #cbd5e1;
      border-bottom: 2px solid #f8fafc;
      font-weight: 700;
      margin-bottom: -1px;
      z-index: 10;
    }
    .workspace-container {
      max-width: 1280px;
      width: 100%;
      margin: 16px auto 32px auto;
      padding: 0 20px;
      flex: 1;
    }
    .page-context-box {
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px 16px;
      margin-bottom: 16px;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    }
    .page-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .page-title {
      font-size: 14px;
      font-weight: 700;
      color: #0f172a;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .page-desc {
      font-size: 12px;
      color: #64748b;
    }
    .page-controls {
      display: flex;
      align-items: center;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sub-switch-btn {
      padding: 4px 8px;
      font-size: 11.5px;
      font-weight: 600;
      border: 1px solid #cbd5e1;
      border-radius: 5px;
      background: #ffffff;
      color: #475569;
      cursor: pointer;
    }
    .sub-switch-btn.active {
      background: #0f172a;
      color: #ffffff;
      border-color: #0f172a;
    }
    .spoiler-box {
      background: #1e293b;
      color: #1e293b;
      border-radius: 4px;
      padding: 2px 6px;
      font-weight: 800;
      letter-spacing: 2px;
      cursor: pointer;
      user-select: none;
      font-size: 12px;
      transition: all 0.2s ease;
    }
    .spoiler-box.revealed {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      letter-spacing: 1px;
    }
    .mode-toggle-group {
      display: flex;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .mode-btn {
      padding: 6px 12px;
      font-size: 12px;
      font-weight: 600;
      border: none;
      background: #ffffff;
      color: #64748b;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 5px;
    }
    .mode-btn.active {
      background: #0f172a;
      color: #ffffff;
    }
    .frame-wrapper {
      display: flex;
      justify-content: center;
      background: #ffffff;
      padding: 24px 12px;
      border-radius: 8px;
      border: 1px solid #cbd5e1;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
      overflow-x: auto;
    }
    .game-iframe {
      width: 640px;
      height: 820px;
      border: 1px solid #cbd5e1;
      border-radius: 12px;
      background: #ffffff;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.08);
      transition: width 0.2s ease;
    }
    .code-container {
      display: none;
      background: #ffffff;
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 16px;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);
    }
    .code-actions {
      display: flex;
      justify-content: flex-end;
      gap: 8px;
      margin-bottom: 10px;
    }
    .code-pre {
      background: #0f172a;
      color: #a7f3d0;
      padding: 16px;
      border-radius: 8px;
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-size: 12.5px;
      line-height: 1.5;
      overflow: auto;
      max-height: 750px;
      border: 1px solid #1e293b;
      white-space: pre-wrap;
      word-break: break-word;
    }
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
      box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
      display: none;
      z-index: 9999;
    }</style>
</head>
<body>
  <header class="dev-header">
    <div class="header-content">
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
        <span class="badge-dev">DEV WORKBENCH</span>
        <span class="badge-local">Local Only</span>
      </div>

      <form id="dev-params-form" class="controls-section" method="GET" action="/dev">
        <input
          type="date"
          id="date-input"
          name="date"
          class="dev-input"
          value="\${safeDate}"
          title="Select Puzzle Date"
        >
        <input
          type="email"
          id="email-input"
          name="email"
          class="dev-input"
          value="\${safeEmail}"
          placeholder="player@company.com"
          title="Test User Email"
          style="width: 190px;"
        >
        <button type="submit" class="btn-dev btn-primary">Update</button>
        <button type="button" id="reset-state-btn" class="btn-dev btn-danger" title="Reset guess state for this day">Reset Game</button>
        <a
          id="standalone-link"
          href="/dev/render?date=\${encodedDate}&email=\${encodedEmail}"
          target="_blank"
          rel="noopener noreferrer"
          class="btn-dev btn-secondary"
          title="Open page in a new full-screen tab"
        >
          ↗ Standalone Tab
        </a>
      </form>
    </div>
  </header>

  <!-- Navigation bar for all app pages -->
  <nav class="pages-nav-bar">
    <div class="pages-nav-content">
      <button type="button" class="page-tab-btn active" data-page="game">🎮 Daily Game (AMP)</button>
      <button type="button" class="page-tab-btn" data-page="confirmed">🎉 Subscription Confirmed</button>
      <button type="button" class="page-tab-btn" data-page="signup">📝 Landing / Signup</button>
      <button type="button" class="page-tab-btn" data-page="account">⚙️ Account Preferences</button>
      <button type="button" class="page-tab-btn" data-page="fallback">✉️ Fallback Email</button>
      <button type="button" class="page-tab-btn" data-page="invalid">⚠️ Invalid / Expired Token</button>
      <button type="button" class="page-tab-btn" data-page="privacy">🔒 Privacy Policy</button>
      <button type="button" class="page-tab-btn" data-page="subscribers">👥 Subscribed Emails</button>
    </div>
  </nav>

  <main class="workspace-container">
    <!-- Context bar for active page -->
    <div class="page-context-box">
      <div class="page-info">
        <div class="page-title">
          <span id="ctx-title">🎮 Daily Game (AMP Email)</span>
          <span id="ctx-badge" class="badge-dev">Interactive</span>
        </div>
        <div id="ctx-desc" class="page-desc">Interactive AMP Email game with clue stepper, letter masking, and live guess validation.</div>
      </div>

      <div class="page-controls">
        <!-- Game specific metadata -->
        <div id="game-meta-group" style="display: flex; align-items: center; gap: 10px; font-size: 12px; color: #475569;">
          <span>Puzzle: <strong>#\${puzzle.id}</strong></span>
          <span>Date: <strong>\${formatPrettyDate(puzzle.date)}</strong></span>
          <span>
            Word:
            <span id="spoiler-word" class="spoiler-box" title="Click to reveal">\${safeWord}</span>
          </span>
        </div>

        <!-- Landing page variations -->
        <div id="signup-variants-group" style="display: none; align-items: center; gap: 4px;">
          <span style="font-size: 11px; font-weight: 600; color: #64748b; margin-right: 4px;">State:</span>
          <button type="button" class="sub-switch-btn active" onclick="setSignupVariant('default', this)">Form</button>
          <button type="button" class="sub-switch-btn" onclick="setSignupVariant('pending', this)">Check Email (Pending)</button>
          <button type="button" class="sub-switch-btn" onclick="setSignupVariant('subscribed', this)">Subscribed</button>
        </div>

        <!-- Viewport selector -->
        <div class="viewport-buttons" style="display: flex; gap: 4px;">
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('375px', this)" title="Mobile">📱 375px</button>
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('520px', this)" title="Tablet">💻 520px</button>
          <button type="button" class="sub-switch-btn active" onclick="setFrameWidth('640px', this)" title="Desktop">🖥️ 640px</button>
          <button type="button" class="sub-switch-btn" onclick="setFrameWidth('100%', this)" title="Full">↔️ 100%</button>
        </div>

        <button type="button" class="sub-switch-btn" onclick="reloadIframe()" title="Reload Frame">🔄 Reload</button>

        <!-- View mode toggle: Preview vs HTML Source -->
        <div class="mode-toggle-group">
          <button type="button" id="btn-mode-preview" class="mode-btn active" onclick="setViewMode('preview')">👁️ Preview</button>
          <button type="button" id="btn-mode-source" class="mode-btn" onclick="setViewMode('source')">📄 HTML Source</button>
        </div>
      </div>
    </div>

    <!-- View Mode 1: Live Interactive Iframe -->
    <div id="preview-panel" class="frame-wrapper">
      <iframe
        id="preview-iframe"
        class="game-iframe"
        src="/dev/render?date=\${encodedDate}&email=\${encodedEmail}"
        title="Page Live Preview"
      ></iframe>
    </div>

    <!-- View Mode 2: HTML Source Code View -->
    <div id="source-panel" class="code-container">
      <div class="code-actions">
        <button type="button" id="copy-html-btn" class="btn-dev btn-primary">📋 Copy HTML</button>
        <button type="button" id="download-html-btn" class="btn-dev btn-secondary">💾 Download .html</button>
      </div>
      <pre class="code-pre"><code id="code-content" class="amp-source-code">\${escapeHtml(ampHtml)}</code></pre>
    </div>
  </main>

  <div id="toast" class="toast"></div>

  <script>
    var currentEmail = '\${encodedEmail}';
    var currentDate = '\${encodedDate}';
    var currentPage = 'game';
    var currentViewMode = 'preview';
    var currentSignupVariant = 'default';

    var PAGE_DEFS = {
      game: {
        title: '🎮 Daily Game (AMP Email)',
        desc: 'Interactive AMP Email game with clue stepper, letter masking, and live guess validation.',
        badge: 'Interactive',
        url: '/dev/render?date=' + currentDate + '&email=' + currentEmail,
        hasGameMeta: true
      },
      confirmed: {
        title: '🎉 Subscription Confirmed',
        desc: 'Confirmation success page with 9:00 AM PST schedule notice and instant puzzle delivery button.',
        badge: 'Page',
        url: '/dev/page/confirmed?email=' + currentEmail
      },
      signup: {
        title: '📝 Landing / Signup Page',
        desc: 'Email signup landing page with daily puzzle preview and newsletter features.',
        badge: 'Page',
        url: '/dev/page/signup?email=' + currentEmail,
        hasSignupVariants: true
      },
      account: {
        title: '⚙️ Account &amp; Preferences',
        desc: 'React Single Page App (SPA) for managing workplace leaderboard privacy and subscription.',
        badge: 'React SPA',
        url: '/dev/page/account?email=' + currentEmail
      },
      fallback: {
        title: '✉️ Fallback Email Card',
        desc: 'Non-AMP fallback email invitation card for Apple Mail, Outlook, and desktop clients.',
        badge: 'Email Card',
        url: '/dev/fallback?date=' + currentDate + '&email=' + currentEmail
      },
      confirmEmail: {
        title: '✉️ Confirmation Email',
        desc: 'Transactional double opt-in email sent to new subscribers with confirmation link.',
        badge: 'Email',
        url: '/dev/email/confirm?email=' + currentEmail
      },
      invalid: {
        title: '⚠️ Invalid / Expired Token',
        desc: 'Error screen displayed when a confirmation token is expired, tampered with, or malformed.',
        badge: 'Error Screen',
        url: '/dev/page/invalid'
      },
      privacy: {
        title: '🔒 Privacy Policy',
        desc: 'Official Inboxed privacy policy (GET /privacy).',
        badge: 'Document',
        url: '/dev/page/privacy'
      },
      subscribers: {
        title: '👥 Subscribed Emails (Production)',
        desc: 'Live directory of confirmed email subscribers fetched directly from the production database at https://inboxed.fun.',
        badge: 'Production DB',
        url: '/dev/page/subscribers?source=prod'
      }
    };

    function showToast(message) {
      var toast = document.getElementById('toast');
      toast.textContent = message;
      toast.style.display = 'block';
      setTimeout(function() {
        toast.style.display = 'none';
      }, 2500);
    }

    function switchPage(pageKey) {
      currentPage = pageKey;
      var def = PAGE_DEFS[pageKey];
      if (!def) return;

      // Update nav button active states
      document.querySelectorAll('.page-tab-btn').forEach(function(btn) {
        btn.classList.toggle('active', btn.getAttribute('data-page') === pageKey);
      });

      // Update context header
      document.getElementById('ctx-title').innerHTML = def.title;
      document.getElementById('ctx-desc').innerHTML = def.desc;
      document.getElementById('ctx-badge').textContent = def.badge;

      // Show/hide sub-controls
      document.getElementById('game-meta-group').style.display = def.hasGameMeta ? 'flex' : 'none';
      document.getElementById('signup-variants-group').style.display = def.hasSignupVariants ? 'flex' : 'none';

      // Compute URL
      var targetUrl = def.url;
      if (pageKey === 'signup' && currentSignupVariant !== 'default') {
        targetUrl += '&' + currentSignupVariant + '=true';
      }

      // Update iframe & standalone link
      var iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.src = targetUrl;
      var standalone = document.getElementById('standalone-link');
      if (standalone) standalone.href = targetUrl;

      // If source mode is active, fetch HTML source for this page
      if (currentViewMode === 'source') {
        loadPageSource(pageKey);
      }
    }

    function setSignupVariant(variant, btn) {
      currentSignupVariant = variant;
      document.querySelectorAll('#signup-variants-group .sub-switch-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');

      var targetUrl = '/dev/page/signup?email=' + currentEmail;
      if (variant !== 'default') {
        targetUrl += '&' + variant + '=true';
      }

      var iframe = document.getElementById('preview-iframe');
      if (iframe) iframe.src = targetUrl;
      var standalone = document.getElementById('standalone-link');
      if (standalone) standalone.href = targetUrl;

      if (currentViewMode === 'source') {
        loadPageSource('signup');
      }
    }

    function setViewMode(mode) {
      currentViewMode = mode;
      document.getElementById('btn-mode-preview').classList.toggle('active', mode === 'preview');
      document.getElementById('btn-mode-source').classList.toggle('active', mode === 'source');

      document.getElementById('preview-panel').style.display = (mode === 'preview') ? 'flex' : 'none';
      document.getElementById('source-panel').style.display = (mode === 'source') ? 'block' : 'none';

      if (mode === 'source') {
        loadPageSource(currentPage);
      }
    }

    async function loadPageSource(pageKey) {
      var codeElem = document.getElementById('code-content');
      codeElem.textContent = 'Loading source code for ' + pageKey + '...';

      try {
        var url = '/dev/raw?page=' + pageKey + '&email=' + currentEmail + '&date=' + currentDate;
        if (pageKey === 'signup' && currentSignupVariant !== 'default') {
          url += '&' + currentSignupVariant + '=true';
        }
        var res = await fetch(url);
        var text = await res.text();
        codeElem.textContent = text;
      } catch (err) {
        codeElem.textContent = 'Failed to load HTML source.';
      }
    }

    function setFrameWidth(width, btn) {
      var frame = document.getElementById('preview-iframe');
      if (frame) frame.style.width = width;
      document.querySelectorAll('.viewport-buttons .sub-switch-btn').forEach(function(b) {
        b.classList.remove('active');
      });
      if (btn) btn.classList.add('active');
    }

    function reloadIframe() {
      var frame = document.getElementById('preview-iframe');
      if (frame) {
        var currentSrc = frame.src;
        frame.src = 'about:blank';
        setTimeout(function() { frame.src = currentSrc; }, 50);
        showToast('Reloaded preview');
      }
    }

    // Spoiler toggle
    var spoiler = document.getElementById('spoiler-word');
    if (spoiler) {
      spoiler.addEventListener('click', function() {
        spoiler.classList.toggle('revealed');
      });
    }

    // Copy HTML button
    var copyBtn = document.getElementById('copy-html-btn');
    if (copyBtn) {
      copyBtn.addEventListener('click', function() {
        var code = document.getElementById('code-content').textContent;
        navigator.clipboard.writeText(code).then(function() {
          showToast('Copied HTML to clipboard!');
        }).catch(function() {
          showToast('Failed to copy. Please select manually.');
        });
      });
    }

    // Download HTML file
    var downloadBtn = document.getElementById('download-html-btn');
    if (downloadBtn) {
      downloadBtn.addEventListener('click', function() {
        var code = document.getElementById('code-content').textContent;
        var blob = new Blob([code], { type: 'text/html;charset=utf-8' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'inboxed-' + currentPage + '.html';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showToast('Downloaded HTML file!');
      });
    }

    // Reset Game State for current email and date
    var resetBtn = document.getElementById('reset-state-btn');
    if (resetBtn) {
      resetBtn.addEventListener('click', async function() {
        var email = document.getElementById('email-input').value.trim();
        var date = document.getElementById('date-input').value.trim();
        if (!email) {
          showToast('Please enter an email to reset');
          return;
        }

        resetBtn.disabled = true;
        resetBtn.textContent = 'Resetting...';

        try {
          var res = await fetch('/api/admin/reset-user-day?email=' + encodeURIComponent(email) + '&date=' + encodeURIComponent(date), {
            method: 'POST'
          });
          var data = await res.json();
          if (data.success) {
            showToast('Game state reset! Reloading...');
            reloadIframe();
          } else {
            showToast('Reset failed: ' + (data.error || 'Unknown error'));
          }
        } catch (err) {
          showToast('Error connecting to reset endpoint');
        } finally {
          resetBtn.disabled = false;
          resetBtn.textContent = 'Reset Game';
        }
      });
    }

    // Initialize page navigation buttons
    document.querySelectorAll('.page-tab-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var page = btn.getAttribute('data-page');
        switchPage(page);
      });
    });
  </script>
</body>
</html>
`;
