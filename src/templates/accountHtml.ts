// HTML template for React Single Page App (SPA) Account Preferences
export function getAccountPageHtml(): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed Account &amp; Preferences</title>
  
  <!-- Load React & ReactDOM via CDN for lightweight high-performance SPA -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js" crossorigin></script>
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>

  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      background-color: #ffffff;
      color: #18181b;
      line-height: 1.5;
      padding: 32px 16px;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }
    .container {
      width: 100%;
      max-width: 480px;
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
      justify-content: space-between;
      padding: 10px 0 24px 0;
      font-size: 13.5px;
      font-weight: 600;
      color: #18181b;
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
    .setting-section {
      padding: 18px 0;
      text-align: left;
    }
    .setting-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .setting-title { font-size: 14.5px; font-weight: 700; color: #18181b; }
    .setting-desc { font-size: 13px; color: #71717a; line-height: 1.45; margin-top: 4px; }
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
      justify-content: space-between;
      margin-top: 12px;
    }
    .switch-label { font-size: 12.5px; font-weight: 700; }
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
      box-shadow: inset 0 1px 0 0 #e8ffea;
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

    /* Dark Mode Theme Overrides for Account Preferences SPA */
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
    body.dark-theme .footer-text {
      color: #a1a1aa;
    }
    body.dark-theme .footer-text a {
      color: #C4F7CA;
    }
  </style>
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
      const [updatingTheme, setUpdatingTheme] = useState(false);

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

      useEffect(() => {
        if (user && user.theme === 'dark') {
          document.body.classList.add('dark-theme');
        } else {
          document.body.classList.remove('dark-theme');
        }
      }, [user?.theme]);

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
              <span className="domain-pill">{user.domain}</span>
            </div>
          </div>

          {/* Daily Morning Subscription Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">📬 Daily Morning Email</span>
            </div>
            <div className="setting-desc">
              Receive today's multi-definition word puzzle in your inbox each morning.
            </div>
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

          <hr className="section-divider" />

          {/* Leaderboard Privacy Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">🏆 Domain Leaderboard Visibility</span>
            </div>
            <div className="setting-desc">
              Show your score on the <strong>{user.domain}</strong> leaderboard when you solve the puzzle.
            </div>
            <div className="switch-container">
              <span className="switch-label" style={{ color: user.showOnLeaderboard ? '#14532d' : '#71717a' }}>
                {user.showOnLeaderboard ? 'Visible on Leaderboard' : 'Hidden from Leaderboard'}
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

          <hr className="section-divider" />

          {/* Dark Mode Theme Switch */}
          <div className="setting-section">
            <div className="setting-header">
              <span className="setting-title">🌙 Dark Mode</span>
            </div>
            <div className="setting-desc">
              Receive your daily puzzle email in dark mode instead of light mode.
            </div>
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

          <hr className="section-divider" />

          <div className="footer-text">
            Game made with ❤️ by <a href="https://ekimerton.github.io" target="_blank" rel="noopener noreferrer">Ekim</a>
          </div>
        </div>
      );
    }

    const root = ReactDOM.createRoot(document.getElementById('root'));
    root.render(<AccountApp />);
  </script>
</body>
</html>`
}
