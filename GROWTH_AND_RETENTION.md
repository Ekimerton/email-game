# Inboxed — Growth & Retention Plan and Implementation Status

**Branch:** `retention-and-growth-updates`  
**Snapshot Date:** November 24, 2026 (through Puzzle `#57`)

---

## 1. Context & Live Data Findings (`inboxed.fun/api/admin/dashboard-data`)

* **6-week DAU decline:** 7-day average DAU slipped for five consecutive weeks from its early-October peak (`35.6` DAU during Oct 6–12, peaking at `43` on Oct 6) down to `22.3` DAU during Nov 10–16.
* **Last 7 days (`Nov 17 – Nov 23`):** Headline DAU flattened to `23.0` (`+0.7` vs. `22.3`) only because new-player signups spiked (`36` new subscribers in the week of Nov 16; `21` new players vs. `8` the prior week). **Returning DAU continued dropping** (`24.3` → `21.1` → `20.0`).
* **Day 1–3 drop-off on new signups:** Of `22` players who first played Nov 16–22, `12` (`55%`) played 1 day only and `8` (`36%`) played 2–3 days. Unopened emails jumped from `8` (`Nov 15`) to `26` (`Nov 23`).
* **Key friction leaks identified in data & code:**
  1. **Aggressive 7-day auto-unsubscribe:** Cut off returning/school-domain players during breaks and even unsubscribed users who opened 6–7 emails without submitting a guess.
  2. **Weekend dip + harsh streaks:** Weekdays (`24.8–27.8` DAU) outperform Fri–Sun (`21.5–22.8` DAU), and missing 1 day wiped out streaks while streaks were hidden unless `>= 3` and only shown to the current player.
  3. **Clue #1 wall & obscure/NSFW definitions:** Completion fell from `91–94%` in October to `78%` in the last 7 days (`40 of 50` unfinished plays in Puzzles `#47–#57` stopped after 1–2 guesses; `#54 FILTER` and `#55 RAINBOW` had obscure technical/secondary Clue #1s, and upcoming `#68 BLOW` has Clue #1 `"(US Chicago Regional) Heroin."`).
  4. **Non-AMP dead end:** `10 of 38` signups since Nov 16 never played once; the HTML fallback email routes back to the signup page instead of letting non-AMP clients play in-browser.
  5. **Low-signal share card & solo org domains:** Share text lacked puzzle number, visual guess trail, score, and streak; `44/56` active subscribers are on public domains (`0/190` used custom leaderboards), and `8/12` org-domain subscribers are solo on their domain.

---

## 2. Summary of Proposed Ideas & Current Status

| Area | Proposed Idea | Status | Notes / Scope |
| :--- | :--- | :--- | :--- |
| **Part 1.1** | **Soften auto-unsubscribe + weekdays-only schedule + pause + patch notes** | **Implemented** | Raised cutoff from 7 → **21 missed puzzles** with a **14-puzzle check-in email** (`Keep Getting Puzzles` / `Pause for 2 Weeks`), moved everyone to **Mon–Fri** starting `2026-11-28`, updated Account Preferences & site/email copy, and added the **Nov 24 patch notes** + in-email ticker. |
| **Part 1.2** | **Fix "Clue #1 Wall" & abandoned games** (curate `#58–#124` Clue #1s incl. `#68 BLOW`, add Skip/Next Clue & Give Up state) | **Not yet implemented** | High priority next step, especially cleaning `#68 BLOW` and technical Clue #1s before promoting to `r/Teachers` or general audiences. |
| **Part 1.3** | **Playable in-browser HTML fallback** for Apple Mail / Outlook / ProtonMail | **Not yet implemented** | Replace the `"Sign up to play →"` loop in `src/views/fallback/fallbackView.ts` with a signed-token browser play link (plus separate invite link). |
| **Part 1.4** | **Streak softening & visibility** | **Implemented** | Forgives **1 missed puzzle per 5 puzzles** without counting the missed day, shows `🔥 N` badges for **all visible leaderboard players at `>= 2`**, and displays a pre-play `.streak-banner` above the game card. |
| **Part 2.1** | **Frictionless onboarding** (playable landing-page puzzle + auto-send today's puzzle on `/confirm`) | **Not yet implemented** | Let visitors play Clue #1 / today's puzzle on `inboxed.fun` before subscribing and auto-deliver today's puzzle upon double opt-in confirmation. |
| **Part 2.2** | **Upgraded spoiler-free emoji share card** | **Implemented** | `buildShareText` generates `Inboxed #57 ⬜🟨💡🟩 725pts 🔥2 https://inboxed.fun` inside `.share-card-text`. |
| **Part 2.3** | **Solo domain nudge & custom leaderboards** | **Implemented (Scoped)** | Solo org-domain nudge (`"You're #1 at <domain> (only player today) — forward this email to challenge a coworker!"`) implemented; Custom Leaderboards UI intentionally hidden in Account Preferences for now (backend preserved). |
| **Part 2.4** | **Launch & distribution copy** (Show HN, Reddit `r/wordgames`, `r/webgames`, `r/InternetIsBeautiful`, `r/sideproject`, `r/Teachers`, 15s Gmail demo video script) | **Drafted** | Sample posts drafted in session artifacts; hold `r/Teachers` until `#68 BLOW` and upcoming Clue #1s are curated. |

---

## 3. Details of Changes Implemented on This Branch

1. **Weekdays-Only Schedule (`Mon–Fri`, starting Sat `2026-11-28`)**
   * Updated Cloudflare Cron and `SEND_CRON` to `0 15 * * 1-5` in `wrangler.jsonc`.
   * Kept historical puzzles `#1–#61` (`2026-09-28` through Fri `2026-11-27`) unchanged in `src/game/puzzleLogic.ts`, rolling Sat/Sun dates from `2026-11-28` onward back to Friday (`rollBackToWeekday`) and advancing sequentially (`#62` on Mon `2026-11-30`).
   * Updated `sendDailyPuzzleEmails` (`src/email/dailyCron.ts`) to skip automatic subscriber dispatch and inactivity processing on weekends starting `2026-11-28`, and updated `computeDailyActiveUsers` (`src/services/dashboardService.ts`) not to synthesize empty weekend rows.
   * Updated schedule copy across `src/views/signup/*`, `src/views/confirm/*`, `src/views/privacy/*`, `src/email/emailService.ts`, and `src/views/account/account.html`.

2. **14-Puzzle Check-In, 21-Puzzle Auto-Unsubscribe & 2-Week Pause**
   * `src/services/userService.ts` (`getSubscriberInactivityStatus`, `isSubscriberInactive`, `isSubscriberPaused`) and `src/services/subscribers.ts` (`processInactiveSubscribers`, `updateSubscriberDeliveryPreferences`).
   * Sends a single check-in email (`renderInactivityWarningEmailHtml` / `Text`) at 14 missed puzzles with signed one-click links (`action=keep`, `action=pause`), unsubscribes at 21 missed puzzles, and supports **Pause for 2 Weeks / Resume Now** via `POST /api/account/delivery-preferences` and Account Preferences UI (`src/views/account/account.html`, `src/views/account/account.css`).
   * Added `/dev/email/inactivity-check-in` preview route and `👋 Check-In Email` tab in `/dev` (`src/routes/devRoutes.ts`, `src/views/dev/devWorkbench.html`, `src/views/dev/devWorkbenchView.ts`).

3. **Softer Streaks & Pre-Play Streak Banner**
   * `getUserStreak` (`src/services/userService.ts`) bridges 1 missed puzzle per 5 puzzles without incrementing the streak for the missed day, and breaks on 2 consecutive misses or a second miss within 5 puzzles.
   * `GET /api/leaderboard` (`src/routes/gameApi.ts`) computes streaks for all visible leaderboard players and renders `🔥 N` starting at `streak >= 2`.
   * `buildPuzzleEmailContent` (`src/email/dailyCron.ts`) injects a single-line `.streak-banner` outside `<amp-list>` (`src/email.template.html`, `src/email/emailThemes.ts`).

4. **Upgraded Share Text, Solo Domain Nudge, Hidden Custom Leaderboards & Nov 24 Patch Notes**
   * `buildShareText` (`src/game/gameLogic.ts`) produces compact emoji trails (`⬜` miss, `🟨` synonym, `💡` hint, `🟩` solved) + score + streak (`🔥N` when `>= 2`).
   * `GET /api/leaderboard` emits `isSoloDomainPlayer` and `soloNudgeText`, rendered inside `.solo-domain-nudge` in `src/email.template.html` and `src/email/emailThemes.ts`.
   * Commented out the `Custom` leaderboard tab and panel in `src/views/account/account.html` (and hid the switcher bar for public-domain users), keeping backend endpoints intact.
   * Prepended the `november-24-2026` update in `src/views/updates/updatesData.ts` and updated the in-email `.news-ticker-text` (`"Now weekdays only (Mon–Fri) + streak & share updates!"`).

---

## 4. Verification Performed

* **`npm run ci`:** `npm run sync`, `tsc --noEmit`, `wrangler deploy --dry-run`, and `vitest run` passed (**16 test files / 252 tests**, including light and dark AMP4EMAIL validation in `tests/ampValidator.test.ts`).
* **`npm run dev` (`wrangler dev`):** Verified Worker runtime startup cleanly (caught and removed non-function primitive exports from Worker entrypoint `src/index.ts`).
* **Local browser render check (`/dev/render`, `/updates`, `/dev/page/account`):** Verified unclipped news ticker, emoji share card (`Inboxed #57 ⬜🟩 900pts https://inboxed.fun`), solo domain nudge, pre-play `.streak-banner`, Nov 24 expanded patch notes, and updated Account Preferences UI.

---

## 5. Recommended Next Steps (Remaining Items)

1. **Curate upcoming puzzles (`#58–#124` in `src/game/puzzles.ts`):** Replace `#68 BLOW` Clue #1 and any overly obscure technical Clue #1s with intuitive primary definitions.
2. **Add "Skip / Reveal Next Clue" and "Give Up / Reveal Answer":** Eliminate the Guess #1–2 abandonment dead end.
3. **Make the HTML fallback playable in-browser:** Link directly to a signed-token browser play session instead of looping existing subscribers to `/signup`.
4. **Streamline landing & `/confirm` onboarding:** Make the homepage preview card interactive and auto-send today's puzzle on `/confirm`.
5. **Deploy (`npm run deploy`) and publish the drafted launch posts** once ready.
