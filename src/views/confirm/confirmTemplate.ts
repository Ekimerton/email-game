export const CONFIRM_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
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
.success-icon {
  font-size: 38px;
  margin-bottom: 12px;
}
.success-title {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.schedule-notice {
  font-size: 15px;
  font-weight: 500;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
}
.action-section {
  margin-top: 12px;
}
.action-desc {
  font-size: 14px;
  color: #52525b;
  margin-bottom: 20px;
  line-height: 1.5;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}
.action-desc strong {
  color: #18181b;
}
.btn-submit {
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
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.status-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.status-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
}
`;

export const CONFIRM_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Subscription Confirmed - Inboxed</title>
  <meta name="description" content="Your subscription to Inboxed has been confirmed.">
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
.success-icon {
  font-size: 38px;
  margin-bottom: 12px;
}
.success-title {
  font-size: 24px;
  font-weight: 800;
  color: #18181b;
  letter-spacing: -0.5px;
  margin-bottom: 8px;
}
.schedule-notice {
  font-size: 15px;
  font-weight: 500;
  color: #52525b;
  line-height: 1.5;
  margin-bottom: 24px;
}
.action-section {
  margin-top: 12px;
}
.action-desc {
  font-size: 14px;
  color: #52525b;
  margin-bottom: 20px;
  line-height: 1.5;
  max-width: 420px;
  margin-left: auto;
  margin-right: auto;
}
.action-desc strong {
  color: #18181b;
}
.btn-submit {
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
  margin-top: 12px;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.4;
}
.status-success {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  color: #065f46;
}
.status-error {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #991b1b;
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

    <div class="success-icon">🎉</div>
    <h1 class="success-title">You're Subscribed!</h1>
    <p class="schedule-notice">
      You'll get emails at 9am PST every day.
    </p>

    <div class="action-section">
      <p class="action-desc">
        Want to play today's game right now? Receive today's puzzle (<strong>#{{PUZZLE_ID}}</strong>) in your inbox immediately:
      </p>
      <button id="send-today-btn" class="btn-submit">
        Receive Today's Puzzle Now
      </button>
      <div id="status-msg" class="status-msg" style="display: none;"></div>
    </div>
  </div>

  <script>
    const btn = document.getElementById('send-today-btn');
    const msg = document.getElementById('status-msg');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = 'Sending to your inbox...';
        msg.style.display = 'none';

        try {
          const res = await fetch('/api/send-today', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: "{{SAFE_EMAIL}}",
              token: "{{SAFE_TOKEN}}"
            })
          });
          const data = await res.json();
          if (data.success) {
            btn.style.display = 'none';
            msg.className = 'status-msg status-success';
            msg.innerHTML = '🚀 <strong>Sent!</strong> Check your inbox for today\\'s puzzle.';
            msg.style.display = 'block';
          } else {
            btn.disabled = false;
            btn.textContent = "Receive Today's Puzzle Now";
            msg.className = 'status-msg status-error';
            msg.textContent = data.message || 'Could not send puzzle. Please try again.';
            msg.style.display = 'block';
          }
        } catch (err) {
          btn.disabled = false;
          btn.textContent = "Receive Today's Puzzle Now";
          msg.className = 'status-msg status-error';
          msg.textContent = 'Connection error. Please try again.';
          msg.style.display = 'block';
        }
      });
    }
  </script>
</body>
</html>
`;
