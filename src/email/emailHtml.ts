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
            background-color: #ffffff;
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
            background-color: #fef3c7;
            color: #000000;
            font-size: 15px;
            font-weight: 800;
            border-radius: 4px;
            border: none;
            text-align: center;
            box-sizing: border-box;
            margin-right: -4px;
            box-shadow: 0 1px 0 #fde68a, 0 2px 3px rgba(0, 0, 0, 0.25);
            position: relative;
        }

        .logo-tile:last-child {
            margin-right: 0;
        }

        .logo-tile:nth-child(odd),
        .logo-tile.tile-blue,
        .logo-tile.rotate-neg {
            background-color: #fef3c7;
            transform: rotate(-8deg);
        }

        .logo-tile:nth-child(even),
        .logo-tile.tile-red,
        .logo-tile.rotate-pos {
            background-color: #fef3c7;
            transform: rotate(8deg);
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
            background: #78350f;
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
            border: 3px double #d4d4d8;
            border-radius: 12px;
            margin-bottom: 22px;
            position: relative;
            box-sizing: border-box;
            background-color: #ffffff;
            padding-top: 20px;
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
            width: max-content;
            max-width: 100%;
            margin: 0 auto;
            gap: 6px;
            align-items: center;
            justify-content: center;
            position: relative;
            top: 11px;
            background: #ffffff;
            padding: 0 10px;
            border-radius: 12px;
            z-index: 2;
        }

        .clue-tab-btn {
            width: 22px;
            height: 22px;
            min-width: 22px;
            border-radius: 50%;
            padding: 0;
            background: #f4f4f5;
            border: none;
            font-size: 11px;
            font-weight: 700;
            color: #71717a;
            cursor: pointer;
            text-align: center;
            line-height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            box-shadow: 0 0 0 2px #ffffff;
        }

        .clue-tab-btn.unlocked {
            background: #f4f4f5;
            color: #18181b;
        }

        .clue-tab-btn.locked {
            color: #a1a1aa;
            background: #f4f4f5;
        }

        .clue-tab-btn.active {
            background: #fcd34d;
            color: #000000;
            opacity: 1;
        }

        .clue-tab-btn.locked.active {
            background: #d4d4d8;
            color: #3f3f46;
            opacity: 1;
        }

        .active-clue-card {
            padding: 8px 14px 8px 14px;
            min-height: 84px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .clue-content {
            width: 100%;
            text-align: center;
        }

        .clue-text {
            font-size: 16px;
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
            width: 40px;
            height: 40px;
            min-width: 40px;
            border-radius: 6px;
            padding: 0;
            background: #ffffff;
            border: 2px solid #d4d4d8;
            font-size: 20px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            line-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, Monaco, Consolas, monospace;
        }

        .mask-tile.tile-revealed {
            background: #ffffff;
            border-color: #a1a1aa;
            color: #52525b;
        }

        .mask-tile.tile-typed {
            background-color: #ffffff;
            border: 2px solid #000000;
            color: #000000;
            font-weight: 800;
            box-shadow: none;
        }

        /* Input Form Section */
        .form-container {
            margin-bottom: 0;
            position: relative;
        }

        .wordle-input-wrapper {
            position: relative;
            margin-top: -78px;
            margin-bottom: 7px;
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 5;
        }

        .hidden-guess-input {
            width: 360px;
            max-width: 100%;
            height: 40px;
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
            position: relative;
            z-index: 5;
            display: flex;
            justify-content: center;
            gap: 8px;
        }

        .btn {
            border: none;
            border-radius: 8px;
            padding: 6px 16px;
            font-size: 11px;
            font-weight: 700;
            cursor: pointer;
            text-align: center;
            line-height: 18px;
            font-family: inherit;
            white-space: nowrap;
        }

        .btn-primary {
            background: #fcd34d;
            color: #000000;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-primary:hover {
            background-color: #fbbf24;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .btn-primary:active {
            box-shadow: none;
            opacity: 0.9;
        }

        .btn-hint {
            background: #e4e4e7;
            color: #27272a;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-hint:hover {
            background-color: #dcdce0;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
        }

        .btn-hint:active {
            box-shadow: none;
            opacity: 0.9;
        }

        .btn:disabled,
        .btn[disabled],
        .btn-disabled {
            opacity: 0.5;
        }

        .btn-text-submitting {
            display: none;
        }

        form.amp-form-submitting .btn-primary {
            opacity: 0.6;
        }

        form.amp-form-submitting .btn-hint {
            opacity: 0.5;
        }

        form.amp-form-submitting .btn-text-default {
            display: none;
        }

        form.amp-form-submitting .btn-text-submitting {
            display: inline;
        }

        .message-banner-retry {
            cursor: pointer;
            text-decoration: underline;
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
            border: 1px solid transparent;
        }

        .stats-val {
            color: #52525b;
            font-weight: 800;
        }

        /* Play & Win State Containers */
        .play-state-container {
            position: relative;
            z-index: 1;
            height: 218px;
            box-sizing: border-box;
        }

        .win-state-container {
            position: relative;
            z-index: 20;
            height: 256px;
            background-color: #ffffff;
            display: flex;
            flex-direction: column;
            justify-content: center;
            gap: 10px;
            box-sizing: border-box;
        }

        .win-state-container[hidden],
        .play-state-container[hidden],
        .form-container[hidden],
        .how-to-play[hidden],
        .leaderboard-items[hidden],
        .leaderboard-lock-banner[hidden] {
            display: none;
        }

        .win-score-card {
            position: relative;
            overflow: hidden;
            border: 3px double #d4d4d8;
            border-radius: 12px;
            background-color: #ffffff;
            padding: 18px 16px;
            text-align: center;
            box-sizing: border-box;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            flex: 1;
        }

        .win-star {
            position: absolute;
            z-index: 1;
            line-height: 1;
            opacity: 0.85;
        }

        .win-star-1 {
            top: -12px;
            left: -10px;
            font-size: 34px;
            transform: rotate(-18deg);
        }

        .win-star-2 {
            top: 20px;
            left: 24px;
            font-size: 18px;
            transform: rotate(15deg);
            opacity: 0.75;
        }

        .win-star-3 {
            top: -12px;
            right: -8px;
            font-size: 32px;
            transform: rotate(22deg);
        }

        .win-star-4 {
            top: 42%;
            right: -12px;
            font-size: 32px;
            transform: rotate(-14deg);
        }

        .win-star-5 {
            bottom: -10px;
            left: 10%;
            font-size: 28px;
            transform: rotate(-12deg);
        }

        .win-star-6 {
            bottom: 18%;
            left: -10px;
            font-size: 26px;
            transform: rotate(-25deg);
            opacity: 0.85;
        }

        .win-star-7 {
            bottom: -12px;
            right: -8px;
            font-size: 32px;
            transform: rotate(-20deg);
        }

        .win-star-8 {
            bottom: 20px;
            right: 24px;
            font-size: 18px;
            transform: rotate(18deg);
            opacity: 0.75;
        }

        .win-star-9 {
            top: -12px;
            left: 22%;
            font-size: 26px;
            transform: rotate(10deg);
            opacity: 0.85;
        }

        .win-star-10 {
            top: 20px;
            right: 24px;
            font-size: 18px;
            transform: rotate(-16deg);
            opacity: 0.75;
        }

        .win-star-11 {
            top: -14px;
            left: 48%;
            font-size: 28px;
            transform: rotate(-14deg);
        }

        .win-star-12 {
            top: -10px;
            right: 22%;
            font-size: 25px;
            transform: rotate(18deg);
            opacity: 0.85;
        }

        .win-star-13 {
            top: 42%;
            left: -12px;
            font-size: 30px;
            transform: rotate(20deg);
        }

        .win-star-14 {
            bottom: -12px;
            left: 23%;
            font-size: 25px;
            transform: rotate(16deg);
            opacity: 0.85;
        }

        .win-star-15 {
            bottom: -13px;
            left: 50%;
            font-size: 28px;
            transform: rotate(-18deg);
        }

        .win-star-16 {
            bottom: -11px;
            right: 21%;
            font-size: 25px;
            transform: rotate(14deg);
            opacity: 0.85;
        }

        .win-star-17 {
            top: -10px;
            left: 10%;
            font-size: 23px;
            transform: rotate(24deg);
            opacity: 0.85;
        }

        .win-star-18 {
            top: -9px;
            left: 35%;
            font-size: 22px;
            transform: rotate(-22deg);
            opacity: 0.85;
        }

        .win-star-19 {
            top: -9px;
            left: 61%;
            font-size: 23px;
            transform: rotate(16deg);
            opacity: 0.85;
        }

        .win-star-20 {
            top: -11px;
            right: 10%;
            font-size: 24px;
            transform: rotate(-19deg);
            opacity: 0.85;
        }

        .win-star-21 {
            bottom: -12px;
            left: -10px;
            font-size: 30px;
            transform: rotate(20deg);
        }

        .win-star-22 {
            bottom: -9px;
            left: 37%;
            font-size: 22px;
            transform: rotate(-20deg);
            opacity: 0.85;
        }

        .win-star-23 {
            bottom: -9px;
            right: 34%;
            font-size: 22px;
            transform: rotate(22deg);
            opacity: 0.85;
        }

        .win-star-24 {
            bottom: -9px;
            right: 10%;
            font-size: 23px;
            transform: rotate(-15deg);
            opacity: 0.85;
        }

        .win-star-25 {
            top: 18%;
            left: -11px;
            font-size: 26px;
            transform: rotate(-15deg);
            opacity: 0.85;
        }

        .win-star-26 {
            top: 18%;
            right: -11px;
            font-size: 26px;
            transform: rotate(16deg);
            opacity: 0.85;
        }

        .win-star-27 {
            bottom: 18%;
            right: -10px;
            font-size: 26px;
            transform: rotate(24deg);
            opacity: 0.85;
        }

        .win-star-28 {
            bottom: 20px;
            left: 24px;
            font-size: 18px;
            transform: rotate(19deg);
            opacity: 0.75;
        }

        .win-congrats-title {
            position: relative;
            z-index: 2;
            font-size: 24px;
            font-weight: 900;
            color: #09090b;
            line-height: 1.2;
            letter-spacing: -0.4px;
            margin-bottom: 10px;
        }

        .win-score-pill {
            position: relative;
            z-index: 2;
            display: inline-flex;
            align-items: baseline;
            justify-content: center;
            gap: 4px;
            background-color: #fcd34d;
            color: #000000;
            padding: 6px 18px;
            border-radius: 999px;
            margin-bottom: 10px;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .win-score-number {
            font-size: 28px;
            font-weight: 900;
            line-height: 1.1;
            letter-spacing: -0.5px;
        }

        .win-score-unit {
            font-size: 14px;
            font-weight: 800;
            text-transform: uppercase;
        }

        .win-score-sub {
            position: relative;
            z-index: 2;
            font-size: 13px;
            font-weight: 500;
            color: #52525b;
            line-height: 1.3;
        }

        .share-card {
            margin: 0;
            padding: 0;
        }

        .share-card-text {
            display: block;
            width: 100%;
            box-sizing: border-box;
            padding: 6px 8px;
            margin: 0;
            background-color: #ffffff;
            border: 1px solid #d4d4d8;
            border-radius: 8px;
            outline: none;
            text-align: center;
            font-size: 11px;
            letter-spacing: -0.2px;
            font-weight: 600;
            color: #18181b;
            font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, Monaco, Consolas, monospace;
            line-height: 1.2;
        }

        /* Victory Card (Legacy) */
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
            background: #78350f;
            border: 1px solid #92400e;
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
            color: #fef3c7;
            margin-top: 1px;
            line-height: 1.2;
        }

        .btn-subscribe {
            background: #fcd34d;
            color: #000000;
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

        /* Leaderboard & How to Play */
        .leaderboard-container {
            position: relative;
            height: 180px;
            max-height: 180px;
            overflow: hidden;
            box-sizing: border-box;
        }

        .how-to-play,
        .leaderboard-items {
            padding: 4px 4px 0 4px;
            box-sizing: border-box;
        }

        .how-to-play-title,
        .leaderboard-title {
            font-size: 13px;
            font-weight: 800;
            color: #18181b;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 10px;
            text-align: center;
        }

        .how-to-play-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
        }

        .how-to-play-item {
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 12px;
            line-height: 1.35;
            color: #52525b;
            text-align: left;
        }

        .how-to-play-item strong {
            color: #18181b;
            font-weight: 700;
        }

        .how-to-play-bullet {
            width: 18px;
            height: 18px;
            min-width: 18px;
            border-radius: 50%;
            background-color: #fcd34d;
            color: #000000;
            font-size: 10.5px;
            font-weight: 800;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            line-height: 18px;
            flex-shrink: 0;
        }

        .leaderboard-blur-content {
            opacity: 0.15;
            filter: blur(4px);
            max-height: 180px;
            overflow: hidden;
        }

        .leaderboard-lock-banner {
            position: absolute;
            top: 50%;
            left: 12px;
            right: 12px;
            transform: translateY(-50%);
            background: rgba(255, 255, 255, 0.95);
            border: 1px solid #71717a;
            border-radius: 8px;
            padding: 8px 12px;
            color: #18181b;
            text-align: center;
            z-index: 10;
        }

        .leaderboard-lock-title {
            font-size: 11.5px;
            font-weight: 700;
            color: #18181b;
            line-height: 1.35;
            margin-bottom: 6px;
        }

        .leaderboard-lock-sub {
            font-size: 10.5px;
            font-weight: 500;
            color: #71717a;
            line-height: 1.45;
        }

        .leaderboard-lock-sub strong {
            font-weight: 700;
            color: #18181b;
        }

        .leaderboard-domain-tag,
        .leaderboard-pill {
            display: inline;
            background: #ffffff;
            border: 1px solid #d4d4d8;
            border-radius: 3px;
            padding: 0 4px 1px 4px;
            font-size: inherit;
            font-weight: 700;
            color: #18181b;
            box-shadow: 0 1px 1px rgba(0, 0, 0, 0.05);
            white-space: nowrap;
        }

        .leaderboard-pill-primary {
            background-color: #bfdbfe;
            border-color: #93c5fd;
            color: #000000;
        }

        .leaderboard-lock-hint {
            font-size: 10px;
            font-weight: 500;
            color: #71717a;
            margin-top: 5px;
            line-height: 1.45;
        }

        .leaderboard-lock-link {
            color: #18181b;
            text-decoration: underline;
            font-weight: 600;
        }

        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 4px 8px;
            font-size: 12px;
            border-radius: 6px;
        }

        .leaderboard-item.current-player {
            background-color: #bfdbfe;
        }

        .leaderboard-item.current-player .player-email {
            color: #27272a;
        }

        .leaderboard-item.current-player .player-score {
            color: #71717a;
        }

        .leaderboard-item.current-player .rank-number {
            color: #71717a;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 700;
            width: 24px;
            color: #71717a;
        }

        .player-email {
            flex: 1;
            font-weight: 600;
            color: #27272a;
        }

        .player-score {
            font-weight: 500;
            color: #71717a;
            font-size: 11px;
        }

        .streak-text {
            background-color: #ffffff;
            color: #ea580c;
            padding: 1px 4px;
            margin-right: 2px;
            border-radius: 3px;
            font-weight: 600;
        }

        .leaderboard-empty {
            text-align: center;
            color: #64748b;
            padding: 8px;
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

        /* Share with Friends Notice */
        .share-friends-text {
            font-size: 10.5px;
            font-weight: 400;
            line-height: 1.4;
            color: #71717a;
            text-align: center;
            margin-top: 10px;
            margin-bottom: 12px;
            padding: 0 8px;
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

        .footer-dot {
            display: inline-block;
            margin: 0 5px;
            font-size: 10px;
            line-height: 1;
            color: #a1a1aa;
            vertical-align: middle;
        }

        .footer-logo {
            margin-top: 10px;
            display: flex;
            justify-content: center;
            align-items: center;
        }

        /* Updates & News Announcement Box (Edge to edge horizontally) */
        .news-ticker-container {
            width: 100%;
            margin: 0 0 12px 0;
            padding: 0;
            box-sizing: border-box;
        }

        .news-ticker-box {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            width: 100%;
            padding: 7px 12px;
            background-color: #bfdbfe;
            border: none;
            border-radius: 6px;
            text-decoration: none;
            color: #000000;
            font-size: 12px;
            line-height: 1.3;
            box-sizing: border-box;
        }

        .news-ticker-content {
            display: flex;
            align-items: center;
            gap: 6px;
            min-width: 0;
            overflow: hidden;
            text-align: left;
        }

        .news-ticker-text {
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            color: #000000;
            font-weight: 700;
            font-size: 12px;
            text-align: left;
        }

        .news-ticker-tag {
            color: #000000;
            font-weight: 400;
        }

        .news-ticker-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background-color: #ffffff;
            border: none;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 700;
            color: #000000;
            line-height: 1.2;
            flex-shrink: 0;
            white-space: nowrap;
            cursor: pointer;
            text-decoration: none;
        }

        .news-ticker-btn:hover {
            background-color: #f4f4f5;
        }
    </style>
</head>

<body>
    <div class="email-wrapper">
        <!-- Updates / News Announcement Box -->
        <div class="news-ticker-container">
            <div class="news-ticker-box">
                <span class="news-ticker-content">
                    <span class="news-ticker-text">Custom leaderboards are here! Create, join, and play with friends</span>
                </span>
                <a href="https://inboxed.fun/updates" class="news-ticker-btn" target="_blank" aria-label="Updates: Custom leaderboards are here! Create, join, and play with friends">
                    Read more
                </a>
            </div>
        </div>

        <!--
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
        -->

        <!-- Dynamic State Store for interactive binding & hiding form on win -->
        <amp-state id="gameState">
            <script type="application/json">
                {
                    "hasWon": false,
                    "score": 0,
                    "winTitle": "",
                    "shareText": "",
                    "wordLength": 7,
                    "version": 0
                }
            </script>
        </amp-state>

        <!-- Form Submission State to prevent concurrent double-submits / hint clicks -->
        <amp-state id="uiState">
            <script type="application/json">
                {
                    "submitting": false
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


        <!-- 1. Main Game (State 1: Active Game | State 2: Congrats + Score + Share Card) -->
        <div class="game-section">
            <div class="game-body">
                <!-- Dynamic State Section - fetched fresh on every email open -->
                <amp-list id="stateList" width="auto" height="256" layout="fixed-height" diffable
                    src="https://inboxed.fun/api/state?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                    <template type="amp-mustache">
                        <div class="state-container">
                            {{#hasWon}}
                            <div class="win-state-container">
                                <div class="win-score-card">
                                    <span class="win-star win-star-1" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-2" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-3" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-4" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-5" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-6" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-7" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-8" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-9" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-10" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-11" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-12" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-13" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-14" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-15" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-16" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-17" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-18" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-19" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-20" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-21" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-22" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-23" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-24" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-25" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-26" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-27" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-28" aria-hidden="true">⭐</span>
                                    <div class="win-congrats-title" [text]="gameState.winTitle || '{{winTitle}}'">{{winTitle}}</div>
                                    <div class="win-score-pill">
                                        <span class="win-score-number">{{score}}</span>
                                        <span class="win-score-unit">pts</span>
                                    </div>
                                    <div class="win-score-sub">{{lastMessage}}</div>
                                </div>
                                <div class="share-card">
                                    <input type="text" readonly class="share-card-text" value="{{shareText}}" aria-label="Share score">
                                </div>
                            </div>
                            {{/hasWon}}
                            {{^hasWon}}
                            <div class="win-state-container" hidden [hidden]="!gameState.hasWon">
                                <div class="win-score-card">
                                    <span class="win-star win-star-1" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-2" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-3" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-4" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-5" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-6" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-7" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-8" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-9" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-10" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-11" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-12" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-13" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-14" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-15" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-16" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-17" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-18" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-19" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-20" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-21" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-22" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-23" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-24" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-25" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-26" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-27" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-28" aria-hidden="true">⭐</span>
                                    <div class="win-congrats-title" [text]="gameState.winTitle || (gameState.guessCount > 4 ? 'Close one!' : (gameState.guessCount > 2 ? 'Nicely done!' : 'You killed it!'))">{{winTitle}}</div>
                                    <div class="win-score-pill">
                                        <span class="win-score-number" [text]="gameState.score || '{{score}}'">{{score}}</span>
                                        <span class="win-score-unit">pts</span>
                                    </div>
                                    <div class="win-score-sub" [text]="gameState.lastMessage || '{{lastMessage}}'">{{lastMessage}}</div>
                                </div>
                                <div class="share-card">
                                    <input type="text" readonly class="share-card-text" value="{{shareText}}" [value]="gameState.shareText || '{{shareText}}'" aria-label="Share score">
                                </div>
                            </div>
                            <div class="play-state-container" [hidden]="gameState.hasWon">
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

                                <div class="message-banner {{#hasWon}}message-banner-win{{/hasWon}}"
                                    [class]="'message-banner' + (gameState.hasWon ? ' message-banner-win' : '')"
                                    [text]="gameState.lastMessage || '{{lastMessage}}'">{{lastMessage}}</div>

                                <div class="revealed-letters-section">
                                    <label for="guess-input" class="mask-grid" aria-label="Wordle Guess Tiles">
                                        {{#formattedLetterMask}}
                                        <span class="mask-tile {{#isRevealed}}tile-revealed{{/isRevealed}}"
                                            [class]="'mask-tile ' + ((typed.word || '').slice({{index}}, {{indexNext}}) ? 'tile-typed' : ((gameState.letterMask && gameState.letterMask[{{index}}] != '_') ? 'tile-revealed' : '{{#isRevealed}}tile-revealed{{/isRevealed}}'))"
                                            [text]="(typed.word || '').slice({{index}}, {{indexNext}}) || ((gameState.letterMask && gameState.letterMask[{{index}}] != '_') ? gameState.letterMask[{{index}}] : '{{char}}')">{{char}}</span>
                                        {{/formattedLetterMask}}
                                    </label>
                                </div>
                            </div>
                            {{/hasWon}}
                        </div>
                    </template>
                    <div placeholder>
                        <div class="state-container">
                            <div class="win-state-container" hidden [hidden]="!gameState.hasWon">
                                <div class="win-score-card">
                                    <span class="win-star win-star-1" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-2" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-3" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-4" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-5" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-6" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-7" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-8" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-9" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-10" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-11" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-12" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-13" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-14" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-15" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-16" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-17" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-18" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-19" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-20" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-21" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-22" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-23" aria-hidden="true">⭐</span>
                                    <span class="win-star win-star-24" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-25" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-26" aria-hidden="true">🎊</span>
                                    <span class="win-star win-star-27" aria-hidden="true">🎉</span>
                                    <span class="win-star win-star-28" aria-hidden="true">⭐</span>
                                    <div class="win-congrats-title" [text]="gameState.winTitle || (gameState.guessCount > 4 ? 'Close one!' : (gameState.guessCount > 2 ? 'Nicely done!' : 'You killed it!'))">You killed it!</div>
                                    <div class="win-score-pill">
                                        <span class="win-score-number" [text]="gameState.score || 0">0</span>
                                        <span class="win-score-unit">pts</span>
                                    </div>
                                    <div class="win-score-sub" [text]="gameState.lastMessage || 'Puzzle solved!'">Puzzle solved!</div>
                                </div>
                                <div class="share-card">
                                    <input type="text" readonly class="share-card-text" value="" [value]="gameState.shareText || ''" aria-label="Share score">
                                </div>
                            </div>
                            <div class="play-state-container" [hidden]="gameState.hasWon">
                                <div class="definitions-section">
                                    __PLACEHOLDER_DEFS__
                                </div>
                                <div class="message-banner" [text]="gameState.lastMessage || 'Guess the word!'">Guess the word!</div>
                                <div class="revealed-letters-section">
                                    <label for="guess-input" class="mask-grid" aria-label="Wordle Guess Tiles">
                                        __PLACEHOLDER_MASK_TILES__
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div fallback>
                        <div class="state-container">
                            <div class="play-state-container" [hidden]="gameState.hasWon">
                                <div class="definitions-section">
                                    __PLACEHOLDER_DEFS__
                                </div>
                                <div class="message-banner message-banner-retry" role="button" tabindex="0" on="tap:stateList.refresh" [text]="gameState.lastMessage || 'Connection issue &bull; Tap to reconnect'">Connection issue &bull; Tap to reconnect</div>
                                <div class="revealed-letters-section">
                                    <label for="guess-input" class="mask-grid" aria-label="Wordle Guess Tiles">
                                        __PLACEHOLDER_MASK_TILES__
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>
                </amp-list>

                <!-- Input Form Section - Placed outside amp-list to prevent Gmail AMP Sanitizer DOM rejection -->
                <div class="form-container" [hidden]="gameState.hasWon">
                    <form id="guess-form" method="POST"
                        action-xhr="https://inboxed.fun/api/guess?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER&domain=USER_DOMAIN_PLACEHOLDER"
                        on="submit:AMP.setState({ uiState: { submitting: true } });
                            submit-success:AMP.setState({ gameState: (!gameState.version || (event.response.version && event.response.version >= gameState.version)) ? event.response : gameState, clueView: { activeClue: event.response.hasWon ? (clueView.activeClue || 1) : event.response.revealedCount }, typed: { word: '' }, uiState: { submitting: false } }),guess-form.clear,stateList.refresh,leaderboardList.refresh;
                            submit-error:AMP.setState({ gameState: { lastMessage: (event.response && (event.response.lastMessage || event.response.error)) ? (event.response.lastMessage || event.response.error) : 'Connection issue — tap Submit Guess to try again.' }, uiState: { submitting: false } })">

                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">
                        <input type="hidden" name="date" value="USER_DATE_PLACEHOLDER">
                        <input type="hidden" name="domain" value="USER_DOMAIN_PLACEHOLDER">

                        <div class="wordle-input-wrapper">
                            <input type="text" id="guess-input" name="user-guess" class="hidden-guess-input"
                                placeholder=" " autocomplete="off" required aria-label="Enter word guess"
                                maxlength="7" [maxlength]="gameState.wordLength || 7"
                                on="input-throttled:AMP.setState({ typed: { word: event.value.toUpperCase().slice(0, gameState.wordLength || 7) } })">
                        </div>

                        <div class="action-buttons">
                            <button type="button" class="btn btn-hint"
                                [disabled]="uiState.submitting"
                                [class]="'btn btn-hint' + (uiState.submitting ? ' btn-disabled' : '')"
                                on="tap:AMP.setState({ uiState: { submitting: true } }),hint-form.submit">
                                Letter Hint
                            </button>
                            <button type="submit" class="btn btn-primary"
                                [disabled]="uiState.submitting"
                                [class]="'btn btn-primary' + (uiState.submitting ? ' btn-disabled' : '')">
                                <span class="btn-text-default">Submit Guess</span>
                                <span class="btn-text-submitting">Submitting...</span>
                            </button>
                        </div>
                    </form>

                    <!-- Hidden Form for Letter Hint Button -->
                    <form id="hint-form" method="POST"
                        action-xhr="https://inboxed.fun/api/hint?email=USER_EMAIL_PLACEHOLDER&date=USER_DATE_PLACEHOLDER"
                        hidden
                        on="submit-success:AMP.setState({ gameState: (!gameState.version || (event.response.version && event.response.version >= gameState.version)) ? event.response : gameState, uiState: { submitting: false } }),stateList.refresh;
                            submit-error:AMP.setState({ gameState: { lastMessage: (event.response && (event.response.lastMessage || event.response.error)) ? (event.response.lastMessage || event.response.error) : 'Connection issue — tap Letter Hint to try again.' }, uiState: { submitting: false } })">
                        <input type="hidden" name="email" value="USER_EMAIL_PLACEHOLDER">
                        <input type="hidden" name="date" value="USER_DATE_PLACEHOLDER">
                    </form>
                </div>
            </div>
        </div>

        <hr class="section-divider">

        <!-- 2. How to Play (State 1) / Organization Leaderboard (State 2) -->
        <div class="leaderboard-section">
            <amp-list id="leaderboardList" width="auto" height="180" layout="fixed-height" diffable
                src="https://inboxed.fun/api/leaderboard?domain=USER_DOMAIN_PLACEHOLDER&email=USER_EMAIL_PLACEHOLDER&puzzleId=USER_PUZZLE_ID_PLACEHOLDER&date=USER_DATE_PLACEHOLDER">
                <template type="amp-mustache">
                    <div class="leaderboard-container">
                        {{#hasWon}}
                        <div class="leaderboard-items">
                            <div class="leaderboard-title">{{leaderboardTitle}}</div>
                            {{#players}}
                            <div class="leaderboard-item {{#isCurrentPlayer}}current-player{{/isCurrentPlayer}}">
                                <span class="rank-number">#{{rank}}</span>
                                <span class="player-email">{{displayEmail}}</span>
                                <span class="player-score">{{#hasStreak}}<span class="streak-text">{{streakBadge}}</span> {{/hasStreak}}{{score}}</span>
                            </div>
                            {{/players}}
                            {{^players}}
                            <div class="leaderboard-empty">No scores recorded for
                                this domain yet today!</div>
                            {{/players}}
                        </div>
                        {{/hasWon}}
                        {{^hasWon}}
                        <div class="how-to-play" [hidden]="gameState.hasWon">
                            <div class="how-to-play-title">How to Play</div>
                            <div class="how-to-play-list">
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">1</span>
                                    <span class="how-to-play-text"><strong>Guess the word</strong> that matches the definition clue by typing in the tiles.</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">2</span>
                                    <span class="how-to-play-text"><strong>Misses unlock clues:</strong> Wrong guesses reveal the next definition (-100 pts, or -25 pts for synonyms).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">3</span>
                                    <span class="how-to-play-text"><strong>Use Letter Hints</strong> anytime to reveal the next missing letter (-150 pts).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">4</span>
                                    <span class="how-to-play-text"><strong>Compete &amp; rank:</strong> Currently playing in the <strong>USER_DOMAIN_PLACEHOLDER</strong> leaderboard.</span>
                                </div>
                            </div>
                        </div>
                        <div class="leaderboard-items" hidden [hidden]="!gameState.hasWon">
                            <div class="leaderboard-title">{{leaderboardTitle}}</div>
                            {{#players}}
                            <div class="leaderboard-item {{#isCurrentPlayer}}current-player{{/isCurrentPlayer}}">
                                <span class="rank-number">#{{rank}}</span>
                                <span class="player-email">{{displayEmail}}</span>
                                <span class="player-score">{{#hasStreak}}<span class="streak-text">{{streakBadge}}</span> {{/hasStreak}}{{score}}</span>
                            </div>
                            {{/players}}
                            {{^players}}
                            <div class="leaderboard-empty">No scores recorded for
                                this domain yet today!</div>
                            {{/players}}
                        </div>
                        {{/hasWon}}
                    </div>
                </template>
                <div placeholder>
                    <div class="leaderboard-container">
                        <div class="how-to-play" [hidden]="gameState.hasWon">
                            <div class="how-to-play-title">How to Play</div>
                            <div class="how-to-play-list">
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">1</span>
                                    <span class="how-to-play-text"><strong>Guess the word</strong> that matches the definition clue by typing in the tiles.</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">2</span>
                                    <span class="how-to-play-text"><strong>Misses unlock clues:</strong> Wrong guesses reveal the next definition (-100 pts, or -25 pts for synonyms).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">3</span>
                                    <span class="how-to-play-text"><strong>Use Letter Hints</strong> anytime to reveal the next missing letter (-150 pts).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">4</span>
                                    <span class="how-to-play-text"><strong>Compete &amp; rank:</strong> Currently playing in the <strong>USER_DOMAIN_PLACEHOLDER</strong> leaderboard.</span>
                                </div>
                            </div>
                        </div>
                        <div class="leaderboard-items" hidden [hidden]="!gameState.hasWon">
                            <div class="leaderboard-title">Global Leaderboard</div>
                            <div class="leaderboard-empty">Loading leaderboard...</div>
                        </div>
                    </div>
                </div>
                <div fallback>
                    <div class="leaderboard-container">
                        <div class="how-to-play" [hidden]="gameState.hasWon">
                            <div class="how-to-play-title">How to Play</div>
                            <div class="how-to-play-list">
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">1</span>
                                    <span class="how-to-play-text"><strong>Guess the word</strong> that matches the definition clue by typing in the tiles.</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">2</span>
                                    <span class="how-to-play-text"><strong>Misses unlock clues:</strong> Wrong guesses reveal the next definition (-100 pts, or -25 pts for synonyms).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">3</span>
                                    <span class="how-to-play-text"><strong>Use Letter Hints</strong> anytime to reveal the next missing letter (-150 pts).</span>
                                </div>
                                <div class="how-to-play-item">
                                    <span class="how-to-play-bullet">4</span>
                                    <span class="how-to-play-text"><strong>Compete &amp; rank:</strong> Currently playing in the <strong>USER_DOMAIN_PLACEHOLDER</strong> leaderboard.</span>
                                </div>
                            </div>
                        </div>
                        <div class="leaderboard-lock-banner message-banner-retry" hidden [hidden]="!gameState.hasWon" role="button" tabindex="0" on="tap:leaderboardList.refresh">
                            Connection issue &bull; Tap to load leaderboard
                        </div>
                    </div>
                </div>
            </amp-list>

            <div class="ticket-stub-divider" aria-hidden="true">
                <span class="stub-notch stub-notch-left"></span>
                <span class="stub-dashed-line"></span>
                <span class="stub-notch stub-notch-right"></span>
            </div>

            <div class="share-friends-text">
                Have someone you think would like this game? Forward this email to invite them!
            </div>
        </div>

        <hr class="section-divider">

        <!-- Footer -->
        <div class="footer">
            <div>
                <a class="account-link" href="https://inboxed.fun/account?token=default-dev-token">Manage Account & Preferences</a> <span class="footer-dot" aria-hidden="true">&bull;</span> <a class="account-link" href="https://forms.gle/o3rAMb56i7cL1T1n8" target="_blank">Give Feedback</a>
            </div>
            <div class="footer-logo">
                <a href="https://inboxed.fun" target="_blank">
                    <amp-img src="https://inboxed.fun/inboxed-fun.png" width="78" height="32" layout="fixed" alt="inboxed.fun"></amp-img>
                </a>
            </div>
        </div>
    </div>
</body>

</html>`;
