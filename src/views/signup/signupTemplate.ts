export const SIGNUP_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 32px 16px;
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
  margin-bottom: 20px;
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
h1 {
  font-size: 22px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 1.3;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 14px;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
}
.preview-card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}
.preview-header {
  font-size: 11px;
  font-weight: 700;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
.preview-clue {
  font-size: 13px;
  font-weight: 600;
  color: #27272a;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.clue-num {
  background: #14532d;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  width: 18px;
  height: 18px;
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
  margin-bottom: 20px;
}
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.email-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #d4d4d8;
  border-radius: 8px;
  font-size: 15px;
  color: #18181b;
  outline: none;
  transition: border-color 0.2s ease;
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
  padding: 10px 20px;
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
  margin-top: 18px;
  padding: 10px 14px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
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
  padding-top: 18px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: #52525b;
  line-height: 1.4;
}
.feature-icon {
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}
.feature-text strong {
  color: #18181b;
}
.footer-text {
  margin-top: 24px;
  font-size: 11.5px;
  color: #71717a;
  text-align: center;
  line-height: 1.6;
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
  <title>Inboxed - The Daily Word Game in Your Inbox</title>
  <meta name="description" content="A daily synonym word-guessing game right inside your email. Misses unlock new definitions. Compete with coworkers on your company leaderboard.">
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
  justify-content: center;
  padding: 32px 16px;
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
  margin-bottom: 20px;
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
h1 {
  font-size: 22px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  line-height: 1.3;
  margin-bottom: 8px;
}
.subtitle {
  font-size: 14px;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
}
.preview-card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 24px;
  text-align: left;
}
.preview-header {
  font-size: 11px;
  font-weight: 700;
  color: #71717a;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin-bottom: 10px;
  display: flex;
  justify-content: space-between;
}
.preview-clue {
  font-size: 13px;
  font-weight: 600;
  color: #27272a;
  background: #ffffff;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 10px 12px;
  margin-bottom: 8px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.clue-num {
  background: #14532d;
  color: #ffffff;
  font-size: 11px;
  font-weight: 800;
  width: 18px;
  height: 18px;
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
  margin-bottom: 20px;
}
.input-wrapper {
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.email-input {
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #d4d4d8;
  border-radius: 8px;
  font-size: 15px;
  color: #18181b;
  outline: none;
  transition: border-color 0.2s ease;
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
  padding: 10px 20px;
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
  margin-top: 18px;
  padding: 10px 14px;
  background-color: #fffbeb;
  border: 1px solid #fef3c7;
  border-radius: 8px;
  font-size: 12px;
  color: #92400e;
  line-height: 1.5;
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
  padding-top: 18px;
  margin-top: 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  text-align: left;
}
.feature-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  font-size: 12px;
  color: #52525b;
  line-height: 1.4;
}
.feature-icon {
  font-size: 15px;
  flex-shrink: 0;
  margin-top: 1px;
}
.feature-text strong {
  color: #18181b;
}
.footer-text {
  margin-top: 24px;
  font-size: 11.5px;
  color: #71717a;
  text-align: center;
  line-height: 1.6;
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

    <h1>The Daily Word Game in Your Inbox</h1>
    <p class="subtitle">
      Guess the hidden word from its definitions. Every morning at 8:00 AM, right inside your email.
    </p>

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
        <span class="feature-icon">✉️</span>
        <span class="feature-text"><strong>Interactive in your email:</strong> Play directly inside supported email clients (like Gmail and Yahoo Mail) without leaving your inbox.</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🏢</span>
        <span class="feature-text"><strong>Company leaderboard:</strong> Compete automatically with coworkers at your email domain.</span>
      </div>
      <div class="feature-item">
        <span class="feature-icon">🛡️</span>
        <span class="feature-text"><strong>Zero spam:</strong> Strictly one puzzle per day. One-click unsubscribe anytime.</span>
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
