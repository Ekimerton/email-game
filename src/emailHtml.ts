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
        /* Josh Comeau's Modern CSS Reset (AMP4EMAIL Adapted) */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: #ffffff;
            color: #18181b;
            padding: 0;
            min-height: 100vh;
        }

        img,
        picture,
        video,
        canvas,
        svg {
            display: block;
            max-width: 100%;
        }

        input,
        button,
        textarea,
        select {
            font: inherit;
        }

        p,
        h1,
        h2,
        h3,
        h4,
        h5,
        h6 {
            overflow-wrap: break-word;
        }

        .email-wrapper {
            position: relative;
            z-index: 1;
            margin: 0 auto;
            max-width: 480px;
            padding: 0;
        }

        .game-section {
            position: relative;
            margin: 0 auto 16px auto;
            max-width: 480px;
        }

        .leaderboard-section {
            position: relative;
            margin: 8px auto 0 auto;
            max-width: 480px;
        }

        .section-divider {
            border: none;
            border-top: 1px solid #e4e4e7;
            margin: 0;
        }

        /* Top Logo Header */
        .game-header {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            margin: 0 0 6px 0;
            padding-bottom: 8px;
            text-align: center;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
        }

        .logo-tiles {
            display: inline-flex;
            align-items: center;
            padding: 2px 0;
        }

        .logo-tile {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            color: #000000;
            font-size: 15px;
            font-weight: 800;
            border-radius: 4px;
            border: 1.5px solid #000000;
            line-height: 28px;
            text-align: center;
            box-sizing: border-box;
            margin-right: -4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.25);
            position: relative;
        }

        .logo-tile:last-child {
            margin-right: 0;
        }

        .logo-tile:nth-child(odd),
        .logo-tile.tile-blue {
            background-color: #D8FFC5;
            transform: rotate(-10deg);
        }

        .logo-tile:nth-child(even),
        .logo-tile.tile-red {
            background-color: #C4F7CA;
            transform: rotate(10deg);
        }

        .logo-badge {
            display: inline-block;
            color: #000000;
            font-size: 18px;
            font-weight: 800;
            line-height: 28px;
            letter-spacing: -0.5px;
        }

        /* AMP List Layout Reset */
        amp-list {
            display: block;
            position: relative;
            margin: 0;
            padding: 0;
        }

        amp-list>[placeholder],
        amp-list>[role="list"],
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

        .domain-badge-compact {
            background: #14532d;
            color: #ffffff;
            padding: 2px 8px;
            border-radius: 6px;
            font-weight: 700;
            font-size: 11px;
            text-transform: lowercase;
        }

        .game-body {
            padding: 0;
        }

        /* Feedback Status Banner at Top */
        .message-banner {
            font-size: 12.5px;
            font-weight: 500;
            text-align: center;
            color: #52525b;
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            margin-top: 0;
            margin-bottom: 6px;
            padding: 0;
        }

        /* Definition Clue Stepper & Active Card */
        .definitions-section {
            margin-bottom: 22px;
        }

        .definitions-header,
        .letters-header {
            display: flex;
            align-items: center;
            gap: 8px;
            margin-bottom: 6px;
        }

        .section-label {
            font-size: 11px;
            font-weight: 700;
            color: #52525b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            text-align: left;
            height: 22px;
            line-height: 22px;
        }

        .definitions-header .section-label,
        .letters-header .section-label {
            margin-bottom: 0;
            display: inline-block;
        }

        .clue-tabs-bar {
            display: flex;
            gap: 5px;
            align-items: center;
            justify-content: center;
        }

        .clue-tab-btn {
            width: 22px;
            height: 22px;
            min-width: 22px;
            border-radius: 50%;
            padding: 0;
            background: #f4f4f5;
            border: 1px solid #d4d4d8;
            font-size: 11px;
            font-weight: 700;
            color: #71717a;
            cursor: pointer;
            text-align: center;
            line-height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
        }

        .clue-tab-btn.unlocked {
            background: #f4f4f5;
            color: #18181b;
            border-color: #a1a1aa;
        }

        .clue-tab-btn.locked {
            color: #a1a1aa;
            opacity: 0.5;
            background: #f4f4f5;
            border-color: #e4e4e7;
        }

        .clue-tab-btn.active {
            background: #C4F7CA;
            color: #000000;
            border-color: #000000;
            opacity: 1;
        }

        .clue-tab-btn.locked.active {
            background: #f4f4f5;
            color: #cacacf;
            color: rgba(161, 161, 170, 0.5);
            border-color: #000000;
            opacity: 1;
        }

        .active-clue-card {
            padding: 8px 14px;
            min-height: 72px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .clue-content {
            width: 100%;
            text-align: center;
        }

        .clue-text {
            font-size: 18px;
            font-weight: 500;
            color: #09090b;
            line-height: 1.4;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            text-align: center;
        }

        .clue-text.blurred {
            color: #a1a1aa;
            letter-spacing: 2px;
            font-family: ui-monospace, SFMono-Regular, monospace;
            font-size: 12px;
            font-weight: 500;
            text-align: center;
        }

        /* Status & Wordle Mask Tiles */
        .revealed-letters-section,
        .synonyms-section {
            margin-bottom: 0;
            position: relative;
        }

        .mask-grid {
            display: flex;
            gap: 4px;
            align-items: center;
            justify-content: center;
            cursor: pointer;
        }

        .mask-tile {
            width: 32px;
            height: 32px;
            min-width: 32px;
            border-radius: 4px;
            padding: 0;
            background: #ffffff;
            border: 1.5px solid #d4d4d8;
            font-size: 16px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            line-height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, Monaco, Consolas, monospace;
        }

        .mask-tile.tile-revealed {
            background: #ffffff;
            border-color: #000000;
            color: #52525b;
        }

        .mask-tile.tile-typed {
            background: #ffffff;
            border-color: #000000;
            color: #18181b;
            font-weight: 900;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        /* Green Focus Stars flanking input when focused */
        .focus-star {
            position: relative;
            height: 32px;
            width: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            text-align: center;
            opacity: 0;
            visibility: hidden;
            transition: opacity 0.15s ease;
        }

        .focus-star-left {
            margin-right: 4px;
        }

        .focus-star-right {
            margin-left: 4px;
        }

        .star-bg {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            color: #000000;
            font-size: 22px;
            line-height: 1;
            z-index: 1;
        }

        .star-fg {
            position: relative;
            color: #D8FFC5;
            font-size: 13px;
            line-height: 1;
            z-index: 2;
        }

        .game-body:focus-within .focus-star,
        .focus-star.is-active {
            opacity: 1;
            visibility: visible;
        }

        /* Input Form Section */
        .form-container {
            margin-bottom: 0;
            position: relative;
        }

        .wordle-input-wrapper {
            position: relative;
            margin-top: -32px;
            margin-bottom: 7px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5;
        }

        .hidden-guess-input {
            width: 360px;
            max-width: 100%;
            height: 32px;
            margin: 0 auto;
            background: transparent;
            border: none;
            outline: none;
            opacity: 0.001;
            color: transparent;
            caret-color: transparent;
            cursor: pointer;
            font-size: 16px;
            display: block;
        }

        .action-buttons {
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .btn {
            border: 1px solid transparent;
            border-radius: 8px;
            padding: 5px 16px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
            line-height: 18px;
            font-family: inherit;
            white-space: nowrap;
        }

        .btn-primary {
            background: #C4F7CA;
            color: #000000;
            border-color: #000000;
        }

        .btn-hint {
            background: #e4e4e7;
            color: #27272a;
            border-color: #d4d4d8;
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

        .leaderboard-card-title {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
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
            font-size: 12px;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 800;
            width: 20px;
            color: #30AFFF;
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

        /* Ticket Stub Divider */
        .ticket-stub-divider {
            display: none;
        }

        .stub-notch {
            display: none;
        }

        .stub-dashed-line {
            display: none;
        }

        /* Horizontal Ticket Component */
        .ticket-card {
            position: relative;
            display: flex;
            align-items: center;
            background: #FCE7F3;
            border: none;
            border-radius: 8px;
            margin-top: 14px;
            overflow: hidden;
            box-sizing: border-box;
        }

        .ticket-body {
            padding: 10px 14px;
            flex: 1;
        }

        .ticket-fine-text {
            font-size: 10.5px;
            font-weight: 600;
            line-height: 1.4;
            color: #831843;
        }

        .ticket-perforation {
            position: relative;
            align-self: stretch;
            display: flex;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            width: 0;
        }

        .ticket-dashed-line {
            display: block;
            width: 0;
            height: 100%;
            border-left: 2px dashed #ffffff;
            box-sizing: border-box;
        }

        .ticket-notch {
            position: absolute;
            width: 12px;
            height: 12px;
            background: #ffffff;
            border: none;
            border-radius: 50%;
            left: 50%;
            transform: translateX(-50%);
            box-sizing: border-box;
            z-index: 2;
        }

        .ticket-notch.notch-top {
            top: -6px;
        }

        .ticket-notch.notch-bottom {
            bottom: -6px;
        }

        .ticket-stub {
            background: #FCE7F3;
            padding: 10px 14px;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex-shrink: 0;
            text-align: center;
        }

        .stub-text {
            font-size: 10px;
            font-weight: 900;
            letter-spacing: 2px;
            color: #000000;
            text-transform: uppercase;
            white-space: nowrap;
            line-height: 1.2;
        }

        .stub-subtext {
            font-size: 8.5px;
            font-weight: 700;
            letter-spacing: 1px;
            color: #9d174d;
            margin-top: 2px;
        }

        /* Mini Tutorial (Clean inline single-line layout under logo) */
        .mini-tutorial {
            max-height: 40px;
            box-sizing: border-box;
            margin: 0;
            padding: 4px 0;
            text-align: center;
            font-size: 10.5px;
            line-height: 1.3;
            color: #52525b;
            overflow: hidden;
        }

        .mini-tutorial strong {
            color: #18181b;
            font-weight: 700;
        }

        .footer {
            padding: 8px 10px 16px;
            text-align: center;
            font-size: 11px;
            color: #71717a;
            font-weight: 500;
        }

        .account-link {
            color: #18181b;
            text-decoration: underline;
            margin-top: 4px;
            display: inline-block;
            font-weight: 700;
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <h4 class="game-header" aria-label="Inboxed">
            <span class="logo-tiles">
                <span class="logo-tile rotate-neg tile-blue">I</span>
                <span class="logo-tile rotate-pos tile-red">N</span>
                <span class="logo-tile rotate-neg tile-blue">B</span>
                <span class="logo-tile rotate-pos tile-red">O</span>
                <span class="logo-tile rotate-neg tile-blue">X</span>
                <span class="logo-tile rotate-pos tile-red">E</span>
                <span class="logo-tile rotate-neg tile-blue">D</span>
            </span>
        </h4>

        <!-- Dynamic State Store for interactive binding & hiding form on win -->
        <amp-state id="gameState">
            <script type="application/json">
                {
                    "hasWon": false,
                    "wordLength": 7
                }
            </script>
        </amp-state>

        <!-- Active Clue Selection State -->
        <amp-state id="clueView">
            <script type="application/json">
                {}
            </script>
        </amp-state>

        <!-- Live Typed Word State for Real-Time Wordle Tile Rendering -->
        <amp-state id="typed">
            <script type="application/json">
                {
                    "word": ""
                }
            </script>
        </amp-state>


        <!-- 1. Main Game -->
        <div class="game-section">
            <div class="game-body">
                <!-- Dynamic State Section - fetched fresh on every email open -->
                <amp-list id="stateList" width="auto" height="172" layout="fixed-height"
                    src="https://email-game.teamify.workers.dev/api/state?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                    <template type="amp-mustache">
                        <div class="state-container">
                            <div class="definitions-section">
                                <div class="active-clue-card">
                                    {{#definitions}}
                                    <div class="clue-content"
                                        [hidden]="(clueView.activeClue || {{revealedCount}}) != {{num}}">
                                        <div class="clue-text {{^isRevealed}}blurred{{/isRevealed}}"
                                            [class]="'clue-text' + ((gameState.revealedCount || {{revealedCount}}) >= {{num}} ? '' : ' blurred')">{{text}}</div>
                                    </div>
                                    {{/definitions}}
                                </div>
                                <div class="clue-tabs-bar">
                                    {{#definitions}}
                                    <button type="button"
                                        class="clue-tab-btn {{#isRevealed}}unlocked{{/isRevealed}}{{^isRevealed}}locked{{/isRevealed}} {{#isLatest}}active{{/isLatest}}"
                                        [class]="'clue-tab-btn ' + ((gameState.revealedCount || {{revealedCount}}) >= {{num}} ? 'unlocked' : 'locked') + ((clueView.activeClue || {{revealedCount}}) == {{num}} ? ' active' : '')"
                                        on="tap:AMP.setState({ clueView: { activeClue: {{num}} } })">
                                        {{num}}
                                    </button>
                                    {{/definitions}}
                                </div>
                            </div>

                            <div class="message-banner {{#hasWon}}message-banner-win{{/hasWon}}">{{lastMessage}}</div>

                            <div class="revealed-letters-section">
                                <label for="guess-input" class="mask-grid" aria-label="Wordle Guess Tiles">
                                    <span class="focus-star focus-star-left" [class]="'focus-star focus-star-left' + ((typed.word || '').length > 0 ? ' is-active' : '')"><span class="star-bg">★</span><span class="star-fg">★</span></span>
                                    {{#formattedLetterMask}}
                                    <span class="mask-tile {{#isRevealed}}tile-revealed{{/isRevealed}}"
                                        [class]="'mask-tile ' + ((typed.word || '').slice({{index}}, {{indexNext}}) ? 'tile-typed' : ('{{#isRevealed}}tile-revealed{{/isRevealed}}'))"
                                        [text]="(typed.word || '').slice({{index}}, {{indexNext}}) || '{{char}}'">{{char}}</span>
                                    {{/formattedLetterMask}}
                                    <span class="focus-star focus-star-right" [class]="'focus-star focus-star-right' + ((typed.word || '').length > 0 ? ' is-active' : '')"><span class="star-bg">★</span><span class="star-fg">★</span></span>
                                </label>
                            </div>
                        </div>
                    </template>
                    <div placeholder>
                        <div class="state-container">
                            <div class="definitions-section">
                                __PLACEHOLDER_DEFS__
                            </div>
                            <div class="message-banner">Guess the word!</div>
                            <div class="revealed-letters-section">
                                <label for="guess-input" class="mask-grid" aria-label="Wordle Guess Tiles">
                                    <span class="focus-star focus-star-left" [class]="'focus-star focus-star-left' + ((typed.word || '').length > 0 ? ' is-active' : '')"><span class="star-bg">★</span><span class="star-fg">★</span></span>
                                    __PLACEHOLDER_MASK_TILES__
                                    <span class="focus-star focus-star-right" [class]="'focus-star focus-star-right' + ((typed.word || '').length > 0 ? ' is-active' : '')"><span class="star-bg">★</span><span class="star-fg">★</span></span>
                                </label>
                            </div>
                        </div>
                    </div>
                </amp-list>

                <!-- Input Form Section - Placed outside amp-list to prevent Gmail AMP Sanitizer DOM rejection -->
                <div class="form-container">
                    <form id="guess-form" method="POST"
                        action-xhr="https://email-game.teamify.workers.dev/api/guess?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER"
                        on="submit-success:AMP.setState({ gameState: event.response, clueView: { activeClue: event.response.revealedCount }, typed: { word: '' } }),guess-form.clear,stateList.refresh,leaderboardList.refresh;
                            submit-error:AMP.setState({ gameState: event.response }),stateList.refresh">

                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">

                        <div class="wordle-input-wrapper">
                            <input type="text" id="guess-input" name="user-guess" class="hidden-guess-input"
                                placeholder=" " autocomplete="off" required aria-label="Enter word guess"
                                maxlength="7" [maxlength]="gameState.wordLength || 7"
                                on="input-throttled:AMP.setState({ typed: { word: event.value.toUpperCase().slice(0, gameState.wordLength || 7) } })">
                        </div>

                        <div class="action-buttons">
                            <button type="button" class="btn btn-hint" on="tap:hint-form.submit">
                                Letter Hint
                            </button>
                            <button type="submit" class="btn btn-primary">
                                Submit Guess
                            </button>
                        </div>
                    </form>

                    <!-- Hidden Form for Letter Hint Button -->
                    <form id="hint-form" method="POST"
                        action-xhr="https://email-game.teamify.workers.dev/api/hint?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER"
                        hidden on="submit-success:AMP.setState({ gameState: event.response }),stateList.refresh;
                            submit-error:AMP.setState({ gameState: event.response }),stateList.refresh">
                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">
                    </form>
                </div>
            </div>
        </div>

        <hr class="section-divider">

        <!-- Mini Tutorial / Instructions -->
        <div class="mini-tutorial">
            Misses unlock definitions &bull; Use Letter Hint for help &bull; Play within your email
        </div>

        <hr class="section-divider">

        <!-- 2. Organization Leaderboard -->
        <div class="leaderboard-section">
            <amp-list id="leaderboardList" width="auto" height="160" layout="fixed-height"
                src="https://email-game.teamify.workers.dev/api/leaderboard?domain=USER_DOMAIN_PLACEHOLDER&email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                <template type="amp-mustache">
                    <div class="leaderboard-container">
                        {{^hasWon}}
                        <div class="leaderboard-lock-banner">
                            Solve today's puzzle to reveal the leaderboard!
                        </div>
                        {{/hasWon}}

                        <div
                            class="{{#hasWon}}leaderboard-items{{/hasWon}}{{^hasWon}}leaderboard-blur-content{{/hasWon}}">
                            {{#players}}
                            <div class="leaderboard-item">
                                <span class="rank-number">#{{rank}}</span>
                                <span class="player-email">{{displayEmail}}</span>
                                <span class="player-score">{{score}}</span>
                            </div>
                            {{/players}}
                            {{^players}}
                            <div style="text-align: center; color: #64748b; padding: 8px;">No scores recorded for
                                this domain yet today!</div>
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

            <div class="ticket-stub-divider" aria-hidden="true">
                <span class="stub-notch stub-notch-left"></span>
                <span class="stub-dashed-line"></span>
                <span class="stub-notch stub-notch-right"></span>
            </div>

            <div class="ticket-card">
                <div class="ticket-body">
                    <div class="ticket-fine-text">
                        Have someone you think would like this game? Forward this email to them!
                    </div>
                </div>
                <div class="ticket-perforation">
                    <span class="ticket-notch notch-top"></span>
                    <span class="ticket-dashed-line"></span>
                    <span class="ticket-notch notch-bottom"></span>
                </div>
                <div class="ticket-stub">
                    <div class="stub-text">ADMIT ONE</div>
                    <div class="stub-subtext">Nº 04821</div>
                </div>
            </div>
        </div>

        <!-- Footer -->
        <div class="footer">
            <a class="account-link" href="https://email-game.teamify.workers.dev/account?token=default-dev-token">Manage
                Account & Preferences</a>
        </div>
    </div>
</body>

</html>`;
