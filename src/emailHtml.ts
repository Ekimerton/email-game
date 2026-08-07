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
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #27272a;
            color: #18181b;
            line-height: 1.3;
            padding: 4px;
        }

        .email-container {
            margin: 0 auto;
            max-width: 480px;
            background: #ffffff;
            border-radius: 12px;
            border: none;
            overflow: hidden;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        /* Compact Top Bar */
        .game-header-compact {
            background: #000000;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-left-compact {
            display: flex;
            align-items: center;
            gap: 8px;
        }

        .header-title-compact {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-transform: uppercase;
        }

        .domain-badge-compact {
            background: #27272a;
            color: #ffffff;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 700;
            font-size: 11px;
        }

        .header-date-compact {
            font-size: 11px;
            color: #a1a1aa;
            font-weight: 600;
        }

        .game-body {
            padding: 10px;
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
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
            margin-top: 16px;
            margin-bottom: 8px;
        }

        .message-banner-win {
            background: #f4f4f5;
            border: 1px solid #18181b;
            color: #18181b;
        }

        /* Definition Cards at Top */
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

        .definitions-cards {
            display: flex;
            flex-direction: column;
            gap: 4px;
        }

        .definition-card {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            color: #18181b;
            line-height: 1.3;
            display: flex;
            align-items: baseline;
            gap: 6px;
            font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
        }

        .def-number {
            font-weight: 800;
            color: #2563eb;
            flex-shrink: 0;
        }

        .definition-text-blurred {
            color: #a1a1aa;
            letter-spacing: 1px;
            opacity: 0.7;
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
            border: 2px solid #d4d4d8;
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
            margin-bottom: 10px;
        }

        .input-group {
            display: flex;
            flex-direction: column;
            gap: 6px;
        }

        .guess-input {
            width: 100%;
            background: #ffffff;
            border: 2px solid #18181b;
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
            border-color: #18181b;
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

        /* Leaderboard */
        .leaderboard-section {
            background: #f4f4f5;
            border: 1px solid #e4e4e7;
            border-radius: 8px;
            padding: 10px;
            position: relative;
            margin-top: 16px;
            margin-bottom: 10px;
        }

        .leaderboard-title {
            font-size: 12px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            text-align: center;
        }

        .leaderboard-blur-content {
            opacity: 0.15;
            filter: blur(4px);
        }

        .leaderboard-lock-banner {
            position: absolute;
            top: 40px;
            left: 10px;
            right: 10px;
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
            border-bottom: 1px solid #e4e4e7;
            font-size: 12px;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 800;
            width: 20px;
            color: #18181b;
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

        .footer {
            padding: 10px;
            text-align: center;
            font-size: 10px;
            color: #71717a;
            border-top: 1px solid #e4e4e7;
        }

        .account-link {
            color: #18181b;
            text-decoration: underline;
            margin-top: 4px;
            display: inline-block;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <div class="email-container">
        <!-- Compact 1-Line Header -->
        <div class="game-header-compact">
            <div class="header-left-compact">
                <h1 class="header-title-compact">UNTITLED WORD GAME</h1>
                <span class="domain-badge-compact">company.com</span>
            </div>
            <span class="header-date-compact">Aug 5, 2026</span>
        </div>

        <div class="game-body">
            <!-- Dynamic State Store for interactive binding & hiding form on win -->
            <amp-state id="gameState">
                <script type="application/json">
                    {
                        "hasWon": false
                    }
                </script>
            </amp-state>

            <!-- Dynamic State Section - fetched fresh on every email open -->
            <amp-list id="stateList" width="auto" height="380" layout="fixed-height"
                src="https://email-game.teamify.workers.dev/api/state?email=USER_EMAIL_PLACEHOLDER&amp;date=USER_DATE_PLACEHOLDER">
                <template type="amp-mustache">
                    <div class="definitions-section">
                        <div class="section-label">
                            <span>Revealed Definitions</span>
                            <span>{{revealedCount}} of {{totalDefinitions}}</span>
                        </div>
                        <div class="definitions-cards">
                            {{#definitions}}
                            <div class="definition-card">
                                <span class="def-number">{{num}}.</span>
                                <span>{{text}}</span>
                            </div>
                            {{/definitions}}
                        </div>
                    </div>

                    <div class="synonyms-section">
                        <div class="section-label">
                            <span>Letter Hints & Word Length</span>
                            <span>Guesses: <span class="stats-val">{{guessCount}}</span></span>
                        </div>
                        <div class="mask-grid">
                            {{#letterMask}}
                            <div class="mask-tile">{{.}}</div>
                            {{/letterMask}}
                        </div>
                    </div>

                    <div class="message-banner {{#hasWon}}message-banner-win{{/hasWon}}">{{lastMessage}}</div>
                </template>
                <div placeholder>
                    <div class="definitions-section">
                        <div class="section-label">
                            <span>Revealed Definitions</span>
                            <span>1 of 5</span>
                        </div>
                        <div class="definitions-cards">
                            __PLACEHOLDER_DEFS__
                        </div>
                    </div>
                    <div class="synonyms-section">
                        <div class="section-label">
                            <span>Letter Hints & Word Length</span>
                            <span>Guesses: <span class="stats-val">0</span></span>
                        </div>
                        <div class="mask-grid">
                            __PLACEHOLDER_MASK_TILES__
                        </div>
                    </div>
                    <div class="message-banner">Guess the word!</div>
                </div>
            </amp-list>

            <!-- Input Form Section - Placed outside amp-list to prevent Gmail AMP Sanitizer DOM rejection -->
            <div class="form-container">
                <form id="guess-form" method="POST" action-xhr="https://email-game.teamify.workers.dev/api/guess?email=USER_EMAIL_PLACEHOLDER&amp;date=USER_DATE_PLACEHOLDER"
                    on="submit-success:AMP.setState({ gameState: event.response }),guess-form.clear,stateList.refresh,leaderboardList.refresh;
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
                <form id="hint-form" method="POST" action-xhr="https://email-game.teamify.workers.dev/api/hint?email=USER_EMAIL_PLACEHOLDER&amp;date=USER_DATE_PLACEHOLDER" hidden
                    on="submit-success:AMP.setState({ gameState: event.response }),stateList.refresh;
                        submit-error:AMP.setState({ gameState: event.response }),stateList.refresh">
                    <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">
                </form>
            </div>

            <!-- Organization Leaderboard -->
            <div class="leaderboard-section">
                <div class="leaderboard-title">
                    Organization Leaderboard
                </div>
                
                <amp-list id="leaderboardList" width="auto" height="160" layout="fixed-height" src="https://email-game.teamify.workers.dev/api/leaderboard?domain=USER_DOMAIN_PLACEHOLDER&amp;email=USER_EMAIL_PLACEHOLDER&amp;date=USER_DATE_PLACEHOLDER">
                    <template type="amp-mustache">
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
                    </template>
                    <div placeholder>
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
                </amp-list>
            </div>
        </div>

        <div class="footer">
            Untitled Word Game • Dynamic Interactive AMP for Email Game<br>
            <a class="account-link" href="https://email-game.teamify.workers.dev/account?token=default-dev-token">Manage Account & Preferences</a>
        </div>
    </div>
</body>

</html>`
