export const DEV_DASHBOARD_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #0b0f19;
  color: #f1f5f9;
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Header */
.dev-header {
  background: #111827;
  border-bottom: 1px solid #1f2937;
  padding: 14px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.logo-tiles {
  display: inline-flex;
  gap: 2.5px;
}

.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-weight: 900;
  font-size: 13px;
  color: #14532d;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.badge-dev {
  background: #1e293b;
  color: #38bdf8;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #0284c7;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge-source {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.badge-prod {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-local-source {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-toggle {
  display: flex;
  background: #1e293b;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.source-toggle-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.source-toggle-btn.active {
  background: #0ea5e9;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn {
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn-primary {
  background: #10b981;
  color: #ffffff;
}

.btn-primary:hover {
  background: #059669;
}

.btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.btn-secondary:hover {
  background: #334155;
}

.refresh-spin {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Container */
.container {
  max-width: 1440px;
  margin: 24px auto 0 auto;
  padding: 0 24px;
}

/* Top Hero Bar */
.hero-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-title h1 {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.hero-meta {
  font-size: 12px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.kpi-card:hover {
  border-color: #374151;
  transform: translateY(-2px);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.kpi-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-icon {
  font-size: 18px;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-value {
  font-size: 30px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1;
}

.kpi-unit {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.kpi-subtext {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-highlight {
  color: #34d399;
  font-weight: 600;
}

/* Toolbar & Filter Bar */
.toolbar-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.puzzle-selector-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.puzzle-select-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #94a3b8;
}

.puzzle-select {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.puzzle-select:focus {
  border-color: #38bdf8;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
  padding: 7px 12px 7px 32px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: #38bdf8;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #64748b;
  pointer-events: none;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

/* Main Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2.1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Panel Card */
.panel-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(17, 24, 39, 0.8);
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-count {
  font-size: 12px;
  color: #64748b;
  background: #1e293b;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}

/* Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

th {
  background: #0f172a;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  border-bottom: 1px solid #1f2937;
  white-space: nowrap;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #1e293b;
  color: #e2e8f0;
  vertical-align: middle;
}

tr:hover td {
  background: #131c2e;
}

/* User cell */
.player-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #1e293b;
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12.5px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-email {
  font-weight: 600;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 6px;
}

.domain-pill {
  font-size: 11px;
  color: #94a3b8;
  background: #1e293b;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-family: monospace;
}

.dev-badge-small {
  font-size: 10px;
  font-weight: 700;
  color: #ec4899;
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.35);
  padding: 1px 5px;
  border-radius: 4px;
}

/* Status Badges */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-won {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.status-playing {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.status-lost {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

/* Score Badges */
.score-badge {
  font-size: 13px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
}

.score-tier-high {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.score-tier-med {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.4);
}

.score-tier-low {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.score-tier-zero {
  background: #1e293b;
  color: #64748b;
  border: 1px solid #334155;
}

/* Guesses chips */
.guesses-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.guess-count-pill {
  font-weight: 700;
  font-size: 12px;
  color: #e2e8f0;
}

.guess-chips {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.guess-chip {
  background: #1e293b;
  color: #cbd5e1;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-family: monospace;
  text-transform: uppercase;
}

.guess-chip-target {
  background: rgba(16, 185, 129, 0.25);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.5);
  font-weight: 700;
}

/* Empty State */
.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

/* Copy button */
.copy-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
}

.copy-btn:hover {
  color: #38bdf8;
  background: #1e293b;
}

/* Dashboard Main Navigation Tabs */
.dashboard-nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 14px;
  flex-wrap: wrap;
}

.nav-tab-btn {
  background: #111827;
  color: #94a3b8;
  border: 1px solid #1f2937;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.nav-tab-btn:hover {
  background: #1e293b;
  color: #f8fafc;
  border-color: #334155;
}

.nav-tab-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.nav-tab-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 7px;
  border-radius: 9999px;
  font-size: 11px;
}

/* Dev Prescreen Team Management Card */
.dev-prescreen-card {
  background: #111827;
  border: 1px solid #374151;
  border-left: 4px solid #ec4899;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dev-prescreen-header {
  margin-bottom: 14px;
}

.dev-prescreen-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 6px;
}

.badge-dev-prescreen {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  border: 1px solid rgba(236, 72, 153, 0.35);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.dev-prescreen-desc {
  font-size: 12.5px;
  color: #94a3b8;
  line-height: 1.5;
}

.dev-prescreen-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dev-add-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-dev-add {
  background: #ec4899;
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-dev-add:hover {
  background: #db2777;
}

.dev-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.dev-team-chip {
  background: #1e293b;
  border: 1px solid #475569;
  color: #f1f5f9;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-chip-remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  padding: 0 2px;
}

.btn-chip-remove:hover {
  color: #f87171;
}

.dev-empty-notice {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

/* Subscriber action buttons */
.sub-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-action {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid #334155;
  background: #1e293b;
  color: #cbd5e1;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.btn-action:hover {
  background: #334155;
  color: #ffffff;
}

.btn-dev-toggle {
  color: #f472b6;
  border-color: rgba(236, 72, 153, 0.4);
}

.btn-dev-toggle.btn-dev-active {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.btn-purge {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

.btn-purge:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #1e293b;
  color: #f8fafc;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border: 1px solid #334155;
  display: none;
  z-index: 100;
}

/* ==========================================================================
   USER SETTINGS & PROFILE INSPECTOR STYLES
   ========================================================================== */

.inspector-card {
  background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 20px;
}

.inspector-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.inspector-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7 0%, #3b82f6 100%);
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
  flex-shrink: 0;
}

.inspector-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inspector-email-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.inspector-email {
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.inspector-tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.inspector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.inspector-section {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inspector-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.setting-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.segmented-toggle {
  display: inline-flex;
  background: #1e293b;
  border-radius: 8px;
  padding: 3px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.seg-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.seg-btn:hover:not(.active) {
  color: #f1f5f9;
}

.seg-btn.active {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.seg-btn.active-dark {
  background: #6366f1;
  color: #ffffff;
}

.seg-btn.active-amber {
  background: #d97706;
  color: #ffffff;
}

.seg-btn.active-emerald {
  background: #059669;
  color: #ffffff;
}

.seg-btn.active-rose {
  background: #e11d48;
  color: #ffffff;
}

.token-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px;
}

.token-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #38bdf8;
  word-break: break-all;
  line-height: 1.4;
  user-select: all;
  background: rgba(15, 23, 42, 0.8);
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #1e293b;
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.stat-item {
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.stat-item-val {
  font-size: 18px;
  font-weight: 700;
  color: #38bdf8;
}

.history-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.history-chip {
  background: #1e293b;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #334155;
  font-family: monospace;
}

.history-chip-puzzle {
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border-color: rgba(2, 132, 199, 0.4);
}

.btn-inspect {
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(2, 132, 199, 0.4);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-inspect:hover {
  background: #0284c7;
  color: #ffffff;
}

.badge-vis-public {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-vis-hidden {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-theme-light {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-theme-dark {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}


`;

export const DEV_DASHBOARD_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Dev - Live Production Analytics Dashboard</title>
  <style>* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #0b0f19;
  color: #f1f5f9;
  min-height: 100vh;
  padding-bottom: 60px;
}

/* Header */
.dev-header {
  background: #111827;
  border-bottom: 1px solid #1f2937;
  padding: 14px 24px;
  position: sticky;
  top: 0;
  z-index: 50;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
}

.header-inner {
  max-width: 1440px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 14px;
}

.brand-section {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.logo-tiles {
  display: inline-flex;
  gap: 2.5px;
}

.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border-radius: 4px;
  font-weight: 900;
  font-size: 13px;
  color: #14532d;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
}

.badge-dev {
  background: #1e293b;
  color: #38bdf8;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #0284c7;
  letter-spacing: 0.05em;
  text-transform: uppercase;
}

.badge-source {
  font-size: 11px;
  font-weight: 700;
  padding: 3px 10px;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.badge-prod {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.badge-local-source {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.source-toggle {
  display: flex;
  background: #1e293b;
  padding: 2px;
  border-radius: 8px;
  border: 1px solid #334155;
}

.source-toggle-btn {
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  text-decoration: none;
  color: #94a3b8;
  transition: all 0.15s ease;
}

.source-toggle-btn.active {
  background: #0ea5e9;
  color: #ffffff;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
}

.btn {
  padding: 6px 14px;
  font-size: 12.5px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  border: none;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  transition: all 0.15s ease;
  text-decoration: none;
}

.btn-primary {
  background: #10b981;
  color: #ffffff;
}

.btn-primary:hover {
  background: #059669;
}

.btn-secondary {
  background: #1e293b;
  color: #e2e8f0;
  border: 1px solid #334155;
}

.btn-secondary:hover {
  background: #334155;
}

.refresh-spin {
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Container */
.container {
  max-width: 1440px;
  margin: 24px auto 0 auto;
  padding: 0 24px;
}

/* Top Hero Bar */
.hero-bar {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 12px;
}

.hero-title h1 {
  font-size: 22px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.hero-subtitle {
  font-size: 13px;
  color: #94a3b8;
  margin-top: 4px;
}

.hero-meta {
  font-size: 12px;
  color: #64748b;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

/* KPI Cards Grid */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
  margin-bottom: 24px;
}

.kpi-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: transform 0.15s ease, border-color 0.15s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.kpi-card:hover {
  border-color: #374151;
  transform: translateY(-2px);
}

.kpi-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.kpi-title {
  font-size: 12px;
  font-weight: 600;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.kpi-icon {
  font-size: 18px;
}

.kpi-value-row {
  display: flex;
  align-items: baseline;
  gap: 8px;
}

.kpi-value {
  font-size: 30px;
  font-weight: 800;
  color: #f8fafc;
  line-height: 1;
}

.kpi-unit {
  font-size: 14px;
  color: #64748b;
  font-weight: 600;
}

.kpi-subtext {
  font-size: 12px;
  color: #64748b;
  margin-top: 8px;
  display: flex;
  align-items: center;
  gap: 6px;
}

.kpi-highlight {
  color: #34d399;
  font-weight: 600;
}

/* Toolbar & Filter Bar */
.toolbar-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  padding: 16px 20px;
  margin-bottom: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.toolbar-main-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 12px;
}

.puzzle-selector-group {
  display: flex;
  align-items: center;
  gap: 10px;
}

.puzzle-select-label {
  font-size: 12.5px;
  font-weight: 600;
  color: #94a3b8;
}

.puzzle-select {
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
  padding: 7px 14px;
  border-radius: 8px;
  font-size: 13.5px;
  font-weight: 600;
  cursor: pointer;
  outline: none;
}

.puzzle-select:focus {
  border-color: #38bdf8;
}

.search-box {
  position: relative;
  flex: 1;
  max-width: 320px;
}

.search-input {
  width: 100%;
  background: #1e293b;
  color: #f8fafc;
  border: 1px solid #334155;
  padding: 7px 12px 7px 32px;
  border-radius: 8px;
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s ease;
}

.search-input:focus {
  border-color: #38bdf8;
}

.search-icon {
  position: absolute;
  left: 10px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 13px;
  color: #64748b;
  pointer-events: none;
}

.filter-tabs {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.tab-btn {
  background: #1e293b;
  color: #94a3b8;
  border: 1px solid #334155;
  padding: 5px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.tab-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
}

/* Main Dashboard Grid */
.dashboard-grid {
  display: grid;
  grid-template-columns: 2.1fr 1fr;
  gap: 20px;
}

@media (max-width: 1024px) {
  .dashboard-grid {
    grid-template-columns: 1fr;
  }
}

/* Panel Card */
.panel-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}

.panel-header {
  padding: 16px 20px;
  border-bottom: 1px solid #1f2937;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: rgba(17, 24, 39, 0.8);
}

.panel-title {
  font-size: 15px;
  font-weight: 700;
  color: #f8fafc;
  display: flex;
  align-items: center;
  gap: 8px;
}

.panel-count {
  font-size: 12px;
  color: #64748b;
  background: #1e293b;
  padding: 2px 8px;
  border-radius: 9999px;
  font-weight: 600;
}

/* Table */
.table-responsive {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  text-align: left;
  font-size: 13px;
}

th {
  background: #0f172a;
  color: #94a3b8;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 10px 16px;
  border-bottom: 1px solid #1f2937;
  white-space: nowrap;
}

td {
  padding: 12px 16px;
  border-bottom: 1px solid #1e293b;
  color: #e2e8f0;
  vertical-align: middle;
}

tr:hover td {
  background: #131c2e;
}

/* User cell */
.player-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.avatar {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: #1e293b;
  color: #38bdf8;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 12.5px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.player-details {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.player-email {
  font-weight: 600;
  color: #f1f5f9;
  display: flex;
  align-items: center;
  gap: 6px;
}

.domain-pill {
  font-size: 11px;
  color: #94a3b8;
  background: #1e293b;
  padding: 1px 6px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-family: monospace;
}

.dev-badge-small {
  font-size: 10px;
  font-weight: 700;
  color: #ec4899;
  background: rgba(236, 72, 153, 0.15);
  border: 1px solid rgba(236, 72, 153, 0.35);
  padding: 1px 5px;
  border-radius: 4px;
}

/* Status Badges */
.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 700;
  padding: 3px 8px;
  border-radius: 6px;
}

.status-won {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
}

.status-playing {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
}

.status-lost {
  background: rgba(239, 68, 68, 0.15);
  color: #f87171;
  border: 1px solid rgba(239, 68, 68, 0.35);
}

/* Score Badges */
.score-badge {
  font-size: 13px;
  font-weight: 800;
  padding: 3px 10px;
  border-radius: 6px;
  display: inline-block;
}

.score-tier-high {
  background: rgba(16, 185, 129, 0.2);
  color: #10b981;
  border: 1px solid rgba(16, 185, 129, 0.4);
}

.score-tier-med {
  background: rgba(6, 182, 212, 0.2);
  color: #22d3ee;
  border: 1px solid rgba(6, 182, 212, 0.4);
}

.score-tier-low {
  background: rgba(245, 158, 11, 0.2);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.4);
}

.score-tier-zero {
  background: #1e293b;
  color: #64748b;
  border: 1px solid #334155;
}

/* Guesses chips */
.guesses-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
}

.guess-count-pill {
  font-weight: 700;
  font-size: 12px;
  color: #e2e8f0;
}

.guess-chips {
  display: flex;
  gap: 3px;
  flex-wrap: wrap;
}

.guess-chip {
  background: #1e293b;
  color: #cbd5e1;
  font-size: 10.5px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 4px;
  border: 1px solid #334155;
  font-family: monospace;
  text-transform: uppercase;
}

.guess-chip-target {
  background: rgba(16, 185, 129, 0.25);
  color: #34d399;
  border-color: rgba(16, 185, 129, 0.5);
  font-weight: 700;
}

/* Empty State */
.empty-state {
  padding: 48px 24px;
  text-align: center;
  color: #64748b;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 12px;
}

.empty-text {
  font-size: 14px;
  font-weight: 500;
}

/* Copy button */
.copy-btn {
  background: transparent;
  border: none;
  color: #64748b;
  cursor: pointer;
  padding: 2px 4px;
  border-radius: 4px;
  font-size: 11px;
}

.copy-btn:hover {
  color: #38bdf8;
  background: #1e293b;
}

/* Dashboard Main Navigation Tabs */
.dashboard-nav-tabs {
  display: flex;
  gap: 10px;
  margin-bottom: 24px;
  border-bottom: 1px solid #1f2937;
  padding-bottom: 14px;
  flex-wrap: wrap;
}

.nav-tab-btn {
  background: #111827;
  color: #94a3b8;
  border: 1px solid #1f2937;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.15s ease;
}

.nav-tab-btn:hover {
  background: #1e293b;
  color: #f8fafc;
  border-color: #334155;
}

.nav-tab-btn.active {
  background: #0284c7;
  color: #ffffff;
  border-color: #0284c7;
  box-shadow: 0 2px 8px rgba(2, 132, 199, 0.4);
}

.nav-tab-badge {
  background: rgba(255, 255, 255, 0.2);
  padding: 1px 7px;
  border-radius: 9999px;
  font-size: 11px;
}

/* Dev Prescreen Team Management Card */
.dev-prescreen-card {
  background: #111827;
  border: 1px solid #374151;
  border-left: 4px solid #ec4899;
  border-radius: 12px;
  padding: 18px 22px;
  margin-bottom: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.dev-prescreen-header {
  margin-bottom: 14px;
}

.dev-prescreen-title {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  font-size: 16px;
  font-weight: 800;
  color: #f8fafc;
  margin-bottom: 6px;
}

.badge-dev-prescreen {
  background: rgba(236, 72, 153, 0.15);
  color: #f472b6;
  border: 1px solid rgba(236, 72, 153, 0.35);
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 9999px;
}

.dev-prescreen-desc {
  font-size: 12.5px;
  color: #94a3b8;
  line-height: 1.5;
}

.dev-prescreen-body {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.dev-add-form {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn-dev-add {
  background: #ec4899;
  color: #ffffff;
  border: none;
  padding: 7px 14px;
  border-radius: 6px;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: background 0.15s ease;
}

.btn-dev-add:hover {
  background: #db2777;
}

.dev-chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  align-items: center;
}

.dev-team-chip {
  background: #1e293b;
  border: 1px solid #475569;
  color: #f1f5f9;
  padding: 4px 10px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.btn-chip-remove {
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 15px;
  line-height: 1;
  cursor: pointer;
  border-radius: 50%;
  padding: 0 2px;
}

.btn-chip-remove:hover {
  color: #f87171;
}

.dev-empty-notice {
  font-size: 12px;
  color: #64748b;
  font-style: italic;
}

/* Subscriber action buttons */
.sub-actions-wrapper {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.btn-action {
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 5px;
  cursor: pointer;
  text-decoration: none;
  border: 1px solid #334155;
  background: #1e293b;
  color: #cbd5e1;
  transition: all 0.12s ease;
  white-space: nowrap;
}

.btn-action:hover {
  background: #334155;
  color: #ffffff;
}

.btn-dev-toggle {
  color: #f472b6;
  border-color: rgba(236, 72, 153, 0.4);
}

.btn-dev-toggle.btn-dev-active {
  background: rgba(236, 72, 153, 0.2);
  color: #f472b6;
}

.btn-purge {
  color: #f87171;
  border-color: rgba(239, 68, 68, 0.35);
}

.btn-purge:hover {
  background: rgba(239, 68, 68, 0.2);
}

/* Toast */
.toast {
  position: fixed;
  bottom: 24px;
  right: 24px;
  background: #1e293b;
  color: #f8fafc;
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.5);
  border: 1px solid #334155;
  display: none;
  z-index: 100;
}

/* ==========================================================================
   USER SETTINGS & PROFILE INSPECTOR STYLES
   ========================================================================== */

.inspector-card {
  background: linear-gradient(135deg, #111827 0%, #0f172a 100%);
  border: 1px solid #1e293b;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 24px;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.4);
}

.inspector-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  padding-bottom: 20px;
  border-bottom: 1px solid #1e293b;
  margin-bottom: 20px;
}

.inspector-identity {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.inspector-avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: linear-gradient(135deg, #0284c7 0%, #3b82f6 100%);
  color: #ffffff;
  font-size: 22px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(2, 132, 199, 0.35);
  flex-shrink: 0;
}

.inspector-titles {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.inspector-email-row {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.inspector-email {
  font-size: 20px;
  font-weight: 700;
  color: #f8fafc;
  letter-spacing: -0.01em;
}

.inspector-tags-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 2px;
}

.inspector-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
  gap: 20px;
  margin-bottom: 20px;
}

.inspector-section {
  background: #0f172a;
  border: 1px solid #1e293b;
  border-radius: 10px;
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.inspector-section-title {
  font-size: 13px;
  font-weight: 700;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid #1e293b;
}

.setting-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 8px 0;
  border-bottom: 1px solid rgba(30, 41, 59, 0.5);
}

.setting-row:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-label {
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.setting-desc {
  font-size: 12px;
  color: #64748b;
  line-height: 1.4;
}

.segmented-toggle {
  display: inline-flex;
  background: #1e293b;
  border-radius: 8px;
  padding: 3px;
  border: 1px solid #334155;
  flex-shrink: 0;
}

.seg-btn {
  background: transparent;
  border: none;
  color: #94a3b8;
  padding: 5px 12px;
  font-size: 12px;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
  white-space: nowrap;
}

.seg-btn:hover:not(.active) {
  color: #f1f5f9;
}

.seg-btn.active {
  background: #0284c7;
  color: #ffffff;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.3);
}

.seg-btn.active-dark {
  background: #6366f1;
  color: #ffffff;
}

.seg-btn.active-amber {
  background: #d97706;
  color: #ffffff;
}

.seg-btn.active-emerald {
  background: #059669;
  color: #ffffff;
}

.seg-btn.active-rose {
  background: #e11d48;
  color: #ffffff;
}

.token-container {
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 12px;
}

.token-code {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 11px;
  color: #38bdf8;
  word-break: break-all;
  line-height: 1.4;
  user-select: all;
  background: rgba(15, 23, 42, 0.8);
  padding: 8px 10px;
  border-radius: 6px;
  border: 1px solid #1e293b;
}

.stats-strip {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
  gap: 10px;
  margin-top: 4px;
}

.stat-item {
  background: #0b0f19;
  border: 1px solid #1e293b;
  border-radius: 8px;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-item-label {
  font-size: 11px;
  color: #64748b;
  text-transform: uppercase;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.stat-item-val {
  font-size: 18px;
  font-weight: 700;
  color: #38bdf8;
}

.history-chips-row {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.history-chip {
  background: #1e293b;
  color: #e2e8f0;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 6px;
  border: 1px solid #334155;
  font-family: monospace;
}

.history-chip-puzzle {
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border-color: rgba(2, 132, 199, 0.4);
}

.btn-inspect {
  background: rgba(2, 132, 199, 0.15);
  color: #38bdf8;
  border: 1px solid rgba(2, 132, 199, 0.4);
  font-size: 11px;
  font-weight: 600;
  padding: 4px 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-inspect:hover {
  background: #0284c7;
  color: #ffffff;
}

.badge-vis-public {
  background: rgba(16, 185, 129, 0.15);
  color: #34d399;
  border: 1px solid rgba(16, 185, 129, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-vis-hidden {
  background: rgba(244, 63, 94, 0.15);
  color: #fb7185;
  border: 1px solid rgba(244, 63, 94, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-theme-light {
  background: rgba(245, 158, 11, 0.15);
  color: #fbbf24;
  border: 1px solid rgba(245, 158, 11, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}

.badge-theme-dark {
  background: rgba(99, 102, 241, 0.15);
  color: #818cf8;
  border: 1px solid rgba(99, 102, 241, 0.35);
  font-size: 11px;
  font-weight: 600;
  padding: 2px 7px;
  border-radius: 4px;
}</style>
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
        <span id="source-badge" class="badge-source \${isProd ? 'badge-prod' : 'badge-local-source'}">
          \${isProd ? '🟢 Live Production DB' : '💻 Local Dev KV'}
        </span>
      </div>

      <div class="header-actions">
        <div class="source-toggle">
          <a href="/dev/dashboard?source=prod" class="source-toggle-btn \${isProd ? 'active' : ''}">🌐 Production Live</a>
          <a href="/dev/dashboard?source=local" class="source-toggle-btn \${!isProd ? 'active' : ''}">💻 Local Dev</a>
        </div>
        <button type="button" id="refresh-btn" class="btn btn-primary" onclick="refreshData()" title="Fetch latest production numbers">
          <span id="refresh-icon">🔄</span> Refresh Live
        </button>
        <a href="/dev/page/subscribers?source=\${isProd ? 'prod' : 'local'}" class="btn btn-secondary" title="Manage subscribers list">
          👥 Subscribers
        </a>
        <a href="/dev" class="btn btn-secondary" title="Go to UI &amp; Email Preview Workbench">
          🎨 UI Preview
        </a>
      </div>
    </div>
  </header>

  <main class="container">
    <div class="hero-bar">
      <div class="hero-title">
        <h1>📊 Live Production Analytics &amp; Scores</h1>
        <p class="hero-subtitle">
          Real-time metrics, active subscriber counts, and individual player score records from Cloudflare D1/KV.
        </p>
      </div>
      <div class="hero-meta">
        <span id="last-updated-text">Generated just now</span> &bull; 
        <span style="color: #38bdf8;">\${escapeHtml(prodOrigin)}</span>
      </div>
    </div>

    <!-- KPI Metric Cards Grid -->
    <section class="kpi-grid">
      <!-- Subscribers Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Active Subscribers</span>
          <span class="kpi-icon">📬</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-active-subs">\${stats.subscribers.activeCount}</span>
          <span class="kpi-unit">/ \${stats.subscribers.total} total</span>
        </div>
        <div class="kpi-subtext">
          <span>Across <strong class="kpi-highlight" id="kpi-domains-count">\${stats.subscribers.uniqueDomainsCount}</strong> company domains</span>
        </div>
      </div>

      <!-- Today's Players Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Players (Puzzle #\${stats.todayPuzzle.id})</span>
          <span class="kpi-icon">🎮</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-today-players">\${stats.todayStats.totalPlayers}</span>
          <span class="kpi-unit">played today</span>
        </div>
        <div class="kpi-subtext">
          <span><strong class="kpi-highlight" id="kpi-today-won">\${stats.todayStats.totalWon}</strong> solved (\${stats.todayStats.winRate}% win rate)</span>
        </div>
      </div>

      <!-- Today's Performance Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Today's Avg Score</span>
          <span class="kpi-icon">🎯</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-today-avg-score">\${stats.todayStats.avgScore}</span>
          <span class="kpi-unit">pts</span>
        </div>
        <div class="kpi-subtext">
          <span>Top score: <strong class="kpi-highlight" id="kpi-today-top-score">\${stats.todayStats.topScore} pts</strong> (\${stats.todayStats.avgGuesses} avg guesses)</span>
        </div>
      </div>

      <!-- All-Time Activity Card -->
      <div class="kpi-card">
        <div class="kpi-header">
          <span class="kpi-title">Total Games Played</span>
          <span class="kpi-icon">📈</span>
        </div>
        <div class="kpi-value-row">
          <span class="kpi-value" id="kpi-all-plays">\${stats.allPlays.length}</span>
          <span class="kpi-unit">all-time plays</span>
        </div>
        <div class="kpi-subtext">
          <span>Unique solvers: <strong class="kpi-highlight">\${uniqueAllTimePlayersCount}</strong></span>
        </div>
      </div>
    </section>

    <!-- Toolbar: Puzzle Switcher & Filter -->
    <section class="toolbar-card">
      <div class="toolbar-main-row">
        <div class="puzzle-selector-group">
          <label for="puzzle-select" class="puzzle-select-label">Select Puzzle:</label>
          <select id="puzzle-select" class="puzzle-select" onchange="handlePuzzleChange(this.value)">
            \${puzzleOptionsHtml}
          </select>
        </div>

        <div class="search-box">
          <span class="search-icon">🔍</span>
          <input type="text" id="search-input" class="search-input" placeholder="Search by player email or domain..." oninput="applyFilters()">
        </div>

        <div class="filter-tabs">
          <button type="button" class="tab-btn active" data-filter="all" onclick="setFilter('all', this)">
            All (<span id="count-all">\${stats.selectedPlays.length}</span>)
          </button>
          <button type="button" class="tab-btn" data-filter="won" onclick="setFilter('won', this)">
            🎉 Solved (<span id="count-won">\${stats.selectedPuzzleStats.totalWon}</span>)
          </button>
          <button type="button" class="tab-btn" data-filter="playing" onclick="setFilter('playing', this)">
            ⏳ In Progress (<span id="count-playing">\${stats.selectedPuzzleStats.totalPlaying}</span>)
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
            <span>🎮 Player Scores for Puzzle #<span id="selected-puzzle-title">\${stats.selectedPuzzle.id}</span></span>
            <span class="panel-count" id="table-row-count">\${stats.selectedPlays.length} plays</span>
          </div>
          <div style="font-size: 12px; color: #94a3b8;">
            Date: <span id="selected-puzzle-date" style="font-family: monospace;">\${stats.selectedPuzzle.date}</span>
          </div>
        </div>

        <div class="table-responsive">
          <table id="scores-table">
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
              \${scoreRowsHtml}
            </tbody>
          </table>

          <div id="empty-scores" class="empty-state" style="display: \${stats.selectedPlays.length === 0 ? 'block' : 'none'};">
            <div class="empty-icon">📭</div>
            <div class="empty-text">No recorded gameplay or scores for Puzzle #<span id="empty-puzzle-id">\${stats.selectedPuzzle.id}</span> yet today!</div>
            <div style="margin-top: 6px; font-size: 12px; color: #475569;">Players will appear here in real-time as they make guesses and submit words.</div>
          </div>
        </div>
      </section>

      <!-- Right Column: Workplace Domains Leaderboard -->
      <section class="panel-card">
        <div class="panel-header">
          <div class="panel-title">
            <span>🏢 Workplace Leaderboard</span>
            <span class="panel-count">\${stats.domainRankings.length} domains</span>
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
              \${domainRowsHtml}
            </tbody>
          </table>

          <div id="empty-domains" class="empty-state" style="display: \${stats.domainRankings.length === 0 ? 'block' : 'none'};">
            <div class="empty-icon">🏢</div>
            <div class="empty-text">No workplace domains registered yet.</div>
          </div>
        </div>
      </section>
    </div>
  </main>

  <script>
    var currentData = \${dashboardJson};
    var currentSource = '\${source}';
    var activeFilter = 'all';

    function setFilter(filter, btn) {
      activeFilter = filter;
      document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
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

      // Render score rows
      var tbody = document.getElementById('scores-tbody');
      if (data.selectedPlays.length === 0) {
        tbody.innerHTML = '';
        document.getElementById('empty-scores').style.display = 'block';
        document.getElementById('scores-table').style.display = 'none';
      } else {
        var html = '';
        data.selectedPlays.forEach(function(play) {
          var initial = (play.email[0] || '?').toUpperCase();
          var devBadge = play.isDev ? '<span class="dev-badge-small">🧪 Dev</span>' : '';
          var statusPill = play.hasWon 
            ? '<span class="status-pill status-won">🎉 Solved</span>'
            : (play.status === 'lost' 
                ? '<span class="status-pill status-lost">❌ Failed</span>' 
                : '<span class="status-pill status-playing">⏳ Playing</span>');

          var scoreTierClass = play.score >= 900 
            ? 'score-tier-high' 
            : (play.score >= 700 ? 'score-tier-med' : (play.score > 0 ? 'score-tier-low' : 'score-tier-zero'));

          var guessesChips = '';
          if (play.guesses && play.guesses.length > 0) {
            guessesChips = play.guesses.map(function(g, idx) {
              var isLastAndWon = play.hasWon && idx === play.guesses.length - 1;
              return '<span class="guess-chip ' + (isLastAndWon ? 'guess-chip-target' : '') + '">' + escapeXml(g) + '</span>';
            }).join(' ');
          }

          var timeFormatted = play.wonAt || play.updatedAt 
            ? new Date(play.wonAt || play.updatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            : '—';

          html += '<tr class="score-row" data-email="' + escapeXml(play.email) + '" data-domain="' + escapeXml(play.domain) + '" data-status="' + play.status + '">'
            + '<td>'
            + '  <div class="player-cell">'
            + '    <div class="avatar">' + initial + '</div>'
            + '    <div class="player-details">'
            + '      <span class="player-email">' + escapeXml(play.email) + ' ' + devBadge + '</span>'
            + '      <span class="domain-pill">@' + escapeXml(play.domain) + '</span>'
            + '    </div>'
            + '  </div>'
            + '</td>'
            + '<td>' + statusPill + '</td>'
            + '<td><span class="score-badge ' + scoreTierClass + '">' + play.score + ' pts</span></td>'
            + '<td>'
            + '  <div class="guesses-wrapper">'
            + '    <span class="guess-count-pill">' + play.guessCount + (play.guessCount === 1 ? ' guess' : ' guesses') + '</span>'
            + '    <div class="guess-chips">' + guessesChips + '</div>'
            + '  </div>'
            + '</td>'
            + '<td>' + (play.hintsUsed > 0 ? '💡 ' + play.hintsUsed : '—') + '</td>'
            + '<td style="color: #94a3b8; font-size: 12px;">' + timeFormatted + '</td>'
            + '</tr>';
        });
        tbody.innerHTML = html;
        document.getElementById('empty-scores').style.display = 'none';
        document.getElementById('scores-table').style.display = 'table';
      }
      applyFilters();
    }

    function escapeXml(unsafe) {
      return String(unsafe || '').replace(/[<>&'"]/g, function (c) {
        switch (c) {
          case '<': return '&lt;';
          case '>': return '&gt;';
          case '&': return '&amp;';
          case '\\'': return '&apos;';
          case '"': return '&quot;';
        }
      });
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
      var csv = [headers.join(','), rows.join('\\\\n')].join('\\\\n');
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
`;
