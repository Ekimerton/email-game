export const FALLBACK_CSS = `body {
  margin: 0;
  padding: 0;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
}

.fallback-wrapper {
  max-width: 480px;
  margin: 0 auto;
  padding: 12px 8px;
}

.fallback-card {
  border-radius: 12px;
  padding: 20px 16px;
  box-sizing: border-box;
}

.logo-wrap {
  text-align: center;
  margin: 0 0 20px;
}

.logo-wrap a {
  text-decoration: none;
  display: inline-block;
}

.logo-wrap img {
  display: block;
  margin: 0 auto;
  width: 160px;
  height: 38px;
  border: 0;
  outline: none;
  text-decoration: none;
}

.intro-section {
  padding: 4px 0 16px;
  text-align: left;
}

.intro-section p {
  font-size: 15px;
  font-weight: 600;
  line-height: 1.55;
  margin: 0;
}

.cta-link {
  display: block;
  font-size: 14px;
  font-weight: 800;
  margin-top: 16px;
  text-align: center;
  text-decoration: underline;
}

.divider {
  border-top: 1px solid;
}

.help-section {
  padding: 14px 0 2px;
  text-align: left;
  font-size: 12px;
  line-height: 1.5;
}

.help-section p {
  margin: 6px 0 0;
}
`;

export const FALLBACK_HTML = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inboxed #{{PUZZLE_ID}} - Daily Word Puzzle</title>
</head>
<body style="margin: 0; padding: 0; background-color: {{BODY_BG}}; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: {{BODY_TEXT}};">
  <div style="max-width: 480px; margin: 0 auto; padding: 12px 8px;">
    <div style="background-color: {{CARD_BG}}; border: 1px solid {{CARD_BORDER}}; border-radius: 12px; padding: 20px 16px; box-sizing: border-box;">
      <div style="text-align: center; margin: 0 0 20px;">
        <a href="{{PLAY_URL}}" style="text-decoration: none; display: inline-block;">
          <img src="{{LOGO_URL}}" alt="INBOXED" width="160" height="38" style="display: block; margin: 0 auto; width: 160px; height: 38px; border: 0; outline: none; text-decoration: none;">
        </a>
      </div>

      <div style="padding: 4px 0 16px; text-align: left;">
        <p style="font-size: 15px; font-weight: 600; line-height: 1.55; color: {{P_TEXT}}; margin: 0;">
          <strong style="color: {{STRONG_TEXT}};">{{EMAIL}}</strong> is inviting you to play Inboxed, the daily word game in your inbox. {{COMMUNITY_MESSAGE}}
        </p>
        <a href="{{PLAY_URL}}" style="display: block; color: {{CTA_COLOR}}; font-size: 14px; font-weight: 800; margin-top: 16px; text-align: center; text-decoration: underline;">Sign up to play →</a>
      </div>

      <div style="border-top: 1px solid {{DIVIDER_COLOR}};"></div>
      <div style="padding: 14px 0 2px; text-align: left; font-size: 12px; line-height: 1.5; color: {{MUTED_TEXT}};">
        <strong style="color: {{SUB_STRONG_TEXT}};">Seeing this while trying to load the game?</strong><br>
        <p style="margin: 6px 0 0;">Your email client might not be supported. This game uses AMP email, which is supported by Gmail, Yahoo Mail, AOL Mail, FairEmail, and Mail.ru.</p>
        <p style="margin: 4px 0 0;">You can <a href="{{ACCOUNT_URL}}" style="color: {{CTA_COLOR}}; font-weight: 700; text-decoration: underline;">update your account preferences</a>.</p>
      </div>
    </div>
  </div>
</body>
</html>
`;
