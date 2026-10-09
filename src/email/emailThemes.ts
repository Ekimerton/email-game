import type { EmailTheme } from '../core'
import { parseColorCombo, TAILWIND_PALETTES, type TailwindShade } from '../core'
export type { EmailTheme }

/**
 * Light theme CSS variables definition.
 * Consolidates all colors for the standard light mode experience.
 */
export const LIGHT_THEME_VARS = `
        :root {
            /* Black & White */
            --color-white: #ffffff;
            --color-black: #000000;
            --color-surface: #ffffff;

            /* Tailwind Amber Scale (Game Accent Palette) */
            --color-amber-50: #fffbeb;
            --color-amber-100: #fef3c7;
            --color-amber-200: #fde68a;
            --color-amber-300: #fcd34d;   /* Primary Button, Active Clue Tab, Logo Tile, CTA Button */
            --color-amber-400: #fbbf24;
            --color-amber-500: #f59e0b;
            --color-amber-600: #d97706;
            --color-amber-700: #b45309;
            --color-amber-800: #92400e;
            --color-amber-900: #78350f;
            --color-amber-950: #451a03;

            /* Tailwind Yellow */
            --color-yellow-950: #422006;

            /* Tailwind Blue Scale */
            --color-blue-200: #bfdbfe;
            --color-blue-300: #93c5fd;
            --color-blue-400: #60a5fa;
            --color-blue-500: #3b82f6;

            /* Tailwind Zinc Scale */
            --color-zinc-50: #fafafa;
            --color-zinc-100: #f4f4f5;
            --color-zinc-150: #f4f4f6;
            --color-zinc-200: #e4e4e7;
            --color-zinc-225: #e9e9ec;
            --color-zinc-250: #dcdce0;
            --color-zinc-300: #d4d4d8;
            --color-zinc-350: #cacacf;
            --color-zinc-400: #a1a1aa;
            --color-zinc-450: #8e8e96;
            --color-zinc-500: #71717a;
            --color-zinc-600: #52525b;
            --color-zinc-700: #3f3f46;
            --color-zinc-800: #27272a;
            --color-zinc-900: #18181b;
            --color-zinc-950: #09090b;

            /* Tailwind Slate */
            --color-slate-500: #64748b;

            /* Shadows & Alpha Transparency */
            --color-shadow-sm: rgba(0, 0, 0, 0.05);
            --color-shadow-md: rgba(0, 0, 0, 0.08);
            --color-shadow-inset: rgba(0, 0, 0, 0.06);
            --color-tile-shadow: rgba(0, 0, 0, 0.25);
            --color-mask-shadow: rgba(0, 0, 0, 0.1);
            --color-overlay-bg: rgba(255, 255, 255, 0.95);
            --color-tab-locked-faint: rgba(161, 161, 170, 0.5);
        }
`

/**
 * Dark theme CSS variables definition.
 * Consolidates all colors for the dark mode experience.
 */
export const DARK_THEME_VARS = `
        :root {
            /* Black & White */
            --color-white: #121212;                 /* Inverted page bg in dark mode */
            --color-black: #ffffff;                 /* Inverted black elements in dark mode */
            --color-surface: #18181b;               /* Dark card surface (definitions card, etc.) */

            /* Tailwind Amber Scale (Game Accent Palette) */
            --color-amber-50: #fffbeb;
            --color-amber-100: #fef3c7;             /* Cream amber for text and button */
            --color-amber-200: #fde68a;
            --color-amber-300: #fcd34d;             /* Main Accent: Button, Active Tab, Logo, CTA */
            --color-amber-400: #fbbf24;
            --color-amber-500: #f59e0b;
            --color-amber-600: #d97706;
            --color-amber-700: #b45309;
            --color-amber-800: #92400e;
            --color-amber-900: #78350f;
            --color-amber-950: #451a03;

            /* Tailwind Yellow */
            --color-yellow-950: #422006;

            /* Tailwind Blue Scale */
            --color-blue-200: #bfdbfe;
            --color-blue-300: #93c5fd;
            --color-blue-400: #60a5fa;
            --color-blue-500: #3b82f6;

            /* Tailwind Zinc Scale (Dark Mode Inverted) */
            --color-zinc-50: #18181b;               /* Ticker bg in dark mode */
            --color-zinc-100: #27272a;              /* Tab bg in dark mode */
            --color-zinc-150: #3f3f46;
            --color-zinc-200: #27272a;              /* Section dividers in dark mode */
            --color-zinc-225: #3f3f46;
            --color-zinc-250: #323238;
            --color-zinc-300: #3f3f46;              /* Card borders in dark mode */
            --color-zinc-350: #52525b;              /* Disabled tab text in dark mode */
            --color-zinc-400: #71717a;              /* Faint text/borders in dark mode */
            --color-zinc-450: #52525b;
            --color-zinc-500: #a1a1aa;              /* Secondary text in dark mode */
            --color-zinc-600: #a1a1aa;              /* Muted text in dark mode */
            --color-zinc-700: #3f3f46;
            --color-zinc-800: #27272a;              /* Dark surface border in dark mode */
            --color-zinc-900: #f4f4f5;              /* Primary text in dark mode */
            --color-zinc-950: #ffffff;              /* Title heading in dark mode */

            /* Tailwind Slate */
            --color-slate-500: #64748b;

            /* Shadows & Alpha Transparency */
            --color-shadow-sm: rgba(0, 0, 0, 0.2);
            --color-shadow-md: rgba(0, 0, 0, 0.3);
            --color-shadow-inset: rgba(0, 0, 0, 0.3);
            --color-tile-shadow: rgba(0, 0, 0, 0.4);
            --color-mask-shadow: rgba(0, 0, 0, 0.4);
            --color-overlay-bg: rgba(24, 24, 27, 0.95);
            --color-tab-locked-faint: rgba(161, 161, 170, 0.4);
        }
`

/**
 * Shared structural CSS rules for the game (using CSS variables).
 */
export const SHARED_GAME_CSS = `
/* Josh Comeau's Modern CSS Reset (AMP4EMAIL Adapted) */
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }

        body {
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            background-color: var(--color-white);
            color: var(--color-zinc-900);
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
            background-color: var(--color-white);
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
            border-top: 1px solid var(--color-zinc-200);
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
            background-color: var(--color-amber-100);
            color: var(--color-black);
            font-size: 15px;
            font-weight: 800;
            border-radius: 4px;
            border: none;
            text-align: center;
            box-sizing: border-box;
            margin-right: -4px;
            box-shadow: 0 1px 0 var(--color-amber-200), 0 2px 3px var(--color-tile-shadow);
            position: relative;
        }

        .logo-tile:last-child {
            margin-right: 0;
        }

        .logo-tile:nth-child(odd),
        .logo-tile.tile-blue,
        .logo-tile.rotate-neg {
            background-color: var(--color-amber-100);
            transform: rotate(-8deg);
        }

        .logo-tile:nth-child(even),
        .logo-tile.tile-red,
        .logo-tile.rotate-pos {
            background-color: var(--color-amber-100);
            transform: rotate(8deg);
        }

        .logo-badge {
            display: inline-block;
            color: var(--color-black);
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
            background: var(--color-amber-900);
            color: var(--color-white);
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
            color: var(--color-zinc-600);
            line-height: 1.3;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            margin-top: 0;
            margin-bottom: 6px;
            padding: 0;
        }

        /* Definition Clue Stepper & Active Card */
        .definitions-section {
            border: 3px double var(--color-zinc-300);
            border-radius: 12px;
            margin-bottom: 22px;
            position: relative;
            box-sizing: border-box;
            background-color: var(--color-surface);
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
            color: var(--color-zinc-600);
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
            background: var(--color-surface);
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
            background: var(--color-zinc-100);
            border: none;
            font-size: 11px;
            font-weight: 700;
            color: var(--color-zinc-500);
            cursor: pointer;
            text-align: center;
            line-height: 22px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            font-family: inherit;
            box-shadow: 0 0 0 2px var(--color-white);
        }

        .clue-tab-btn.unlocked {
            background: var(--color-zinc-100);
            color: var(--color-zinc-900);
        }

        .clue-tab-btn.locked {
            color: var(--color-zinc-400);
            background: var(--color-zinc-100);
        }

        .clue-tab-btn.active {
            background: var(--color-amber-300);
            color: var(--color-black);
            opacity: 1;
        }

        .clue-tab-btn.locked.active {
            background: var(--color-zinc-300);
            color: var(--color-zinc-700);
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
            color: var(--color-zinc-950);
            line-height: 1.4;
            font-family: "Helvetica Neue", Helvetica, Arial, sans-serif;
            text-align: center;
        }

        .clue-text.blurred {
            color: var(--color-zinc-400);
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
            background: var(--color-white);
            border: 2px solid var(--color-zinc-300);
            font-size: 20px;
            font-weight: 800;
            color: var(--color-zinc-900);
            text-transform: uppercase;
            line-height: 40px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            font-family: ui-monospace, SFMono-Regular, "Roboto Mono", Menlo, Monaco, Consolas, monospace;
        }

        .mask-tile.tile-revealed {
            background: var(--color-white);
            border-color: var(--color-zinc-400);
            color: var(--color-zinc-600);
        }

        .mask-tile.tile-typed {
            background-color: var(--color-white);
            border: 2px solid var(--color-black);
            color: var(--color-black);
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
            margin-top: -40px;
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
            background: var(--color-amber-300);
            color: var(--color-black);
            box-shadow: 0 1px 2px var(--color-shadow-sm);
        }

        .btn-primary:hover {
            background-color: var(--color-amber-400);
            box-shadow: 0 2px 4px var(--color-shadow-md);
        }

        .btn-primary:active {
            box-shadow: none;
            opacity: 0.9;
        }

        .btn-hint {
            background: var(--color-zinc-200);
            color: var(--color-zinc-800);
            box-shadow: 0 1px 2px var(--color-shadow-sm);
        }

        .btn-hint:hover {
            background-color: var(--color-zinc-250);
            box-shadow: 0 2px 4px var(--color-shadow-md);
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
            background: var(--color-zinc-100);
            padding: 6px;
            border-radius: 6px;
            font-size: 11px;
            font-weight: 600;
            color: var(--color-zinc-600);
            margin-bottom: 10px;
            border: 1px solid transparent;
        }

        .stats-val {
            color: var(--color-zinc-600);
            font-weight: 800;
        }

        /* Victory Card */
        .win-card {
            background: var(--color-zinc-900);
            border: 1px solid var(--color-zinc-800);
            border-radius: 10px;
            padding: 10px 12px;
            text-align: center;
            margin-bottom: 8px;
        }

        .win-title {
            font-size: 17px;
            font-weight: 900;
            color: var(--color-white);
            margin-bottom: 2px;
        }

        .win-score {
            font-size: 13px;
            color: var(--color-zinc-300);
            font-weight: 700;
            margin-bottom: 6px;
        }

        .share-box {
            background: var(--color-zinc-800);
            border: 1px dashed var(--color-zinc-500);
            border-radius: 6px;
            padding: 6px 8px;
            font-family: monospace;
            font-size: 11px;
            color: var(--color-zinc-100);
            text-align: left;
            white-space: pre-wrap;
            word-break: break-all;
        }

        /* Subscribe Banner Box */
        .subscribe-banner {
            background: var(--color-amber-900);
            border: 1px solid var(--color-amber-800);
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
            color: var(--color-white);
        }

        .subscribe-desc {
            font-size: 11px;
            color: var(--color-amber-100);
            margin-top: 1px;
            line-height: 1.2;
        }

        .btn-subscribe {
            background: var(--color-amber-300);
            color: var(--color-black);
            width: 100%;
        }

        /* Card Title */
        .card-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--color-zinc-900);
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
            background: var(--color-overlay-bg);
            border: 1px solid var(--color-zinc-500);
            border-radius: 8px;
            padding: 6px 12px;
            color: var(--color-zinc-900);
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
            background-color: var(--color-blue-200);
        }

        .leaderboard-item.current-player .player-email {
            color: var(--color-zinc-800);
        }

        .leaderboard-item.current-player .player-score {
            color: var(--color-zinc-500);
        }

        .leaderboard-item.current-player .rank-number {
            color: var(--color-zinc-500);
        }

        .leaderboard-item:last-child {
            border-bottom: none;
        }

        .rank-number {
            font-weight: 700;
            width: 24px;
            color: var(--color-zinc-500);
        }

        .player-email {
            flex: 1;
            font-weight: 600;
            color: var(--color-zinc-800);
        }

        .player-score {
            font-weight: 500;
            color: var(--color-zinc-500);
            font-size: 11px;
        }

        .streak-text {
            background-color: #ffffff;
            color: #ea580c;
            padding: 2px 4px;
            margin-right: 2px;
            border-radius: 3px;
            font-weight: 600;
            display: inline-flex;
            align-items: center;
            vertical-align: middle;
            line-height: 1;
        }

        .streak-fire {
            font-size: 8px;
            line-height: 1;
            display: inline-block;
            margin-right: 2px;
        }

        .leaderboard-empty {
            text-align: center;
            color: var(--color-slate-500);
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
            color: var(--color-zinc-500);
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
            color: var(--color-zinc-600);
            overflow: hidden;
        }

        .mini-tutorial strong {
            color: var(--color-zinc-900);
            font-weight: 700;
        }

        .footer {
            padding: 8px 10px 16px;
            text-align: center;
            font-size: 11px;
            color: var(--color-zinc-500);
            font-weight: 500;
        }

        .account-link {
            color: var(--color-zinc-900);
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
            color: var(--color-zinc-400);
            vertical-align: middle;
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
            background-color: var(--color-blue-200);
            border: none;
            border-radius: 6px;
            text-decoration: none;
            color: var(--color-black);
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
            color: var(--color-black);
            font-weight: 700;
            font-size: 12px;
            text-align: left;
        }

        .news-ticker-tag {
            color: var(--color-black);
            font-weight: 400;
        }

        .news-ticker-btn {
            display: inline-flex;
            align-items: center;
            gap: 4px;
            padding: 4px 10px;
            background-color: var(--color-white);
            border: none;
            border-radius: 5px;
            font-size: 11px;
            font-weight: 700;
            color: var(--color-black);
            line-height: 1.2;
            flex-shrink: 0;
            white-space: nowrap;
            cursor: pointer;
            text-decoration: none;
        }

        .news-ticker-btn:hover {
            background-color: var(--color-zinc-100);
        }
`

export function parseCssVariables(css: string): Record<string, string> {
  const rootMatch = css.match(/:root\s*\{([\s\S]*?)\}/)
  const vars: Record<string, string> = {}
  if (rootMatch) {
    for (const match of rootMatch[1].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
      vars[match[1].trim()] = match[2].trim()
    }
  }
  return vars
}

export function resolveCssVariables(css: string, vars: Record<string, string>): string {
  let resolved = css.replace(/(?:\/\*[\s\S]*?\*\/\s*)?:root\s*\{[\s\S]*?\}\s*/, '')
  for (let i = 0; i < 3; i++) {
    resolved = resolved.replace(/var\((--[\w-]+)(?:\s*,\s*([^)]+))?\)/g, (fullMatch, varName, fallback) => {
      if (vars[varName]) return vars[varName]
      if (fallback) return fallback.trim()
      return fullMatch
    })
  }
  return resolved
}

export const LIGHT_THEME_VARS_MAP = parseCssVariables(LIGHT_THEME_VARS)
export const DARK_THEME_VARS_MAP = parseCssVariables(DARK_THEME_VARS)

const ALL_SHADES: TailwindShade[] = ['50', '100', '200', '300', '400', '500', '600', '700', '800', '900', '950']

/**
 * Returns the CSS variables dictionary for a given theme and color combination.
 * Primary palette replaces the --color-amber-XXX scale,
 * and Secondary palette replaces the --color-blue-XXX scale.
 */
export function getThemeVariables(
  theme: EmailTheme = 'light',
  colorCombo: string = 'amber-blue'
): Record<string, string> {
  const baseVars = theme === 'dark' ? { ...DARK_THEME_VARS_MAP } : { ...LIGHT_THEME_VARS_MAP }
  const { primary, secondary } = parseColorCombo(colorCombo)

  const primaryPalette = TAILWIND_PALETTES[primary]
  const secondaryPalette = TAILWIND_PALETTES[secondary]

  if (primaryPalette) {
    for (const shade of ALL_SHADES) {
      if (primaryPalette[shade]) {
        baseVars[`--color-amber-${shade}`] = primaryPalette[shade]
      }
    }
  }

  if (secondaryPalette) {
    for (const shade of ALL_SHADES) {
      if (secondaryPalette[shade]) {
        baseVars[`--color-blue-${shade}`] = secondaryPalette[shade]
      }
    }
  }

  return baseVars
}

/**
 * Full compiled CSS string for dark mode theme (variables resolved for AMP4EMAIL).
 */
export const DARK_THEME_CSS = resolveCssVariables(SHARED_GAME_CSS, DARK_THEME_VARS_MAP).trim()

/**
 * Compiles SHARED_GAME_CSS into concrete values for any theme and color combination.
 */
export function getThemeCss(theme: EmailTheme = 'light', colorCombo: string = 'amber-blue'): string {
  const vars = getThemeVariables(theme, colorCombo)
  return resolveCssVariables(SHARED_GAME_CSS, vars).trim()
}

/**
 * Inlines theme and color combo CSS into the AMP email HTML template.
 * For default light mode with amber-blue, the original pre-compiled CSS is retained.
 * For dark mode or custom color combinations, the <style amp-custom> block is replaced.
 */
export function applyEmailTheme(
  ampHtml: string,
  theme: EmailTheme = 'light',
  colorCombo: string = 'amber-blue'
): string {
  const isDefault = theme === 'light' && (!colorCombo || colorCombo === 'amber-blue')
  if (isDefault) {
    return ampHtml
  }
  const themeCss = getThemeCss(theme, colorCombo)
  return ampHtml.replace(
    /<style amp-custom>[\s\S]*?<\/style>/i,
    `<style amp-custom>\n${themeCss}\n    </style>`
  )
}

