export const ACCOUNT_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  line-height: 1.5;
  padding: 32px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
}
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.logo-tiles {
  display: inline-flex;
  padding: 4px 0;
}
.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -4px;
}
.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -4px;
}
.header {
  margin-bottom: 8px;
  text-align: center;
}
.title {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.user-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 0 16px 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #71717a;
}
.domain-pill {
  background: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: lowercase;
  box-shadow: inset 0 1px 0 0 #e8ffea;
}
.section-divider {
  border: none;
  border-top: 1px solid #e4e4e7;
  margin: 0;
}
.section-subtitle {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #71717a;
  margin-bottom: 10px;
}
.setting-section {
  padding: 16px 0;
  text-align: left;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.setting-name, .setting-title {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}
.setting-name-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Modern iOS Style Switch Toggle with Button Green Accent Theme */
.switch-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.switch-label { font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e4e4e7;
  border: 1.5px solid #d4d4d8;
  box-sizing: border-box;
  transition: .2s ease;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .2s ease;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
input:checked + .slider {
  background-color: #C4F7CA;
  border-color: #7ecc84;
}
input:checked + .slider:before {
  transform: translateX(20px);
}

/* Toast Notification Banner */
.toast {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #14532d;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(20, 83, 45, 0.25);
  white-space: nowrap;
  animation: fadeIn 0.25s ease;
  z-index: 10;
}
@keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #e4e4e7;
  border-radius: 50%;
  border-top-color: #14532d;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.footer-text {
  padding: 16px 0;
  text-align: center;
  font-size: 11.5px;
  color: #71717a;
}
.footer-text a {
  color: #14532d;
  font-weight: 700;
  text-decoration: underline;
}

/* Color Combinations Grid */
.color-combo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}
.color-combo-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #f4f4f5;
  border: 1.5px solid #e4e4e7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
  width: 100%;
  box-sizing: border-box;
}
.color-combo-card:hover:not(:disabled) {
  border-color: #d4d4d8;
  background-color: #ececee;
}
.color-combo-card.selected {
  border-color: #18181b;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #18181b, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.color-swatches {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.color-combo-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.color-combo-check {
  font-weight: 800;
  font-size: 13px;
  color: #18181b;
}

/* Leaderboard Switcher Group */
.leaderboard-switch-group {
  display: flex;
  gap: 8px;
  margin: 12px 0 14px 0;
  flex-wrap: wrap;
}
.leaderboard-tab-btn {
  flex: 1;
  min-width: 90px;
  padding: 10px 14px;
  background-color: #f4f4f5;
  border: 1.5px solid #e4e4e7;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
  text-align: center;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.leaderboard-tab-btn:hover {
  border-color: #d4d4d8;
  background-color: #ececee;
}
.leaderboard-tab-btn.active {
  border-color: #18181b;
  background-color: #ffffff;
  font-weight: 700;
  box-shadow: 0 0 0 1px #18181b, 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Pending Switch Notice Banner */
.pending-switch-banner {
  background-color: #fefce8;
  border: 1.5px solid #fef08a;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: #713f12;
  line-height: 1.45;
}
.pending-switch-title {
  font-weight: 700;
  color: #854d0e;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pending-switch-desc {
  color: #713f12;
}

/* Leaderboard Status Info Card */
.leaderboard-info-card {
  background-color: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.45;
}
.leaderboard-info-title {
  font-weight: 700;
  color: #18181b;
  margin-bottom: 2px;
}

/* Custom Leaderboard Card */
.custom-lb-card {
  background-color: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}
.custom-lb-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 2px;
}
.custom-lb-desc {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.45;
  margin-bottom: 12px;
}
.custom-lb-active-box {
  background-color: #ffffff;
  border: 1.5px solid #C4F7CA;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.custom-lb-active-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #52525b;
}
.custom-lb-id-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
  background-color: #e8ffea;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #7ecc84;
}
.custom-lb-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 520px) {
  .custom-lb-actions-grid {
    grid-template-columns: 1fr;
  }
}
.custom-lb-action-box {
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.action-box-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 4px;
}
.action-box-desc {
  font-size: 11.5px;
  color: #71717a;
  line-height: 1.4;
  margin-bottom: 12px;
  flex: 1;
}
.custom-lb-join-form {
  display: flex;
  gap: 6px;
}
.custom-lb-input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1.5px solid #d4d4d8;
  border-radius: 6px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #18181b;
  background-color: #ffffff;
  outline: none;
  transition: border-color 0.15s ease;
}
.custom-lb-input:focus {
  border-color: #18181b;
}
.btn-sm {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}
.btn-outline {
  background-color: #ffffff;
  color: #18181b;
  border: 1.5px solid #d4d4d8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.btn-outline:hover {
  background-color: #f4f4f5;
  border-color: #a1a1aa;
}

/* Dark Mode Theme Overrides for Account Preferences SPA - commented out until it's in a better state
body.dark-theme {
  background-color: #121212;
  color: #f4f4f5;
}
body.dark-theme .title {
  color: #ffffff;
}
body.dark-theme .user-badge {
  color: #f4f4f5;
}
body.dark-theme .section-divider {
  border-top-color: #27272a;
}
body.dark-theme .setting-title {
  color: #f4f4f5;
}
body.dark-theme .setting-desc {
  color: #a1a1aa;
}
body.dark-theme .slider {
  background-color: #27272a;
  border-color: #3f3f46;
}
body.dark-theme .slider:before {
  background-color: #f4f4f5;
}
body.dark-theme .color-combo-card {
  background-color: #18181b;
  border-color: #27272a;
  color: #f4f4f5;
}
body.dark-theme .color-combo-card:hover:not(:disabled) {
  background-color: #222226;
  border-color: #3f3f46;
}
body.dark-theme .color-combo-card.selected {
  border-color: #f4f4f5;
  background-color: #27272a;
  box-shadow: 0 0 0 1px #f4f4f5, 0 2px 6px rgba(0, 0, 0, 0.4);
}
body.dark-theme .color-combo-check {
  color: #f4f4f5;
}
body.dark-theme .color-swatch {
  border-color: rgba(255, 255, 255, 0.2);
}
body.dark-theme .footer-text {
  color: #a1a1aa;
}
body.dark-theme .footer-text a {
  color: #C4F7CA;
}
*/
`;

export const ACCOUNT_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Account &amp; Preferences</title>
  
  <!-- Load React & ReactDOM via CDN for lightweight high-performance SPA -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  line-height: 1.5;
  padding: 32px 16px;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
}
.container {
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  box-sizing: border-box;
  position: relative;
}
.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 24px;
}
.logo-tiles {
  display: inline-flex;
  padding: 4px 0;
}
.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  font-size: 18px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}
.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -4px;
}
.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -4px;
}
.header {
  margin-bottom: 8px;
  text-align: center;
}
.title {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.user-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2px 0 16px 0;
  font-size: 13.5px;
  font-weight: 600;
  color: #71717a;
}
.domain-pill {
  background: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 700;
  text-transform: lowercase;
  box-shadow: inset 0 1px 0 0 #e8ffea;
}
.section-divider {
  border: none;
  border-top: 1px solid #e4e4e7;
  margin: 0;
}
.section-subtitle {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: #71717a;
  margin-bottom: 10px;
}
.setting-section {
  padding: 16px 0;
  text-align: left;
}
.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.setting-name, .setting-title {
  font-size: 14px;
  font-weight: 600;
  color: #18181b;
}
.setting-name-group {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  width: auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 10px 20px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}

/* Modern iOS Style Switch Toggle with Button Green Accent Theme */
.switch-container {
  display: flex;
  align-items: center;
  gap: 10px;
}
.switch-label { font-size: 12.5px; font-weight: 700; white-space: nowrap; }
.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}
.switch input { opacity: 0; width: 0; height: 0; }
.slider {
  position: absolute;
  cursor: pointer;
  top: 0; left: 0; right: 0; bottom: 0;
  background-color: #e4e4e7;
  border: 1.5px solid #d4d4d8;
  box-sizing: border-box;
  transition: .2s ease;
  border-radius: 24px;
}
.slider:before {
  position: absolute;
  content: "";
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: .2s ease;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
input:checked + .slider {
  background-color: #C4F7CA;
  border-color: #7ecc84;
}
input:checked + .slider:before {
  transform: translateX(20px);
}

/* Toast Notification Banner */
.toast {
  position: absolute;
  top: -14px;
  left: 50%;
  transform: translateX(-50%);
  background: #14532d;
  color: #ffffff;
  padding: 6px 14px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 4px 12px rgba(20, 83, 45, 0.25);
  white-space: nowrap;
  animation: fadeIn 0.25s ease;
  z-index: 10;
}
@keyframes fadeIn { from { opacity: 0; transform: translate(-50%, -8px); } to { opacity: 1; transform: translate(-50%, 0); } }
.spinner {
  display: inline-block;
  width: 24px;
  height: 24px;
  border: 3px solid #e4e4e7;
  border-radius: 50%;
  border-top-color: #14532d;
  animation: spin 0.8s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
.footer-text {
  padding: 16px 0;
  text-align: center;
  font-size: 11.5px;
  color: #71717a;
}
.footer-text a {
  color: #14532d;
  font-weight: 700;
  text-decoration: underline;
}

/* Color Combinations Grid */
.color-combo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  margin-top: 8px;
}
.color-combo-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  background-color: #f4f4f5;
  border: 1.5px solid #e4e4e7;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  text-align: left;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
  width: 100%;
  box-sizing: border-box;
}
.color-combo-card:hover:not(:disabled) {
  border-color: #d4d4d8;
  background-color: #ececee;
}
.color-combo-card.selected {
  border-color: #18181b;
  background-color: #ffffff;
  box-shadow: 0 0 0 1px #18181b, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.color-swatches {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}
.color-swatch {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  display: inline-block;
  border: 1px solid rgba(0, 0, 0, 0.15);
}
.color-combo-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.color-combo-check {
  font-weight: 800;
  font-size: 13px;
  color: #18181b;
}

/* Leaderboard Switcher Group */
.leaderboard-switch-group {
  display: flex;
  gap: 8px;
  margin: 12px 0 14px 0;
  flex-wrap: wrap;
}
.leaderboard-tab-btn {
  flex: 1;
  min-width: 90px;
  padding: 10px 14px;
  background-color: #f4f4f5;
  border: 1.5px solid #e4e4e7;
  border-radius: 8px;
  cursor: pointer;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  color: #18181b;
  text-align: center;
  transition: all 0.15s ease;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.leaderboard-tab-btn:hover {
  border-color: #d4d4d8;
  background-color: #ececee;
}
.leaderboard-tab-btn.active {
  border-color: #18181b;
  background-color: #ffffff;
  font-weight: 700;
  box-shadow: 0 0 0 1px #18181b, 0 2px 4px rgba(0, 0, 0, 0.08);
}

/* Pending Switch Notice Banner */
.pending-switch-banner {
  background-color: #fefce8;
  border: 1.5px solid #fef08a;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: #713f12;
  line-height: 1.45;
}
.pending-switch-title {
  font-weight: 700;
  color: #854d0e;
  margin-bottom: 4px;
  display: flex;
  align-items: center;
  gap: 6px;
}
.pending-switch-desc {
  color: #713f12;
}

/* Leaderboard Status Info Card */
.leaderboard-info-card {
  background-color: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.45;
}
.leaderboard-info-title {
  font-weight: 700;
  color: #18181b;
  margin-bottom: 2px;
}

/* Custom Leaderboard Card */
.custom-lb-card {
  background-color: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  margin-bottom: 14px;
}
.custom-lb-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 2px;
}
.custom-lb-desc {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.45;
  margin-bottom: 12px;
}
.custom-lb-active-box {
  background-color: #ffffff;
  border: 1.5px solid #C4F7CA;
  border-radius: 8px;
  padding: 10px 14px;
  margin-bottom: 14px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  flex-wrap: wrap;
}
.custom-lb-active-label {
  font-size: 11.5px;
  font-weight: 600;
  color: #52525b;
}
.custom-lb-id-badge {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
  background-color: #e8ffea;
  padding: 3px 8px;
  border-radius: 4px;
  border: 1px solid #7ecc84;
}
.custom-lb-actions-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-top: 8px;
}
@media (max-width: 520px) {
  .custom-lb-actions-grid {
    grid-template-columns: 1fr;
  }
}
.custom-lb-action-box {
  background-color: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}
.action-box-title {
  font-size: 12.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 4px;
}
.action-box-desc {
  font-size: 11.5px;
  color: #71717a;
  line-height: 1.4;
  margin-bottom: 12px;
  flex: 1;
}
.custom-lb-join-form {
  display: flex;
  gap: 6px;
}
.custom-lb-input {
  flex: 1;
  min-width: 0;
  padding: 7px 10px;
  border: 1.5px solid #d4d4d8;
  border-radius: 6px;
  font-size: 12px;
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
  color: #18181b;
  background-color: #ffffff;
  outline: none;
  transition: border-color 0.15s ease;
}
.custom-lb-input:focus {
  border-color: #18181b;
}
.btn-sm {
  padding: 7px 12px;
  font-size: 12px;
  font-weight: 700;
  border-radius: 6px;
}
.btn-outline {
  background-color: #ffffff;
  color: #18181b;
  border: 1.5px solid #d4d4d8;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.04);
}
.btn-outline:hover {
  background-color: #f4f4f5;
  border-color: #a1a1aa;
}

/* Dark Mode Theme Overrides for Account Preferences SPA - commented out until it's in a better state
body.dark-theme {
  background-color: #121212;
  color: #f4f4f5;
}
body.dark-theme .title {
  color: #ffffff;
}
body.dark-theme .user-badge {
  color: #f4f4f5;
}
body.dark-theme .section-divider {
  border-top-color: #27272a;
}
body.dark-theme .setting-title {
  color: #f4f4f5;
}
body.dark-theme .setting-desc {
  color: #a1a1aa;
}
body.dark-theme .slider {
  background-color: #27272a;
  border-color: #3f3f46;
}
body.dark-theme .slider:before {
  background-color: #f4f4f5;
}
body.dark-theme .color-combo-card {
  background-color: #18181b;
  border-color: #27272a;
  color: #f4f4f5;
}
body.dark-theme .color-combo-card:hover:not(:disabled) {
  background-color: #222226;
  border-color: #3f3f46;
}
body.dark-theme .color-combo-card.selected {
  border-color: #f4f4f5;
  background-color: #27272a;
  box-shadow: 0 0 0 1px #f4f4f5, 0 2px 6px rgba(0, 0, 0, 0.4);
}
body.dark-theme .color-combo-check {
  color: #f4f4f5;
}
body.dark-theme .color-swatch {
  border-color: rgba(255, 255, 255, 0.2);
}
body.dark-theme .footer-text {
  color: #a1a1aa;
}
body.dark-theme .footer-text a {
  color: #C4F7CA;
}
*/</style>
</head>
<body>
  <div id="root"></div>

  <script type="text/babel">
    const { useState, useEffect } = React;

    function AccountApp() {
      const [loading, setLoading] = useState(true);
      const [user, setUser] = useState(null);
      const [toast, setToast] = useState('');
      const [updatingSub, setUpdatingSub] = useState(false);
      const [updatingPriv, setUpdatingPriv] = useState(false);
      // Dark mode commented out until it's in a better state - default everyone to light mode
      // const [updatingTheme, setUpdatingTheme] = useState(false);
      const [updatingColor, setUpdatingColor] = useState(false);
      const [updatingLeaderboard, setUpdatingLeaderboard] = useState(false);
      const [selectedTab, setSelectedTab] = useState('');
      const [customId, setCustomId] = useState('');
      const [joinInput, setJoinInput] = useState('');

      const urlParams = new URLSearchParams(window.location.search);
      const token = urlParams.get('token') || '';

      useEffect(() => {
        if (!token) {
          setLoading(false);
          return;
        }

        fetch('/api/account?token=' + encodeURIComponent(token))
          .then(res => {
            if (!res.ok) throw new Error('Unauthorized');
            return res.json();
          })
          .then(data => {
            if (data.success) {
              setUser(data);
              const initialTab = data.leaderboardType || (data.isCustomDomain ? 'domain' : 'general');
              setSelectedTab(initialTab);
              setCustomId(data.customLeaderboardId || '');
            } else {
              setUser(null);
            }
            setLoading(false);
          })
          .catch(() => {
            setUser(null);
            setLoading(false);
          });
      }, []);

      // Dark mode disabled / commented out until in a better state - default everyone to light mode
      /*
      useEffect(() => {
        if (user && user.theme === 'dark') {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }, [user?.theme]);
      */
      useEffect(() => {
        document.body.classList.remove('dark-theme');
      }, []);

      const showToast = (msg) => {
        setToast(msg);
        setTimeout(() => setToast(''), 3500);
      };

      const handleToggleSub = async (e) => {
        const nextSub = e.target.checked;
        setUpdatingSub(true);
        try {
          const res = await fetch('/api/account/toggle-subscription', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, subscribed: nextSub })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, isSubscribed: data.isSubscribed }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update subscription');
        }
        setUpdatingSub(false);
      };

      const handleTogglePrivacy = async (e) => {
        const nextPriv = e.target.checked;
        setUpdatingPriv(true);
        try {
          const res = await fetch('/api/account/toggle-privacy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, showOnLeaderboard: nextPriv })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, showOnLeaderboard: data.showOnLeaderboard }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update privacy');
        }
        setUpdatingPriv(false);
      };

      // Dark mode toggle handler commented out until it's in a better state
      /*
      const handleToggleTheme = async (e) => {
        const nextDark = e.target.checked;
        const nextTheme = nextDark ? 'dark' : 'light';
        setUpdatingTheme(true);
        try {
          const res = await fetch('/api/account/toggle-theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, theme: nextTheme, darkMode: nextDark })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({ ...prev, theme: data.theme, darkMode: data.darkMode }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update theme preference');
        }
        setUpdatingTheme(false);
      };
      */

      const handleSelectColorCombo = async (comboId) => {
        if (user.colorCombo === comboId) return;
        setUpdatingColor(true);
        try {
          const res = await fetch('/api/account/toggle-color-combo', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: user.token, colorCombo: comboId })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({
              ...prev,
              colorCombo: data.colorCombo,
              primaryColor: data.primaryColor,
              secondaryColor: data.secondaryColor,
            }));
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update');
          }
        } catch (_) {
          showToast('Failed to update color preference');
        }
        setUpdatingColor(false);
      };

      const isPublicDomain = (domain) => {
        if (!domain) return true;
        const d = domain.toLowerCase().trim();
        if (d === 'general' || d === 'public') return true;
        if (d === 'gmail.com' || d === 'googlemail.com') return true;
        if (d === 'yahoo.com' || d.startsWith('yahoo.') || d.endsWith('.yahoo.com') || d === 'ymail.com') return true;
        if (
          d === 'hotmail.com' ||
          d === 'outlook.com' ||
          d === 'live.com' ||
          d === 'msn.com' ||
          d === 'icloud.com' ||
          d === 'me.com' ||
          d === 'mac.com' ||
          d === 'aol.com' ||
          d === 'proton.me' ||
          d === 'protonmail.com'
        ) return true;
        return false;
      };

      const hasCustomDomain = user ? (user.isCustomDomain ?? !isPublicDomain(user.domain)) : false;
      const activeTab = selectedTab || user?.leaderboardType || (hasCustomDomain ? 'domain' : 'general');

      const updateLeaderboardPreference = async (nextType, nextCustomId) => {
        if (!user || !user.token) return;
        setUpdatingLeaderboard(true);
        try {
          const res = await fetch('/api/account/toggle-leaderboard', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              token: user.token,
              leaderboardType: nextType,
              customLeaderboardId: nextCustomId || undefined
            })
          });
          const data = await res.json();
          if (data.success) {
            setUser(prev => ({
              ...prev,
              leaderboardType: data.leaderboardType,
              customLeaderboardId: data.customLeaderboardId,
              activeLeaderboardName: data.activeLeaderboardName,
              activeLeaderboardType: data.activeLeaderboardType,
            }));
            const effectiveTab = data.leaderboardType || nextType;
            setSelectedTab(effectiveTab);
            if (data.customLeaderboardId || nextCustomId) {
              setCustomId(data.customLeaderboardId || nextCustomId);
            }
            showToast(data.message);
          } else {
            showToast(data.message || 'Failed to update leaderboard');
          }
        } catch (_) {
          showToast('Failed to update leaderboard');
        }
        setUpdatingLeaderboard(false);
      };

      const handleSelectLeaderboard = (type) => {
        setSelectedTab(type);
        if (type === 'custom') {
          if (customId) {
            updateLeaderboardPreference('custom', customId);
          }
          return;
        }
        updateLeaderboardPreference(type, undefined);
      };

      const handleCreateCustomLeaderboard = () => {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        const newId = \`CUSTOM-\${code}\`;
        setCustomId(newId);
        setSelectedTab('custom');
        updateLeaderboardPreference('custom', newId);
      };

      const handleJoinCustomLeaderboard = () => {
        const clean = joinInput.trim().toUpperCase();
        if (!clean) {
          showToast('Please enter a leaderboard identifier');
          return;
        }
        setCustomId(clean);
        setJoinInput('');
        setSelectedTab('custom');
        updateLeaderboardPreference('custom', clean);
      };

      const handleCopyId = (id) => {
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(id)
            .then(() => showToast('Identifier copied to clipboard!'))
            .catch(() => showToast(\`Identifier: \${id}\`));
        } else {
          showToast(\`Identifier: \${id}\`);
        }
      };

      if (loading) {
        return (
          <div className="container" style={{ textAlign: 'center', padding: '40px 20px' }}>
            <div className="spinner"></div>
            <p style={{ marginTop: '14px', color: '#71717a', fontSize: '13px', fontWeight: 600 }}>Loading account preferences...</p>
          </div>
        );
      }

      if (!user) {
        return (
          <div className="container" style={{ textAlign: 'center' }}>
            <div className="logo-container">
              <div className="logo-tiles" aria-label="INBOXED">
                <span className="logo-tile rotate-neg">I</span>
                <span className="logo-tile rotate-pos">N</span>
                <span className="logo-tile rotate-neg">B</span>
                <span className="logo-tile rotate-pos">O</span>
                <span className="logo-tile rotate-neg">X</span>
                <span className="logo-tile rotate-pos">E</span>
                <span className="logo-tile rotate-neg">D</span>
              </div>
            </div>
            <div style={{ marginTop: '16px' }}>
              <div style={{ fontSize: '38px', marginBottom: '12px' }}>⚠️</div>
              <h2 style={{ color: '#18181b', fontSize: '24px', fontWeight: 800, letterSpacing: '-0.5px', marginBottom: '8px' }}>Invalid or Expired Link</h2>
              <p style={{ color: '#52525b', fontSize: '14px', lineHeight: 1.5, maxWidth: '420px', margin: '0 auto 24px' }}>
                This account link is invalid, tampered with, or expired.<br />
                Please click the <strong>update your account preferences</strong> link directly from your daily Inboxed email to access and manage your settings.
              </p>
              <a href="/" className="btn">Back to Home</a>
            </div>
          </div>
        );
      }

      return (
        <div className="container">
          {toast && <div className="toast">{toast}</div>}

          <div className="logo-container">
            <div className="logo-tiles" aria-label="INBOXED">
              <span className="logo-tile rotate-neg">I</span>
              <span className="logo-tile rotate-pos">N</span>
              <span className="logo-tile rotate-neg">B</span>
              <span className="logo-tile rotate-pos">O</span>
              <span className="logo-tile rotate-neg">X</span>
              <span className="logo-tile rotate-pos">E</span>
              <span className="logo-tile rotate-neg">D</span>
            </div>
          </div>

          <div className="header">
            <h1 className="title">Account &amp; Preferences</h1>
            <div className="user-badge">
              <span>{user.email}</span>
            </div>
          </div>

          {/* General Section */}
          <div className="setting-section">
            <div className="section-subtitle">General</div>
            <div className="setting-row">
              <span className="setting-name">Daily Email</span>
              <div className="switch-container">
                <span className="switch-label" style={{ color: user.isSubscribed ? '#14532d' : '#71717a' }}>
                  {user.isSubscribed ? 'Subscribed' : 'Unsubscribed'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={user.isSubscribed}
                    onChange={handleToggleSub}
                    disabled={updatingSub}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <hr className="section-divider" />

          {/* Leaderboards Section */}
          <div className="setting-section">
            <div className="section-subtitle">Leaderboards</div>
            <p className="setting-desc" style={{ fontSize: '13px', color: '#52525b', marginBottom: '12px', lineHeight: 1.45 }}>
              Choose which leaderboard you participate in. You can switch between General, your domain leaderboard, or a custom leaderboard. Changes take effect in your next daily email.
            </p>

            {/* Leaderboard Selection Buttons */}
            <div className="leaderboard-switch-group">
              <button
                type="button"
                className={\`leaderboard-tab-btn \${activeTab === 'general' ? 'active' : ''}\`}
                onClick={() => handleSelectLeaderboard('general')}
                disabled={updatingLeaderboard}
              >
                General
              </button>
              {hasCustomDomain && (
                <button
                  type="button"
                  className={\`leaderboard-tab-btn \${activeTab === 'domain' ? 'active' : ''}\`}
                  onClick={() => handleSelectLeaderboard('domain')}
                  disabled={updatingLeaderboard}
                >
                  {user.domain}
                </button>
              )}
              <button
                type="button"
                className={\`leaderboard-tab-btn \${activeTab === 'custom' ? 'active' : ''}\`}
                onClick={() => handleSelectLeaderboard('custom')}
                disabled={updatingLeaderboard}
              >
                Custom
              </button>
            </div>

            {/* Active Leaderboard Details */}
            {activeTab === 'general' && (
              <div className="leaderboard-info-card">
                <div className="leaderboard-info-title">Global General Leaderboard</div>
                <div>You are currently playing in the global leaderboard with players across all domains.</div>
              </div>
            )}

            {activeTab === 'domain' && hasCustomDomain && (
              <div className="leaderboard-info-card">
                <div className="leaderboard-info-title">{user.domain} Leaderboard</div>
                <div>You are currently competing on your company leaderboard with colleagues from <strong>@{user.domain}</strong>.</div>
              </div>
            )}

            {activeTab === 'custom' && (
              <div className="custom-lb-card">
                <div className="custom-lb-title">Custom Leaderboard</div>
                <div className="custom-lb-desc">
                  Play with friends or a private group. Create your own leaderboard or join an existing one using an identifier.
                </div>

                {customId ? (
                  <div className="custom-lb-active-box">
                    <div>
                      <div className="custom-lb-active-label">Active Custom Leaderboard</div>
                      <div style={{ marginTop: '3px' }}>
                        <span className="custom-lb-id-badge">{customId}</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm btn-outline"
                      onClick={() => handleCopyId(customId)}
                    >
                      Copy Code
                    </button>
                  </div>
                ) : (
                  <div style={{ fontSize: '12px', color: '#71717a', padding: '10px 14px', background: '#f4f4f5', borderRadius: '6px', marginBottom: '12px' }}>
                    No custom leaderboard identifier set yet. Create a new one or join with an existing code below.
                  </div>
                )}

                <div className="custom-lb-actions-grid">
                  {/* Create New */}
                  <div className="custom-lb-action-box">
                    <div className="action-box-title">Create New</div>
                    <div className="action-box-desc">
                      Generate a random identifier for a new leaderboard.
                    </div>
                    <button
                      type="button"
                      className="btn btn-sm"
                      onClick={handleCreateCustomLeaderboard}
                      disabled={updatingLeaderboard}
                    >
                      Create Leaderboard
                    </button>
                  </div>

                  {/* Join Existing */}
                  <div className="custom-lb-action-box">
                    <div className="action-box-title">Join Existing</div>
                    <div className="action-box-desc">
                      Enter a leaderboard identifier to join.
                    </div>
                    <div className="custom-lb-join-form">
                      <input
                        type="text"
                        className="custom-lb-input"
                        placeholder="e.g. CUSTOM-7K9P"
                        value={joinInput}
                        onChange={(e) => setJoinInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleJoinCustomLeaderboard()}
                        disabled={updatingLeaderboard}
                      />
                      <button
                        type="button"
                        className="btn btn-sm"
                        onClick={handleJoinCustomLeaderboard}
                        disabled={updatingLeaderboard}
                      >
                        Join
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Privacy Toggle Row */}
            <div className="setting-row" style={{ marginTop: '14px', paddingTop: '14px', borderTop: '1px solid #f4f4f5' }}>
              <span className="setting-name">Show my score on the leaderboard</span>
              <div className="switch-container">
                <span className="switch-label" style={{ color: user.showOnLeaderboard ? '#14532d' : '#71717a' }}>
                  {user.showOnLeaderboard ? 'Visible' : 'Hidden'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={user.showOnLeaderboard}
                    onChange={handleTogglePrivacy}
                    disabled={updatingPriv}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
          </div>

          <hr className="section-divider" />

          {/* Display Section */}
          <div className="setting-section">
            <div className="section-subtitle">Display</div>
            <div className="setting-row" style={{ marginBottom: '8px' }}>
              <span className="setting-name">Color Palette</span>
            </div>
            <div className="color-combo-grid">
              {(user.colorCombos || []).map(combo => {
                const isSelected = (user.colorCombo || 'amber-blue') === combo.id;
                return (
                  <button
                    key={combo.id}
                    type="button"
                    className={\`color-combo-card \${isSelected ? 'selected' : ''}\`}
                    onClick={() => handleSelectColorCombo(combo.id)}
                    disabled={updatingColor}
                  >
                    <div className="color-swatches">
                      <span className="color-swatch" style={{ backgroundColor: combo.preview.primary }} title={\`Primary: \${combo.primary}\`} />
                      <span className="color-swatch" style={{ backgroundColor: combo.preview.secondary }} title={\`Secondary: \${combo.secondary}\`} />
                    </div>
                    <span className="color-combo-name">{combo.name}</span>
                    {isSelected && <span className="color-combo-check">✓</span>}
                  </button>
                );
              })}
            </div>

            {/* Dark Mode Theme Switch - commented out until it's in a better state
            <div className="setting-row" style={{ marginTop: '14px' }}>
              <span className="setting-name">Dark Mode</span>
              <div className="switch-container">
                <span className="switch-label" style={{ color: user.theme === 'dark' ? (user.theme === 'dark' ? '#C4F7CA' : '#14532d') : '#71717a' }}>
                  {user.theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                </span>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={user.theme === 'dark'}
                    onChange={handleToggleTheme}
                    disabled={updatingTheme}
                  />
                  <span className="slider"></span>
                </label>
              </div>
            </div>
            */}
          </div>

          <hr className="section-divider" />

          <div className="footer-text">
            <div>Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a></div>
            <div style={{ marginTop: '6px' }}>
              <a href="https://forms.gle/o3rAMb56i7cL1T1n8" target="_blank" rel="noopener noreferrer" style={{ color: '#71717a', textDecoration: 'underline' }}>Give Feedback</a>
            </div>
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<AccountApp />);
  </script>
</body>
</html>
`;
