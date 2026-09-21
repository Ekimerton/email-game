import type { EmailTheme } from '../core'
export type { EmailTheme }

export const DARK_THEME_CSS = `
        /* Josh Comeau's Modern CSS Reset (AMP4EMAIL Adapted - Dark Mode) */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: #121212;
            color: #f4f4f5;
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
            background-color: #121212;
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
            border-top: 1px solid #27272a;
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
            text-align: center;
            box-sizing: border-box;
            margin-right: -4px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.4);
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
            color: #ffffff;
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
            color: #dcfce7;
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
            color: #a1a1aa;
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            margin-top: 0;
            margin-bottom: 6px;
            padding: 0;
        }

        /* Definition Clue Stepper & Active Card */
        .definitions-section {
            border-radius: 12px;
            margin-bottom: 22px;
            position: relative;
            box-sizing: border-box;
            background-color: #18181b;
            background-image:
                radial-gradient(circle at center, #3f3f46 1px, transparent 1.2px),
                radial-gradient(circle at center, #3f3f46 1px, transparent 1.2px),
                radial-gradient(circle at center, #3f3f46 1px, transparent 1.2px),
                radial-gradient(circle at center, #3f3f46 1px, transparent 1.2px);
            background-position: top left, bottom left, top left, top right;
            background-size: 7px 2px, 7px 2px, 2px 7px, 2px 7px;
            background-repeat: repeat-x, repeat-x, repeat-y, repeat-y;
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
            color: #a1a1aa;
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
            background: #18181b;
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
            background: #27272a;
            border: 1px solid #3f3f46;
            font-size: 11px;
            font-weight: 700;
            color: #a1a1aa;
            cursor: pointer;
            text-align: center;
            line-height: 20px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            box-shadow: 0 0 0 2px #18181b;
        }

        .clue-tab-btn.unlocked {
            background: #27272a;
            color: #f4f4f5;
            border-color: #71717a;
        }

        .clue-tab-btn.locked {
            color: #52525b;
            background: #1c1c1f;
            border-color: #27272a;
        }

        .clue-tab-btn.active {
            background: #C4F7CA;
            color: #000000;
            border-color: #ffffff;
            opacity: 1;
        }

        .clue-tab-btn.locked.active {
            background: #27272a;
            color: rgba(161, 161, 170, 0.4);
            border-color: #71717a;
            opacity: 1;
        }

        .active-clue-card {
            padding: 8px 14px 8px 14px;
            min-height: 76px;
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
            color: #f4f4f5;
            line-height: 1.4;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            text-align: center;
        }

        .clue-text.blurred {
            color: #52525b;
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
            background: #18181b;
            border: 1.5px solid #3f3f46;
            font-size: 16px;
            font-weight: 800;
            color: #f4f4f5;
            text-transform: uppercase;
            line-height: 32px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, Monaco, Consolas, monospace;
        }

        .mask-tile.tile-revealed {
            background: #27272a;
            border-color: #52525b;
            color: #a1a1aa;
        }

        .mask-tile.tile-typed {
            background: #27272a;
            border-color: #C4F7CA;
            color: #ffffff;
            font-weight: 900;
            box-shadow: 0 1px 4px rgba(0, 0, 0, 0.4);
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
            border: 1.5px solid transparent;
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
            border-color: #7ecc84;
            box-shadow: inset 0 2px 0 0 #dafcdb, 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .btn-primary:hover {
            background-color: #bbf4c3;
            border-color: #76c87c;
            box-shadow: inset 0 2px 0 0 #d1f7d5, 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .btn-primary:active {
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .btn-hint {
            background: #27272a;
            color: #f4f4f5;
            border-color: #3f3f46;
            box-shadow: inset 0 2px 0 0 #3f3f46, 0 1px 2px rgba(0, 0, 0, 0.2);
        }

        .btn-hint:hover {
            background-color: #323238;
            border-color: #52525b;
            box-shadow: inset 0 2px 0 0 #3f3f46, 0 2px 4px rgba(0, 0, 0, 0.3);
        }

        .btn-hint:active {
            box-shadow: inset 0 1px 2px rgba(0, 0, 0, 0.3);
        }

        .btn:disabled {
            opacity: 0.5;
        }

        /* Stats Bar */
        .stats-bar {
            display: flex;
            justify-content: space-around;
            background: #18181b;
            padding: 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: #a1a1aa;
            margin-bottom: 10px;
            border: 1px solid #27272a;
        }

        .stats-val {
            color: #f4f4f5;
            font-weight: 800;
        }

        /* Victory Card */
        .win-card {
            background: #18181b;
            border: 1px solid #3f3f46;
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
            border: 1px solid #3f3f46;
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
            color: #f4f4f5;
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
        .leaderboard-container {
            position: relative;
            height: 160px;
            max-height: 160px;
            overflow: hidden;
            box-sizing: border-box;
        }

        .leaderboard-blur-content {
            opacity: 0.15;
            filter: blur(4px);
            max-height: 160px;
            overflow: hidden;
        }

        .leaderboard-lock-banner {
            position: absolute;
            top: 50%;
            left: 12px;
            right: 12px;
            transform: translateY(-50%);
            background: rgba(24, 24, 27, 0.95);
            border: 1px solid #3f3f46;
            border-radius: 8px;
            padding: 6px 12px;
            color: #f4f4f5;
            font-size: 11px;
            font-weight: 700;
            text-align: center;
            z-index: 10;
        }

        .leaderboard-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 5px 8px;
            font-size: 12px;
            border-radius: 6px;
        }

        .leaderboard-item.current-player {
            background-color: #14532d;
        }

        .leaderboard-item.current-player .player-email {
            color: #dcfce7;
        }

        .leaderboard-item.current-player .player-score {
            color: #86efac;
        }

        .leaderboard-item.current-player .rank-number {
            color: #86efac;
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 700;
            width: 24px;
            color: #a1a1aa;
        }

        .player-email {
            flex: 1;
            font-weight: 600;
            color: #f4f4f5;
        }

        .player-score {
            font-weight: 500;
            color: #a1a1aa;
            font-size: 11px;
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
            color: #a1a1aa;
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
            color: #a1a1aa;
            overflow: hidden;
        }

        .mini-tutorial strong {
            color: #f4f4f5;
            font-weight: 700;
        }

        .footer {
            padding: 8px 10px 16px;
            text-align: center;
            font-size: 11px;
            color: #a1a1aa;
            font-weight: 500;
        }

        .account-link {
            color: #C4F7CA;
            text-decoration: underline;
            margin-top: 4px;
            display: inline-block;
            font-weight: 700;
        }
`

/**
 * Inlines either Light or Dark CSS into the AMP email HTML template.
 * For 'dark', the <style amp-custom> block is replaced with DARK_THEME_CSS.
 * For 'light' (or default), the original light CSS is retained.
 */
export function applyEmailTheme(ampHtml: string, theme: EmailTheme = 'light'): string {
  if (theme === 'dark') {
    return ampHtml.replace(
      /<style amp-custom>[\s\S]*?<\/style>/i,
      `<style amp-custom>${DARK_THEME_CSS}    </style>`
    )
  }
  return ampHtml
}
