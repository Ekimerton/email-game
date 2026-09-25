export const SIGNUP_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 14px 20px;
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
  font-size: 19px;
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
  line-height: 1.35;
  margin-bottom: 12px;
  text-align: center;
}
.video-card {
  width: 100%;
  margin: 0 0 12px;
  aspect-ratio: 1264 / 720;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.game-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}
.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #71717a;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  pointer-events: none;
  padding: 10px;
  text-align: center;
}
.video-play-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #d4d4d8;
  color: #14532d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding-left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}
.video-replay-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(24, 24, 27, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, background-color 0.15s ease;
  font-family: inherit;
}
.video-replay-btn:hover {
  background: rgba(24, 24, 27, 0.98);
  transform: translate(-50%, -50%) scale(1.05);
}
.video-replay-btn:active {
  transform: translate(-50%, -50%) scale(0.96);
}
.replay-icon {
  font-size: 16px;
  line-height: 1;
}
.preview-card {
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  text-align: left;
}
.preview-header {
  font-size: 10.5px;
  font-weight: 700;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}
.preview-clue {
  font-size: 12.5px;
  font-weight: 600;
  color: #27272a;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-clue:last-child {
  margin-bottom: 0;
}
.clue-num {
  background: #14532d;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.clue-blur {
  filter: blur(4px);
  user-select: none;
  color: #a1a1aa;
}
.signup-form {
  margin-bottom: 14px;
}
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.email-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #d4d4d8;
  border-radius: 8px;
  font-size: 16px; /* 16px prevents iOS Safari auto-zooming on focus */
  color: #18181b;
  outline: none;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
  -webkit-appearance: none;
}
.email-input:focus {
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
}
.btn-submit {
  width: auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 18px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn-submit:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn-submit:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
.btn-submit:disabled {
  background-color: #e4e4e7;
  color: #a1a1aa;
  border-color: #d4d4d8;
  cursor: not-allowed;
  box-shadow: none;
}
@media (max-width: 640px) {
  .btn-submit {
    width: 100%;
    align-self: stretch;
    padding: 11px 18px;
    font-size: 14px;
  }
}
.status-msg {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
.status-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.success-card {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
}
.success-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.success-title {
  font-size: 17px;
  font-weight: 800;
  color: #14532d;
  margin-bottom: 6px;
}
.success-desc {
  font-size: 13px;
  color: #166534;
  line-height: 1.5;
  margin-bottom: 16px;
}
.disclaimer {
  margin-top: 14px;
  padding: 8px 12px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  font-size: 11.5px;
  color: #92400e;
  line-height: 1.4;
  text-align: left;
}
.disclaimer a {
  color: #78350f;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.disclaimer a:hover {
  color: #451a03;
}
.features {
  border-top: 1px solid #e4e4e7;
  padding-top: 14px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.feature-item {
  font-size: 12px;
  color: #52525b;
  line-height: 1.4;
}
.feature-item strong {
  color: #18181b;
}
.footer-text {
  margin-top: 16px;
  font-size: 11px;
  color: #71717a;
  text-align: center;
  line-height: 1.5;
}
.footer-text a {
  color: #14532d;
  font-weight: 700;
  text-decoration: underline;
}
.footer-links a {
  color: #71717a;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.footer-links a:hover {
  color: #18181b;
}
`;

export const SIGNUP_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed - The Daily Word Game that Lives in Your Email</title>
  <meta name="description" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta property="og:site_name" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta property="og:title" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta property="og:description" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta property="og:type" content="website">
  <meta property="og:url" content="https://inboxed.fun">
  <meta property="og:image" content="https://inboxed.fun/og-image.png">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:image:alt" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta name="twitter:description" content="Inboxed - The Daily Word Game that Lives in Your Email">
  <meta name="twitter:image" content="https://inboxed.fun/og-image.png">
  <link rel="icon" type="image/svg+xml" href="/favicon.svg">
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Righteous&display=swap">
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding: 16px 14px 20px;
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
  font-size: 19px;
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
  line-height: 1.35;
  margin-bottom: 12px;
  text-align: center;
}
.video-card {
  width: 100%;
  margin: 0 0 12px;
  aspect-ratio: 1264 / 720;
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.04);
}
.game-video {
  width: 100%;
  height: 100%;
  object-fit: contain;
  position: absolute;
  top: 0;
  left: 0;
  display: block;
}
.video-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: #71717a;
  font-size: 12px;
  font-weight: 600;
  z-index: 1;
  pointer-events: none;
  padding: 10px;
  text-align: center;
}
.video-play-btn {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: #ffffff;
  border: 1.5px solid #d4d4d8;
  color: #14532d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  padding-left: 2px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.06);
}
.video-replay-btn {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 3;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  background: rgba(24, 24, 27, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  color: #ffffff;
  border: 1.5px solid rgba(255, 255, 255, 0.25);
  border-radius: 24px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.3);
  transition: transform 0.15s ease, background-color 0.15s ease;
  font-family: inherit;
}
.video-replay-btn:hover {
  background: rgba(24, 24, 27, 0.98);
  transform: translate(-50%, -50%) scale(1.05);
}
.video-replay-btn:active {
  transform: translate(-50%, -50%) scale(0.96);
}
.replay-icon {
  font-size: 16px;
  line-height: 1;
}
.preview-card {
  background: #fafafa;
  border: 1px solid #e4e4e7;
  border-radius: 10px;
  padding: 10px 12px;
  margin-bottom: 12px;
  text-align: left;
}
.preview-header {
  font-size: 10.5px;
  font-weight: 700;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 6px;
  display: flex;
  justify-content: space-between;
}
.preview-clue {
  font-size: 12.5px;
  font-weight: 600;
  color: #27272a;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 6px;
  padding: 6px 10px;
  margin-bottom: 5px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.preview-clue:last-child {
  margin-bottom: 0;
}
.clue-num {
  background: #14532d;
  color: #ffffff;
  font-size: 10.5px;
  font-weight: 800;
  width: 17px;
  height: 17px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
.clue-blur {
  filter: blur(4px);
  user-select: none;
  color: #a1a1aa;
}
.signup-form {
  margin-bottom: 14px;
}
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.email-input {
  width: 100%;
  padding: 10px 12px;
  border: 1.5px solid #d4d4d8;
  border-radius: 8px;
  font-size: 16px; /* 16px prevents iOS Safari auto-zooming on focus */
  color: #18181b;
  outline: none;
  background-color: #ffffff;
  transition: border-color 0.2s ease;
  -webkit-appearance: none;
}
.email-input:focus {
  border-color: #18181b;
  box-shadow: 0 0 0 3px rgba(196, 247, 202, 0.5);
}
.btn-submit {
  width: auto;
  align-self: center;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 9px 18px;
  white-space: nowrap;
  background-color: #C4F7CA;
  color: #000000;
  border: 1.5px solid #7ecc84;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  transition: background-color 0.15s ease, border-color 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
  box-shadow: inset 0 2px 0 0 #e8ffea, 0 2px 4px rgba(0, 0, 0, 0.06);
}
.btn-submit:hover {
  background-color: #bbf4c3;
  border-color: #76c87c;
  box-shadow: inset 0 2px 0 0 #ddf9df, 0 2px 5px rgba(0, 0, 0, 0.08);
}
.btn-submit:active {
  transform: scale(0.99);
  box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.06);
}
.btn-submit:disabled {
  background-color: #e4e4e7;
  color: #a1a1aa;
  border-color: #d4d4d8;
  cursor: not-allowed;
  box-shadow: none;
}
@media (max-width: 640px) {
  .btn-submit {
    width: 100%;
    align-self: stretch;
    padding: 11px 18px;
    font-size: 14px;
  }
}
.status-msg {
  margin-top: 10px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 600;
}
.status-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
.success-card {
  background: #f0fdf4;
  border: 1.5px solid #bbf7d0;
  border-radius: 12px;
  padding: 20px 16px;
  text-align: center;
}
.success-icon {
  font-size: 32px;
  margin-bottom: 8px;
}
.success-title {
  font-size: 17px;
  font-weight: 800;
  color: #14532d;
  margin-bottom: 6px;
}
.success-desc {
  font-size: 13px;
  color: #166534;
  line-height: 1.5;
  margin-bottom: 16px;
}
.disclaimer {
  margin-top: 14px;
  padding: 8px 12px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  font-size: 11.5px;
  color: #92400e;
  line-height: 1.4;
  text-align: left;
}
.disclaimer a {
  color: #78350f;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.disclaimer a:hover {
  color: #451a03;
}
.features {
  border-top: 1px solid #e4e4e7;
  padding-top: 14px;
  margin-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  text-align: left;
}
.feature-item {
  font-size: 12px;
  color: #52525b;
  line-height: 1.4;
}
.feature-item strong {
  color: #18181b;
}
.footer-text {
  margin-top: 16px;
  font-size: 11px;
  color: #71717a;
  text-align: center;
  line-height: 1.5;
}
.footer-text a {
  color: #14532d;
  font-weight: 700;
  text-decoration: underline;
}
.footer-links a {
  color: #71717a;
  font-weight: 500;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.footer-links a:hover {
  color: #18181b;
}</style>
</head>
<body>
  <div class="container">
    <div class="logo-container">
      <div class="logo-tiles" aria-label="INBOXED">
        <span class="logo-tile rotate-neg">I</span>
        <span class="logo-tile rotate-pos">N</span>
        <span class="logo-tile rotate-neg">B</span>
        <span class="logo-tile rotate-pos">O</span>
        <span class="logo-tile rotate-neg">X</span>
        <span class="logo-tile rotate-pos">E</span>
        <span class="logo-tile rotate-neg">D</span>
      </div>
    </div>

    <h1>The Daily Word Game that Lives in Your Email</h1>
    <p class="subtitle">
      Guess the hidden word from its definitions. Every morning at 9:00 AM, right inside your email.
    </p>

    <!-- Sample Game Video Spot -->
    <div class="video-card">
      <video id="demo-video" class="game-video" autoplay muted playsinline preload="auto">
        <source src="/demo-4.mp4" type="video/mp4">
        <source src="/demo.mp4" type="video/mp4">
        Your browser does not support the video tag.
      </video>
      <div id="video-placeholder" class="video-placeholder">
        <div class="video-play-btn">▶</div>
        <span>Sample Game Video</span>
      </div>
      <button type="button" id="video-replay-btn" class="video-replay-btn" aria-label="Replay video" style="display: none;">
        <span class="replay-icon">↻</span>
        <span class="replay-text">Replay</span>
      </button>
    </div>

    <!-- Interactive / Clue Teaser Preview -->
    <div class="preview-card">
      <div class="preview-header">
        <span>Today's Clues</span>
        <span style="color: #14532d; font-weight: 700;">Puzzle #{{PUZZLE_ID}}</span>
      </div>
      <div class="preview-clue">
        <span class="clue-num">1</span>
        <span>{{FIRST_DEFINITION}}</span>
      </div>
      <div class="preview-clue">
        <span class="clue-num" style="background: #a1a1aa;">2</span>
        <span class="clue-blur">Miss a guess to reveal next definition</span>
      </div>
    </div>

    <!-- Signup Form / Success Container -->
    <div id="signup-container">
      {{STATUS_CONTENT}}
    </div>

    <div class="features">
      <div class="feature-item">
        <strong>Interactive in your email:</strong> Play directly inside supported email clients (like Gmail and Yahoo Mail) without leaving your inbox.
      </div>
      <div class="feature-item">
        <strong>Company leaderboard:</strong> Compete automatically with coworkers at your email domain.
      </div>
      <div class="feature-item">
        <strong>Zero spam:</strong> Strictly one puzzle per day. One-click unsubscribe anytime.
      </div>
    </div>

    <div class="disclaimer">
      Inboxed does not currently support Apple Mail, Outlook, or other non-AMP clients. <a href="https://amp.dev/support/faq/email-support/" target="_blank" rel="noopener noreferrer">See supported email clients</a>
    </div>

    <div class="footer-text">
      <div>Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a></div>
      <div class="footer-links" style="margin-top: 6px;">
        <a href="/privacy">Privacy Policy</a>
      </div>
    </div>
  </div>

  <script>
    // Video controls: hide placeholder on play, show replay button when ended
    const demoVideo = document.getElementById('demo-video');
    const placeholder = document.getElementById('video-placeholder');
    const replayBtn = document.getElementById('video-replay-btn');

    if (demoVideo) {
      if (placeholder) {
        const hidePlaceholder = () => { placeholder.style.display = 'none'; };
        demoVideo.addEventListener('playing', hidePlaceholder);
        demoVideo.addEventListener('loadeddata', hidePlaceholder);
        demoVideo.addEventListener('canplay', hidePlaceholder);
      }

      const showReplay = () => {
        if (replayBtn) replayBtn.style.display = 'flex';
      };
      const hideReplay = () => {
        if (replayBtn) replayBtn.style.display = 'none';
      };

      const replayVideo = () => {
        hideReplay();
        demoVideo.currentTime = 0;
        demoVideo.play();
      };

      // Ensure video sits on last frame when finished and shows replay button
      demoVideo.addEventListener('ended', () => {
        demoVideo.pause();
        showReplay();
      });

      if (replayBtn) {
        replayBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          replayVideo();
        });
      }

      // Allow tapping video to replay from start if finished
      demoVideo.addEventListener('click', () => {
        if (demoVideo.ended) {
          replayVideo();
        }
      });
    }

    const form = document.getElementById('signup-form');
    if (form) {
      const input = document.getElementById('email-input');
      const btn = document.getElementById('submit-btn');
      const msg = document.getElementById('status-msg');
      const container = document.getElementById('signup-container');

      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = input.value.trim();
        if (!email || !email.includes('@')) {
          msg.textContent = 'Please enter a valid email address.';
          msg.className = 'status-msg status-error';
          msg.style.display = 'block';
          return;
        }

        btn.disabled = true;
        btn.textContent = 'Subscribing...';
        msg.style.display = 'none';

        try {
          const res = await fetch('/api/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email })
          });
          const data = await res.json();
          if (data.success) {
            container.innerHTML = \`
              <div class="success-card">
                <div class="success-icon">✉️</div>
                <h2 class="success-title">Check Your Email!</h2>
                <p class="success-desc">
                  We sent a confirmation link to <strong>\${email}</strong>.<br>
                  Click the link in your email to confirm your subscription and start playing.
                </p>
              </div>
            \`;
          } else {
            msg.textContent = data.message || 'Could not subscribe. Please try again.';
            msg.className = 'status-msg status-error';
            msg.style.display = 'block';
            btn.disabled = false;
            btn.textContent = 'Subscribe to Daily Puzzles';
          }
        } catch (err) {
          msg.textContent = 'Something went wrong. Please check your connection.';
          msg.className = 'status-msg status-error';
          msg.style.display = 'block';
          btn.disabled = false;
          btn.textContent = 'Subscribe to Daily Puzzles';
        }
      });
    }
  </script>
</body>
</html>
`;
