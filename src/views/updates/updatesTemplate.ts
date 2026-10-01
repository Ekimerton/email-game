export const UPDATES_CSS = `* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 16px 40px;
}

.container {
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.logo-tiles {
  display: inline-flex;
  padding: 2px 0;
}

.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -3px;
}

.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -3px;
}

h1 {
  font-size: 20px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 1.25;
  margin-bottom: 4px;
  text-align: center;
}

.subtitle {
  font-size: 13px;
  color: #52525b;
  line-height: 1.4;
  margin-bottom: 24px;
  text-align: center;
}

/* Flat List of Updates Separated by Gray Lines */
.updates-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
  width: 100%;
}

.update-accordion {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
  margin: 0;
}

.update-accordion + .update-accordion {
  border-top: 1px solid #e4e4e7;
}

.update-accordion[open] {
  box-shadow: none;
}

.update-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px;
  cursor: pointer;
  background: transparent;
  user-select: none;
  list-style: none;
  transition: opacity 0.15s ease;
}

.update-header::-webkit-details-marker {
  display: none;
}

.update-header:hover {
  opacity: 0.85;
}

.update-accordion[open] .update-header {
  border-bottom: none;
  background: transparent;
  padding-bottom: 12px;
}

.update-header-info {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  overflow: hidden;
  font-size: 15px;
  line-height: 1.4;
}

.update-date {
  font-size: 15px;
  color: #71717a;
  font-weight: 500;
  flex-shrink: 0;
}

.update-title {
  font-size: 15px;
  font-weight: 500;
  color: #18181b;
  letter-spacing: -0.2px;
}

.accordion-chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #71717a;
  background: transparent;
  transition: transform 0.2s ease, color 0.15s ease;
  margin-left: 10px;
}

.update-accordion[open] .accordion-chevron {
  transform: rotate(180deg);
  background: transparent;
  color: #18181b;
}

.update-body {
  padding: 0 4px 20px 4px;
  background: transparent;
}

.update-body p {
  font-size: 13px;
  color: #3f3f46;
  line-height: 1.6;
  margin-bottom: 14px;
}

.update-body p:last-child {
  margin-bottom: 0;
}

.update-body a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.update-lead {
  font-size: 13.5px;
  color: #3f3f46;
  line-height: 1.55;
  margin-bottom: 16px;
}

.update-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.update-section h3 {
  font-size: 13.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 4px;
}

.update-section p {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.6;
  margin-bottom: 4px;
}

.update-section ul {
  padding-left: 18px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.update-section li {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.55;
  margin-bottom: 3px;
}

.footer-text {
  margin-top: 8px;
  font-size: 12px;
  color: #71717a;
  text-align: center;
  width: 100%;
}

.footer-text a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.footer-links {
  margin-top: 6px;
}
`;

export const UPDATES_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Updates - Inboxed</title>
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <style>* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 24px 16px 40px;
}

.container {
  width: 100%;
  max-width: 480px;
  text-align: center;
}

.logo-container {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
}

.logo-tiles {
  display: inline-flex;
  padding: 2px 0;
}

.logo-tile {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  font-size: 16px;
  font-weight: 800;
  border-radius: 6px;
  border: 2px solid #18181b;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.12);
}

.rotate-neg {
  background-color: #D8FFC5;
  color: #18181b;
  transform: rotate(-8deg);
  margin-right: -3px;
}

.rotate-pos {
  background-color: #C4F7CA;
  color: #18181b;
  transform: rotate(8deg);
  margin-right: -3px;
}

h1 {
  font-size: 20px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 1.25;
  margin-bottom: 4px;
  text-align: center;
}

.subtitle {
  font-size: 13px;
  color: #52525b;
  line-height: 1.4;
  margin-bottom: 24px;
  text-align: center;
}

/* Flat List of Updates Separated by Gray Lines */
.updates-list {
  display: flex;
  flex-direction: column;
  margin-bottom: 28px;
  width: 100%;
}

.update-accordion {
  background: transparent;
  border: none;
  border-radius: 0;
  box-shadow: none;
  text-align: left;
  margin: 0;
}

.update-accordion + .update-accordion {
  border-top: 1px solid #e4e4e7;
}

.update-accordion[open] {
  box-shadow: none;
}

.update-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 4px;
  cursor: pointer;
  background: transparent;
  user-select: none;
  list-style: none;
  transition: opacity 0.15s ease;
}

.update-header::-webkit-details-marker {
  display: none;
}

.update-header:hover {
  opacity: 0.85;
}

.update-accordion[open] .update-header {
  border-bottom: none;
  background: transparent;
  padding-bottom: 12px;
}

.update-header-info {
  display: flex;
  flex-direction: row;
  align-items: baseline;
  gap: 8px;
  overflow: hidden;
  font-size: 15px;
  line-height: 1.4;
}

.update-date {
  font-size: 15px;
  color: #71717a;
  font-weight: 500;
  flex-shrink: 0;
}

.update-title {
  font-size: 15px;
  font-weight: 500;
  color: #18181b;
  letter-spacing: -0.2px;
}

.accordion-chevron {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  color: #71717a;
  background: transparent;
  transition: transform 0.2s ease, color 0.15s ease;
  margin-left: 10px;
}

.update-accordion[open] .accordion-chevron {
  transform: rotate(180deg);
  background: transparent;
  color: #18181b;
}

.update-body {
  padding: 0 4px 20px 4px;
  background: transparent;
}

.update-body p {
  font-size: 13px;
  color: #3f3f46;
  line-height: 1.6;
  margin-bottom: 14px;
}

.update-body p:last-child {
  margin-bottom: 0;
}

.update-body a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.update-lead {
  font-size: 13.5px;
  color: #3f3f46;
  line-height: 1.55;
  margin-bottom: 16px;
}

.update-sections {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.update-section h3 {
  font-size: 13.5px;
  font-weight: 700;
  color: #18181b;
  margin-bottom: 4px;
}

.update-section p {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.6;
  margin-bottom: 4px;
}

.update-section ul {
  padding-left: 18px;
  margin-top: 4px;
  margin-bottom: 4px;
}

.update-section li {
  font-size: 12.5px;
  color: #52525b;
  line-height: 1.55;
  margin-bottom: 3px;
}

.footer-text {
  margin-top: 8px;
  font-size: 12px;
  color: #71717a;
  text-align: center;
  width: 100%;
}

.footer-text a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.footer-links {
  margin-top: 6px;
}</style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <a href="/" style="text-decoration: none;" aria-label="Inboxed Home">
        <div class="logo-tiles" aria-label="INBOXED">
          <span class="logo-tile rotate-neg">I</span>
          <span class="logo-tile rotate-pos">N</span>
          <span class="logo-tile rotate-neg">B</span>
          <span class="logo-tile rotate-pos">O</span>
          <span class="logo-tile rotate-neg">X</span>
          <span class="logo-tile rotate-pos">E</span>
          <span class="logo-tile rotate-neg">D</span>
        </div>
      </a>
    </div>

    <h1>Updates &amp; Patch Notes</h1>
    <p class="subtitle">Latest changes, improvements, and notes for Inboxed.</p>

    <div class="updates-list">
      {{UPDATES_CONTENT}}
    </div>

    <div class="footer-text">
      <div>Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a></div>
      <div class="footer-links">
        <a href="/">Play Game</a> &bull; <a href="/privacy">Privacy Policy</a> &bull; <a href="https://forms.gle/o3rAMb56i7cL1T1n8" target="_blank" rel="noopener noreferrer">Give Feedback</a>
      </div>
    </div>
  </div>
</body>
</html>
`;
