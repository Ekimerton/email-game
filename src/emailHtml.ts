export const EMAIL_HTML = `<!doctype html>
<html ⚡4email data-css-strict>

<head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>
    <script async custom-element="amp-list" src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>

    <style amp4email-boilerplate>body{visibility:hidden}</style>
    <style amp-custom>
        /* Josh Comeau's Modern CSS Reset (AMP4EMAIL Adapted) */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            line-height: 1.3;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #52C3E6;
            color: #18181b;
            padding: 4px;
        }

        img, picture, video, canvas, svg {
            display: block;
            max-width: 100%;
        }

        input, button, textarea, select {
            font: inherit;
        }

        p, h1, h2, h3, h4, h5, h6 {
            overflow-wrap: break-word;
        }

        .email-wrapper {
            margin: 0 auto;
            max-width: 480px;
            padding: 8px 4px 16px;
        }

        .email-container,
        .card {
            margin: 0 auto 12px;
            max-width: 480px;
            background: #ffffff;
            border-radius: 12px;
            border: none;
            overflow: hidden;
            box-shadow: 0 4px 14px rgba(0, 0, 0, 0.10);
            padding: 12px 14px;
        }

        /* AMP List Layout Reset */
        amp-list {
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
        }

        amp-list > [placeholder],
        amp-list > [role="list"],
        amp-list [role="listitem"] {
            display: block;
            position: relative;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            margin: 0;
            padding: 0;
            border: 0;
            box-sizing: border-box;
        }

        /* Meta Row: Org on Left, Date on Right */
        .game-meta-row {
            padding: 4px 4px 6px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .domain-badge-compact {
            background: #EF476F;
            color: #ffffff;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
        }

        .header-date-compact {
            font-size: 12px;
            color: #09090b;
            font-weight: 700;
            opacity: 0.8;
        }

        /* Centered Header & Tagline */
        .game-hero {
            text-align: center;
            padding: 2px 4px 12px;
        }

        .header-title-centered {
            font-size: 24px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #09090b;
            text-transform: uppercase;
            margin-bottom: 2px;
            line-height: 1.1;
        }

        .game-intro-text {
            font-size: 12px;
            font-weight: 600;
            line-height: 1.3;
            color: #09090b;
            letter-spacing: 0.1px;
            opacity: 0.9;
        }

        .game-body {
            padding: 0;
        }

        /* Feedback Status Banner at Top */
        .message-banner {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            color: #18181b;
            line-height: 1.3;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            margin-top: 14px;
            margin-bottom: 0;
        }

        /* Definition Clue Stepper & Active Card */
        .definitions-section {
            margin-bottom: 8px;
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: #52525b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            display: flex;
            justify-content: space-between;
        }

        .clue-tabs-bar {
            display: flex;
            gap: 4px;
            margin-bottom: 6px;
        }

        .clue-tab-btn {
            flex: 1;
            padding: 5px 2px;
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 700;
            color: #71717a;
            cursor: pointer;
            text-align: center;
            line-height: 1.2;
            font-family: inherit;
        }

        .clue-tab-btn.unlocked {
            background: #f4f4f5;
            color: #18181b;
            border-color: #e4e4e7;
        }

        .clue-tab-btn.active {
            background: #2563eb;
            color: #ffffff;
            border-color: #1d4ed8;
        }

        .clue-tab-btn.locked {
            color: #a1a1aa;
            opacity: 0.7;
        }

        .active-clue-card {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 10px 14px;
            min-height: 84px;
            display: flex;
            align-items: center;
        }

        .clue-content {
            width: 100%;
        }

        .clue-text {
            font-size: 13px;
            font-weight: 600;
            color: #09090b;
            line-height: 1.4;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }

        .clue-text.blurred {
            color: #a1a1aa;
            letter-spacing: 2px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 12px;
            font-weight: 500;
        }

        /* Status & Mask Tiles */
        .synonyms-section {
            margin-bottom: 8px;
        }

        .mask-grid {
            display: flex;
            gap: 4px;
            justify-content: center;
        }

        .mask-tile {
            width: 36px;
            height: 40px;
            background: #ffffff;
            border: 1.5px solid #d4d4d8;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
        }

        /* Input Form Section */
        .form-container {
            margin-bottom: 0;
        }

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .guess-input {
            width: 100%;
            background: #ffffff;
            border: 1.5px solid #d4d4d8;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 18px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            letter-spacing: 4px;
            text-align: center;
        }

        .guess-input:focus {
            outline: none;
            border-color: #2563eb;
            box-shadow: none;
        }

        .action-buttons {
            display: flex;
            gap: 6px;
        }

        .btn {
            border: none;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 13px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
            flex: 1;
        }

        .btn-primary {
            background: #2563eb;
            color: #ffffff;
        }

        .btn-hint {
            background: #e4e4e7;
            color: #18181b;
        }

        .btn:disabled {
            opacity: 0.5;
        }

        /* Stats Bar */
        .stats-bar {
            display: flex;
            justify-content: space-around;
            background: #f4f4f5;
            padding: 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #52525b;
            margin-bottom: 10px;
        }

        .stats-val {
            color: #52525b;
            font-weight: 800;
        }

        /* Victory Card */
        .win-card {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 10px;
            padding: 10px 12px;
            text-align: center;
            margin-bottom: 8px;
        }

        .win-title {
            font-size: 17px;
            font-weight: 900;
            color: #ffffff;
            margin-bottom: 2px;
        }

        .win-score {
            font-size: 13px;
            color: #d4d4d8;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .share-box {
            background: #27272a;
            border: 1px dashed #71717a;
            border-radius: 6px;
            padding: 6px 8px;
            font-family: monospace;
            font-size: 11px;
            color: #f4f4f5;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-all;
        }

        /* Subscribe Banner Box */
        .subscribe-banner {
            background: #18181b;
            border: 1px solid #27272a;
            border-radius: 8px;
            padding: 10px;
            margin-bottom: 10px;
        }

        .subscribe-header {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .subscribe-icon {
            font-size: 18px;
            flex-shrink: 0;
        }

        .subscribe-title {
            font-size: 12px;
            font-weight: 800;
            color: #ffffff;
        }

        .subscribe-desc {
            font-size: 11px;
            color: #a1a1aa;
            margin-top: 1px;
            line-height: 1.2;
        }

        .btn-subscribe {
            background: #27272a;
            color: #ffffff;
            width: 100%;
        }

        .btn-subscribe {
            background: #27272a;
            color: #ffffff;
            width: 100%;
        }

        /* Card Title */
        .card-title {
            font-size: 13px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
            text-align: center;
        }

        /* Leaderboard */
        .leaderboard-blur-content {
            opacity: 0.15;
            filter: blur(4px);
        }

        .leaderboard-lock-banner {
            position: absolute;
            top: 48px;
            left: 12px;
            right: 12px;
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #71717a;
            border-radius: 8px;
            padding: 8px 12px;
            color: #18181b;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            z-index: 10;
        }

        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #f4f4f5;
            font-size: 12px;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 800;
            width: 20px;
            color: #2563eb;
        }

        .player-email {
            flex: 1;
            font-weight: 600;
            color: #27272a;
        }

        .player-score {
            font-weight: 800;
            color: #18181b;
        }

        /* How to Play */
        .how-to-play-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .how-to-play-item {
            display: flex;
            align-items: flex-start;
            gap: 8px;
            font-size: 11px;
            line-height: 1.4;
            color: #3f3f46;
        }

        .how-to-play-step {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 18px;
            height: 18px;
            background: #e4e4e7;
            color: #18181b;
            font-weight: 800;
            font-size: 10px;
            border-radius: 50%;
            flex-shrink: 0;
            margin-top: 1px;
        }

        .how-to-play-text strong {
            color: #18181b;
        }

        .footer {
            padding: 8px 10px 16px;
            text-align: center;
            font-size: 11px;
            color: #09090b;
            opacity: 0.85;
            font-weight: 500;
        }

        .account-link {
            color: #EF476F;
            text-decoration: underline;
            margin-top: 4px;
            display: inline-block;
            font-weight: 700;
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <!-- Top Meta Row: Org on Left, Date on Right -->
        <div class="game-meta-row">
            <span class="domain-badge-compact">company.com</span>
            <span class="header-date-compact">Aug 5, 2026</span>
        </div>

        <!-- Centered Title & Tagline -->
        <div class="game-hero">
            <h1 class="header-title-centered">Word Game</h1>
            <p class="game-intro-text">The daily word game you can play in your email!</p>
        </div>

        <!-- Dynamic State Store for interactive binding & hiding form on win -->
        <amp-state id="gameState">
            <script type="application/json">
                {
                    "hasWon": false
                }
            </script>
        </amp-state>

        <!-- Active Clue Selection State -->
        <amp-state id="clueView">
            <script type="application/json">
                {}
            </script>
        </amp-state>

        <!-- 1. Main Game Card: WORD GAME #XX -->
        <div class="card">
            <div class="card-title">WORD GAME #1</div>

            <div class="game-body">
                <!-- Dynamic State Section - fetched fresh on every email open -->
                <amp-list id="stateList" width="auto" height="250" layout="fixed-height"
                    src="https://email-game.teamify.workers.dev/api/state?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                    <template type="amp-mustache">
                        <div class="state-container">
                            <div class="definitions-section">
                                <div class="section-label">
                                    <span>Definition Clues</span>
                                    <span><span [text]="gameState.revealedCount || {{revealedCount}}">{{revealedCount}}</span>/{{totalDefinitions}} unlocked</span>
                                </div>
                                <div class="clue-tabs-bar">
                                    {{#definitions}}
                                    <button type="button"
                                        class="clue-tab-btn {{#isRevealed}}unlocked{{/isRevealed}}{{^isRevealed}}locked{{/isRevealed}} {{#isLatest}}active{{/isLatest}}"
                                        [class]="'clue-tab-btn ' + ((gameState.revealedCount || {{revealedCount}}) >= {{num}} ? 'unlocked' : 'locked') + ((clueView.activeClue || {{revealedCount}}) == {{num}} ? ' active' : '')"
                                        on="tap:AMP.setState({ clueView: { activeClue: {{num}} } })">
                                        Clue {{num}}
                                    </button>
                                    {{/definitions}}
                                </div>
                                <div class="active-clue-card">
                                    {{#definitions}}
                                    <div class="clue-content"
                                        [hidden]="(clueView.activeClue || {{revealedCount}}) != {{num}}">
                                        <div class="clue-text {{^isRevealed}}blurred{{/isRevealed}}"
                                            [class]="'clue-text' + ((gameState.revealedCount || {{revealedCount}}) >= {{num}} ? '' : ' blurred')">{{text}}</div>
                                    </div>
                                    {{/definitions}}
                                </div>
                            </div>

                            <div class="synonyms-section">
                                <div class="section-label">
                                    <span>Revealed Letters</span>
                                    <span>Guesses: <span class="stats-val">{{guessCount}}</span></span>
                                </div>
                                <div class="mask-grid">
                                    {{#letterMask}}
                                    <div class="mask-tile">{{.}}</div>
                                    {{/letterMask}}
                                </div>
                            </div>

                            <div class="message-banner {{#hasWon}}message-banner-win{{/hasWon}}">{{lastMessage}}</div>
                        </div>
                    </template>
                    <div placeholder>
                        <div class="state-container">
                            <div class="definitions-section">
                                <div class="section-label">
                                    <span>Definition Clues</span>
                                    <span>1/5 unlocked</span>
                                </div>
                                __PLACEHOLDER_DEFS__
                            </div>
                            <div class="synonyms-section">
                                <div class="section-label">
                                    <span>Revealed Letters</span>
                                    <span>Guesses: <span class="stats-val">0</span></span>
                                </div>
                                <div class="mask-grid">
                                    __PLACEHOLDER_MASK_TILES__
                                </div>
                            </div>
                            <div class="message-banner">Guess the word!</div>
                        </div>
                    </div>
                </amp-list>

                <!-- Input Form Section - Placed outside amp-list to prevent Gmail AMP Sanitizer DOM rejection -->
                <div class="form-container">
                    <form id="guess-form" method="POST" action-xhr="https://email-game.teamify.workers.dev/api/guess?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER"
                        on="submit-success:AMP.setState({ gameState: event.response, clueView: { activeClue: event.response.revealedCount } }),guess-form.clear,stateList.refresh,leaderboardList.refresh;
                            submit-error:AMP.setState({ gameState: event.response }),stateList.refresh">
                        
                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">

                        <div class="input-group">
                            <input type="text" name="user-guess" class="guess-input" placeholder="GUESS WORD"
                                required autocomplete="off">

                            <div class="action-buttons">
                                <button type="button" class="btn btn-hint" on="tap:hint-form.submit">
                                    Hint (-75pt)
                                </button>
                                <button type="submit" class="btn btn-primary">
                                    Submit Guess
                                </button>
                            </div>
                        </div>
                    </form>

                    <!-- Hidden Form for Letter Hint Button -->
                    <form id="hint-form" method="POST" action-xhr="https://email-game.teamify.workers.dev/api/hint?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER" hidden
                        on="submit-success:AMP.setState({ gameState: event.response }),stateList.refresh;
                            submit-error:AMP.setState({ gameState: event.response }),stateList.refresh">
                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">
                    </form>
                </div>
            </div>
        </div>

        <!-- 2. Organization Leaderboard Card -->
        <div class="card">
            <div class="card-title">
                Organization Leaderboard
            </div>
            
            <amp-list id="leaderboardList" width="auto" height="160" layout="fixed-height" src="https://email-game.teamify.workers.dev/api/leaderboard?domain=USER_DOMAIN_PLACEHOLDER&email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                <template type="amp-mustache">
                    <div class="leaderboard-container">
                        {{^hasWon}}
                        <div class="leaderboard-lock-banner">
                            Solve today's puzzle to reveal the leaderboard!
                        </div>
                        {{/hasWon}}

                        <div class="{{#hasWon}}leaderboard-items{{/hasWon}}{{^hasWon}}leaderboard-blur-content{{/hasWon}}">
                            {{#players}}
                            <div class="leaderboard-item">
                                <span class="rank-number">#{{rank}}</span>
                                <span class="player-email">{{displayEmail}}</span>
                                <span class="player-score">{{score}}</span>
                            </div>
                            {{/players}}
                            {{^players}}
                            <div style="text-align: center; color: #64748b; padding: 8px;">No scores recorded for this domain yet today!</div>
                            {{/players}}
                        </div>
                    </div>
                </template>
                <div placeholder>
                    <div class="leaderboard-container">
                        <div class="leaderboard-lock-banner">
                            Solve today's puzzle to reveal the leaderboard!
                        </div>
                        <div class="leaderboard-blur-content">
                            <div class="leaderboard-item">
                                <span class="rank-number">#1</span>
                                <span class="player-email">alex@company.com</span>
                                <span class="player-score">925 pts</span>
                            </div>
                            <div class="leaderboard-item">
                                <span class="rank-number">#2</span>
                                <span class="player-email">sarah@company.com</span>
                                <span class="player-score">850 pts</span>
                            </div>
                            <div class="leaderboard-item">
                                <span class="rank-number">#3</span>
                                <span class="player-email">david@company.com</span>
                                <span class="player-score">775 pts</span>
                            </div>
                        </div>
                    </div>
                </div>
            </amp-list>
        </div>

        <!-- 3. How to Play Card -->
        <div class="card how-to-play-section">
            <div class="card-title">How to Play</div>
            <div class="how-to-play-list">
                <div class="how-to-play-item">
                    <span class="how-to-play-step">1</span>
                    <div class="how-to-play-text"><strong>Guess the mystery word:</strong> Type your guess and submit directly in this email.</div>
                </div>
                <div class="how-to-play-item">
                    <span class="how-to-play-step">2</span>
                    <div class="how-to-play-text"><strong>Unlock more clues:</strong> Each incorrect guess reveals the next definition clue.</div>
                </div>
                <div class="how-to-play-item">
                    <span class="how-to-play-step">3</span>
                    <div class="how-to-play-text"><strong>Use letter hints:</strong> Click &ldquo;Hint (-75pt)&rdquo; to reveal a letter in the word.</div>
                </div>
                <div class="how-to-play-item">
                    <span class="how-to-play-step">4</span>
                    <div class="how-to-play-text"><strong>Climb the leaderboard:</strong> Solve today&apos;s word to unlock the organization rankings!</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            Word Game • Dynamic Interactive AMP for Email Game<br>
            <a class="account-link" href="https://email-game.teamify.workers.dev/account?token=default-dev-token">Manage Account & Preferences</a>
        </div>
    </div>
</body>

</html>`
