export const PRIVACY_CSS = `* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  line-height: 1.6;
  padding: 40px 20px;
}
.container {
  max-width: 640px;
  margin: 0 auto;
}
.back-link {
  display: inline-block;
  margin-bottom: 24px;
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.header {
  margin-bottom: 28px;
  border-bottom: 1px solid #e4e4e7;
  padding-bottom: 18px;
}
h1 {
  font-size: 26px;
  font-weight: 800;
  color: #18181b;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}
.meta {
  font-size: 12.5px;
  color: #71717a;
}
h2 {
  font-size: 17px;
  font-weight: 700;
  color: #18181b;
  margin-top: 26px;
  margin-bottom: 8px;
}
p {
  font-size: 14px;
  color: #3f3f46;
  margin-bottom: 12px;
}
ul {
  margin-bottom: 14px;
  padding-left: 20px;
}
li {
  font-size: 13.5px;
  color: #3f3f46;
  margin-bottom: 6px;
}
li strong {
  color: #18181b;
}
a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 18px 0;
  font-size: 13.5px;
  color: #27272a;
}
.footer {
  margin-top: 40px;
  padding-top: 18px;
  border-top: 1px solid #e4e4e7;
  font-size: 12px;
  color: #71717a;
  text-align: center;
}
`;

export const PRIVACY_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Privacy Policy - Inboxed</title>
  <style>* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
  background-color: #ffffff;
  color: #18181b;
  line-height: 1.6;
  padding: 40px 20px;
}
.container {
  max-width: 640px;
  margin: 0 auto;
}
.back-link {
  display: inline-block;
  margin-bottom: 24px;
  font-size: 13px;
  font-weight: 700;
  color: #14532d;
  text-decoration: none;
}
.back-link:hover {
  text-decoration: underline;
}
.header {
  margin-bottom: 28px;
  border-bottom: 1px solid #e4e4e7;
  padding-bottom: 18px;
}
h1 {
  font-size: 26px;
  font-weight: 800;
  color: #18181b;
  margin-bottom: 6px;
  letter-spacing: -0.5px;
}
.meta {
  font-size: 12.5px;
  color: #71717a;
}
h2 {
  font-size: 17px;
  font-weight: 700;
  color: #18181b;
  margin-top: 26px;
  margin-bottom: 8px;
}
p {
  font-size: 14px;
  color: #3f3f46;
  margin-bottom: 12px;
}
ul {
  margin-bottom: 14px;
  padding-left: 20px;
}
li {
  font-size: 13.5px;
  color: #3f3f46;
  margin-bottom: 6px;
}
li strong {
  color: #18181b;
}
a {
  color: #14532d;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}
.card {
  background: #f4f4f5;
  border: 1px solid #e4e4e7;
  border-radius: 8px;
  padding: 14px 16px;
  margin: 18px 0;
  font-size: 13.5px;
  color: #27272a;
}
.footer {
  margin-top: 40px;
  padding-top: 18px;
  border-top: 1px solid #e4e4e7;
  font-size: 12px;
  color: #71717a;
  text-align: center;
}</style>
</head>
<body>
  <div class="container">
    <a href="/" class="back-link">← Back to Inboxed</a>

    <div class="header">
      <h1>Privacy Policy</h1>
      <div class="meta">Effective Date: September 14, 2026 &bull; Inboxed (<a href="https://inboxed.fun">inboxed.fun</a>)</div>
    </div>

    <h2>1. Introduction</h2>
    <p>
      Inboxed ("we", "our", or "us") provides a daily word puzzle game played directly inside email or on the web at <a href="https://inboxed.fun">inboxed.fun</a>.
    </p>
    <p>
      We respect your privacy. We do not sell your personal data, we do not run third-party advertising tracking scripts, and we collect only the minimal information needed to deliver the daily puzzle and operate leaderboards.
    </p>

    <h2>2. Information We Collect</h2>
    <ul>
      <li><strong>Email Address:</strong> Collected when you sign up to receive daily puzzle emails, confirmation messages, and account preferences.</li>
      <li><strong>Gameplay Data:</strong> When you play, we record basic game statistics such as puzzle date, guesses count, hints used, score, and completion status.</li>
      <li><strong>Organization / Domain:</strong> Extracted from your email domain (e.g. <code>company.com</code> from <code>user@company.com</code>) to group coworker leaderboards.</li>
      <li><strong>Preferences:</strong> Your subscription status and your leaderboard privacy choice (whether your name is displayed or masked as "Anonymous Player").</li>
      <li><strong>Technical Logs:</strong> Standard HTTP request logs (IP address, user agent, timestamp) temporarily processed by our infrastructure provider (Cloudflare) for security, rate-limiting, and abuse prevention.</li>
    </ul>

    <h2>3. How We Use Your Information</h2>
    <ul>
      <li>To deliver daily puzzle emails to confirmed subscribers at 9:00 AM PST.</li>
      <li>To verify subscriptions through double opt-in confirmation emails.</li>
      <li>To maintain workplace and global leaderboards.</li>
      <li>To provide passwordless self-service preference management (updating preferences, pausing, or unsubscribing).</li>
    </ul>
    <p>
      We <strong>never</strong> sell, rent, or trade your personal information to third-party data brokers or marketing agencies.
    </p>

    <h2>4. Email & Anti-Spam Policy</h2>
    <ul>
      <li><strong>Daily Frequency:</strong> Confirmed subscribers receive at most one puzzle email per day.</li>
      <li><strong>Double Opt-In:</strong> Subscriptions must be verified via confirmation link before daily emails begin.</li>
      <li><strong>One-Click Unsubscribe:</strong> Every email includes an unsubscribe header (<code>List-Unsubscribe</code>) and a direct unsubscribe link in the footer. You can unsubscribe instantly at any time.</li>
    </ul>

    <h2>5. Third-Party Service Providers</h2>
    <p>We work with trusted infrastructure providers to deliver Inboxed:</p>
    <ul>
      <li><strong>Cloudflare:</strong> Hosts our web application (Cloudflare Workers) and encrypted edge database (Cloudflare KV).</li>
      <li><strong>Mailgun:</strong> Delivers transactional confirmation and daily puzzle emails via secure SMTP.</li>
    </ul>

    <h2>6. Security</h2>
    <p>
      We protect your data using industry-standard security measures:
    </p>
    <ul>
      <li><strong>Cryptographic Tokens:</strong> Account preferences and confirmation links use HMAC-SHA256 tokens, eliminating the need to store passwords.</li>
      <li><strong>Encrypted Transport:</strong> All web and email communications are transmitted over secure HTTPS / TLS connections.</li>
    </ul>

    <h2>7. Your Choices and Data Rights</h2>
    <ul>
      <li><strong>Leaderboard Anonymity:</strong> You can toggle your display name to "Anonymous Player" at any time in your account settings.</li>
      <li><strong>Unsubscribe:</strong> You can cancel your subscription at any time with one click.</li>
      <li><strong>Data Deletion:</strong> You can request full deletion of your email address and gameplay history by contacting us at <a href="mailto:game@inboxed.fun">game@inboxed.fun</a>.</li>
    </ul>

    <h2>8. Contact Us</h2>
    <p>
      If you have questions about this Privacy Policy or your data, please contact us:
    </p>
    <div class="card">
      <strong>Inboxed Support</strong><br>
      Email: <a href="mailto:game@inboxed.fun">game@inboxed.fun</a><br>
      Website: <a href="https://inboxed.fun">https://inboxed.fun</a>
    </div>

    <div class="footer">
      <a href="/" class="back-link">← Back to Inboxed</a><br>
      &copy; 2026 Inboxed. All rights reserved.
    </div>
  </div>
</body>
</html>
`;
