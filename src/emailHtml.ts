export const EMAIL_HTML = `<!doctype html>
<html ⚡4email data-css-strict>

<head>
    <meta charset="utf-8">
    <script async src="https://cdn.ampproject.org/v0.js"></script>
    <script async custom-element="amp-form" src="https://cdn.ampproject.org/v0/amp-form-0.1.js"></script>
    <script async custom-element="amp-bind" src="https://cdn.ampproject.org/v0/amp-bind-0.1.js"></script>
    <script async custom-element="amp-list" src="https://cdn.ampproject.org/v0/amp-list-0.1.js"></script>
    <script async custom-template="amp-mustache" src="https://cdn.ampproject.org/v0/amp-mustache-0.2.js"></script>

    <style amp4email-boilerplate>
        body {
            visibility: hidden
        }
    </style>
    <style amp-custom>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            background-color: #0f172a;
            color: #f8fafc;
            line-height: 1.3;
            padding: 4px;
        }

        .email-container {
            margin: 0 auto;
            max-width: 480px;
            background: #1e293b;
            border-radius: 12px;
            border: 1px solid #334155;
            overflow: hidden;
            box-shadow: 0 8px 20px -5px rgba(0, 0, 0, 0.5);
        }

        /* Compact Top Bar */
        .game-header-compact {
            background: linear-gradient(135deg, #4f46e5, #7c3aed);
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }

        .header-title-compact {
            font-size: 18px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #ffffff;
            text-transform: uppercase;
        }

        .header-meta-compact {
            font-size: 11px;
            color: #e0e7ff;
            font-weight: 600;
            display: flex;
            gap: 8px;
            align-items: center;
        }

        .domain-badge-compact {
            background: rgba(0, 0, 0, 0.3);
            color: #a5b4fc;
            padding: 2px 6px;
            border-radius: 8px;
            font-weight: 700;
        }

        .game-body {
            padding: 10px;
        }

        /* Feedback Status Banner at Top */
        .message-banner {
            background: #334155;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            text-align: center;
            color: #f8fafc;
            margin-bottom: 8px;
        }

        /* Definition Cards at Top */
        .definitions-section {
            margin-bottom: 8px;
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: #94a3b8;
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
            background: #0f172a;
            border: 1px solid #334155;
            border-left: 3px solid #6366f1;
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 12px;
            font-weight: 600;
            color: #f1f5f9;
            line-height: 1.3;
            display: flex;
            align-items: baseline;
            gap: 6px;
        }

        .def-number {
            font-weight: 800;
            color: #818cf8;
            flex-shrink: 0;
        }

        .definition-text-blurred {
            filter: blur(6px);
            opacity: 0.8;
            display: inline-block;
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
            background: #0f172a;
            border: 2px solid #475569;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 18px;
            font-weight: 800;
            color: #fbbf24;
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
            background: #0f172a;
            border: 2px solid #6366f1;
            border-radius: 8px;
            padding: 8px 10px;
            font-size: 18px;
            font-weight: 800;
            color: #ffffff;
            text-transform: uppercase;
            letter-spacing: 4px;
            text-align: center;
        }

        .guess-input:focus {
            outline: none;
            border-color: #818cf8;
            box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.3);
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
            background: linear-gradient(135deg, #10b981, #059669);
            color: #ffffff;
        }

        .btn-hint {
            background: linear-gradient(135deg, #f59e0b, #d97706);
            color: #ffffff;
        }

        .btn:disabled {
            opacity: 0.5;
        }

        /* Stats Bar */
        .stats-bar {
            display: flex;
            justify-content: space-around;
            background: #0f172a;
            padding: 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #94a3b8;
            margin-bottom: 10px;
        }

        .stats-val {
            color: #38bdf8;
            font-weight: 800;
        }

        /* Victory Card */
        .win-card {
            background: linear-gradient(135deg, #065f46, #047857);
            border: 1px solid #10b981;
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
            color: #a7f3d0;
            font-weight: 700;
            margin-bottom: 6px;
        }

        .share-box {
            background: #064e3b;
            border: 1px dashed #34d399;
            border-radius: 6px;
            padding: 6px 8px;
            font-family: monospace;
            font-size: 11px;
            color: #ecfdf5;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-all;
        }

        /* Subscribe Banner Box */
        .subscribe-banner {
            background: linear-gradient(135deg, #1e1b4b, #312e81);
            border: 1px solid #6366f1;
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
            color: #c7d2fe;
            margin-top: 1px;
            line-height: 1.2;
        }

        .btn-subscribe {
            background: linear-gradient(135deg, #6366f1, #4f46e5);
            color: #ffffff;
            width: 100%;
        }

        /* Leaderboard */
        .leaderboard-section {
            background: #0f172a;
            border: 1px solid #334155;
            border-radius: 8px;
            padding: 10px;
            position: relative;
            margin-bottom: 10px;
        }

        .leaderboard-title {
            font-size: 12px;
            font-weight: 800;
            color: #38bdf8;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 6px;
            text-align: center;
        }

        .leaderboard-blur-content {
            filter: blur(6px);
        }

        .leaderboard-lock-banner {
            position: absolute;
            top: 55%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(15, 23, 42, 0.92);
            border: 1px solid #38bdf8;
            border-radius: 8px;
            padding: 8px 12px;
            color: #38bdf8;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            z-index: 10;
            width: 85%;
        }

        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 6px 8px;
            border-bottom: 1px solid #1e293b;
            font-size: 12px;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 800;
            width: 20px;
            color: #fbbf24;
        }

        .player-email {
            flex: 1;
            font-weight: 600;
            color: #cbd5e1;
        }

        .player-score {
            font-weight: 800;
            color: #10b981;
        }

        .footer {
            padding: 10px;
            text-align: center;
            font-size: 10px;
            color: #64748b;
            border-top: 1px solid #334155;
        }

        .account-link {
            color: #a5b4fc;
            text-decoration: underline;
            margin-top: 4px;
            display: inline-block;
            font-weight: 600;
        }
    </style>
</head>

<body>
    <amp-state id="gameState">
        <script type="application/json">
        {
            "puzzleId": "3",
            "date": "2026-08-03",
            "wordLength": 5,
            "allDefinitions": [
                "The natural agent that stimulates sight and makes things visible.",
                "Having a considerable or sufficient amount of natural brightness.",
                "Of little weight; not heavy.",
                "To ignite or cause something to begin burning.",
                "Gentle or delicate in motion or touch."
            ],
            "revealedDefinitions": ["The natural agent that stimulates sight and makes things visible."],
            "letterMask": ["_", "_", "_", "_", "_"],
            "guessesHistory": [],
            "guessCount": 0,
            "hintsUsed": 0,
            "score": 0,
            "hasWon": false,
            "lastMessage": "Guess the 5-letter word!",
            "currentInput": "",
            "isSubmitting": false,
            "userEmail": "player@company.com",
            "domain": "company.com",
            "leaderboard": [],
            "shareText": "",
            "revealedCount": 1,
            "totalDefinitions": 5,
            "isSubscribed": false,
            "userToken": "default-dev-token"
        }
        </script>
    </amp-state>

    <div class="email-container">
        <!-- Compact 1-Line Header -->
        <div class="game-header-compact">
            <h1 class="header-title-compact">RELATLE</h1>
            <div class="header-meta-compact">
                <span [text]="gameState.date">2026-08-03</span>
                <span class="domain-badge-compact" [text]="'🏢 ' + gameState.domain">🏢 company.com</span>
            </div>
        </div>

        <div class="game-body">
            <!-- 1-4. Puzzle Progress & Interactive Form Section (Loads via amp-list upon open) -->
            <amp-list width="auto" height="530" layout="fixed-height" single-item src="https://relatle.dev/api/state">
                <template type="amp-mustache">
                    <!-- 1. Revealed & Locked Definitions Cards at Top -->
                    <div class="definitions-section">
                        <div class="section-label">
                            <span>Revealed Definitions</span>
                            <span [text]="gameState.revealedCount + ' of ' + gameState.totalDefinitions">{{revealedCount}} of {{totalDefinitions}}</span>
                        </div>
                        <div class="definitions-cards">
                            <div class="definition-card" [hidden]="!gameState.allDefinitions[0]">
                                <span class="def-number">1.</span>
                                <span [class]="gameState.revealedCount > 0 ? '' : 'definition-text-blurred'" [text]="gameState.allDefinitions[0] || ''">{{def1}}</span>
                            </div>
                            <div class="definition-card" [hidden]="!gameState.allDefinitions[1]">
                                <span class="def-number">2.</span>
                                <span class="definition-text-blurred" [class]="gameState.revealedCount > 1 ? '' : 'definition-text-blurred'" [text]="gameState.allDefinitions[1] || ''">{{def2}}</span>
                            </div>
                            <div class="definition-card" [hidden]="!gameState.allDefinitions[2]">
                                <span class="def-number">3.</span>
                                <span class="definition-text-blurred" [class]="gameState.revealedCount > 2 ? '' : 'definition-text-blurred'" [text]="gameState.allDefinitions[2] || ''">{{def3}}</span>
                            </div>
                            <div class="definition-card" [hidden]="!gameState.allDefinitions[3]">
                                <span class="def-number">4.</span>
                                <span class="definition-text-blurred" [class]="gameState.revealedCount > 3 ? '' : 'definition-text-blurred'" [text]="gameState.allDefinitions[3] || ''">{{def4}}</span>
                            </div>
                            <div class="definition-card" [hidden]="!gameState.allDefinitions[4]">
                                <span class="def-number">5.</span>
                                <span class="definition-text-blurred" [class]="gameState.revealedCount > 4 ? '' : 'definition-text-blurred'" [text]="gameState.allDefinitions[4] || ''">{{def5}}</span>
                            </div>
                        </div>
                    </div>

                    <!-- 2. Word Letter Mask Tiles & Counter -->
                    <div class="synonyms-section">
                        <div class="section-label">
                            <span>Letter Hints & Word Length</span>
                            <span>Guesses: <span class="stats-val" [text]="gameState.guessCount">{{guessCount}}</span></span>
                        </div>
                        <div class="mask-grid">
                            <div class="mask-tile" [text]="gameState.letterMask[0] || '_'">{{mask0}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[1] || '_'">{{mask1}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[2] || '_'">{{mask2}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[3] || '_'">{{mask3}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[4] || '_'">{{mask4}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[5] || '_'" hidden [hidden]="gameState.wordLength < 6">{{mask5}}</div>
                            <div class="mask-tile" [text]="gameState.letterMask[6] || '_'" hidden [hidden]="gameState.wordLength < 7">{{mask6}}</div>
                        </div>
                    </div>

                    <!-- 3. Feedback Status Banner above Input -->
                    <div class="message-banner" [text]="gameState.lastMessage">{{lastMessage}}</div>

                    <!-- 4. Guess Input Form & Action Buttons -->
                    <div class="form-container" [hidden]="gameState.hasWon">
                        <form id="guess-form" method="POST" action-xhr="https://relatle.dev/api/guess"
                            on="submit-success:AMP.setState({ gameState: event.response });
                                submit-error:AMP.setState({ gameState: { lastMessage: event.response.lastMessage || '⚠️ Could not process guess. Please try again.', isSubmitting: false } });
                                submit:AMP.setState({ gameState: { isSubmitting: true } })">
                            
                            <input type="hidden" name="email" value="player@company.com" [value]="gameState.userEmail">

                            <div class="input-group">
                                <input type="text" name="user-guess" class="guess-input" placeholder="GUESS WORD"
                                    required autocomplete="off" [value]="gameState.currentInput"
                                    on="input-debounced:AMP.setState({ gameState: { currentInput: event.value.toUpperCase() } })">

                                <div class="action-buttons">
                                    <button type="submit" class="btn btn-primary" [disabled]="gameState.isSubmitting">
                                        <span [hidden]="gameState.isSubmitting">Submit Guess</span>
                                        <span hidden [hidden]="!gameState.isSubmitting">Submitting...</span>
                                    </button>
                                    <button type="button" class="btn btn-hint" [disabled]="gameState.hasWon"
                                        on="tap:hint-form.submit">
                                        💡 Hint (-75pt)
                                    </button>
                                </div>
                            </div>
                        </form>

                        <!-- Hidden Form for Letter Hint Button -->
                        <form id="hint-form" method="POST" action-xhr="https://relatle.dev/api/hint" hidden
                            on="submit-success:AMP.setState({ gameState: event.response });
                                submit-error:AMP.setState({ gameState: { lastMessage: event.response.message || '⚠️ Could not process hint request. Please try again.' } })">
                            <input type="hidden" name="email" value="player@company.com" [value]="gameState.userEmail">
                        </form>
                    </div>

                    <!-- Win Victory & Share Section -->
                    <div class="win-card" hidden [hidden]="!gameState.hasWon">
                        <div class="win-title">🏆 YOU WON!</div>
                        <div class="win-score" [text]="'Final Score: ' + gameState.score + ' Points!'">Final Score: {{score}} Points!</div>
                        <p style="font-size: 12px; color: #d1fae5; margin-bottom: 6px;">Share your score with your organization:</p>
                        <div class="share-box" [text]="gameState.shareText">{{shareText}}</div>
                    </div>
                </template>
            </amp-list>

            <!-- Organization Leaderboard -->
            <div class="leaderboard-section">
                <div class="leaderboard-title" [text]="'🏆 ' + gameState.domain + ' Leaderboard'">
                    🏆 Organization Leaderboard
                </div>

                <!-- Lock Banner overlay when game is NOT won -->
                <div class="leaderboard-lock-banner" [hidden]="gameState.hasWon">
                    🔒 Solve today's puzzle to reveal the leaderboard!
                </div>
                
                <!-- AMP List for Dynamic Domain Leaderboard (Blurred until won) -->
                <div class="leaderboard-blur-content" [class]="gameState.hasWon ? '' : 'leaderboard-blur-content'">
                    <amp-list width="auto" height="150" layout="fixed-height" src="https://relatle.dev/api/leaderboard">
                        <template type="amp-mustache">
                            <div class="leaderboard-item">
                                <span class="rank-number">#{{rank}}</span>
                                <span class="player-email">{{displayEmail}}</span>
                                <span class="player-score">{{score}}</span>
                            </div>
                        </template>
                        <div placeholder style="text-align: center; color: #64748b; padding: 8px;">Loading leaderboard...</div>
                        <div fallback style="text-align: center; color: #64748b; padding: 8px;">No scores recorded for this domain yet today!</div>
                    </amp-list>
                </div>
            </div>

            <!-- Compact Subscribe Banner Box (Loads via amp-list upon open, hides when subscribed) -->
            <amp-list width="auto" height="125" layout="fixed-height" single-item src="https://relatle.dev/api/sub-status" [hidden]="gameState.isSubscribed">
                <template type="amp-mustache">
                    {{^isSubscribed}}
                    <div class="subscribe-banner" [hidden]="gameState.isSubscribed">
                        <div class="subscribe-header">
                            <span class="subscribe-icon">📬</span>
                            <div>
                                <div class="subscribe-title">Get Relatle Daily at 9:00 AM PST</div>
                                <div class="subscribe-desc">Never miss today's puzzle! Join your organization's leaderboard.</div>
                            </div>
                        </div>
                        <form method="POST" action-xhr="https://relatle.dev/api/subscribe" style="margin-top: 6px;"
                            on="submit-success:AMP.setState({ gameState: { isSubscribed: true, lastMessage: event.response.message } });
                                submit-error:AMP.setState({ gameState: { lastMessage: event.response.message || '⚠️ Subscription failed.' } })">
                            <input type="hidden" name="email" value="player@company.com" [value]="gameState.userEmail">
                            <button type="submit" class="btn btn-subscribe">
                                ✨ Subscribe Me Daily
                            </button>
                        </form>
                    </div>
                    {{/isSubscribed}}
                </template>
                <div placeholder style="text-align: center; color: #64748b; padding: 8px;">Loading subscription status...</div>
            </amp-list>
        </div>

        <div class="footer">
            Relatle • Dynamic Interactive AMP for Email Game<br>
            <a class="account-link" href="https://relatle.dev/account?token=default-dev-token">⚙️ Manage Account & Preferences</a>
        </div>
    </div>
</body>

</html>`
