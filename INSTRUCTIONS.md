# Relatle - Daily Synonym Word Game (AMP for Email)

An interactive daily word-guessing game built with **AMP for Email** and **Hono** running on Cloudflare Workers.

## 🎮 How It Works

1. **Daily Target Word**: Everyone gets the same daily word puzzle based on the date.
2. **Synonym Progression**: Start with 1 revealed synonym. Every incorrect guess reveals the next synonym clue!
3. **Letter Hints & Masks**: See letter position masks (`V _ _ R _ N _`) and request letter hints (-75 pts).
4. **Org Leaderboard**: Scores are recorded for each user's email domain (e.g. `@acme.com`). Compete with colleagues in your organization!
5. **Score Sharing**: On winning, get a pre-formatted score card to copy and share.

---

## 🚀 Getting Started

### 1. Start Dev Server

```bash
npm run dev
```

This starts the local Hono dev server at `http://localhost:8787` with local KV simulation.

### 2. Access the Game & Test Domain Leaderboards

Open your browser to:
- User 1 (Acme Corp): `http://localhost:8787?email=alice@acme.com`
- User 2 (Acme Corp): `http://localhost:8787?email=bob@acme.com`
- User 3 (Tech Corp): `http://localhost:8787?email=charlie@techcorp.io`

---

## 🧪 Testing the API via cURL

### 1. Fetch Today's Game State
```bash
curl "http://localhost:8787/api/state?email=alice@acme.com"
```

### 2. Submit an Incorrect Guess (Reveals Next Synonym)
```bash
curl -X POST "http://localhost:8787/api/guess?email=alice@acme.com" \
  -d "user-guess=INVALID" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### 3. Request a Letter Hint (-75 pts penalty)
```bash
curl -X POST "http://localhost:8787/api/hint?email=alice@acme.com"
```

### 4. Submit Correct Guess (Today's Word: `VIBRANT`)
```bash
curl -X POST "http://localhost:8787/api/guess?email=alice@acme.com" \
  -d "user-guess=VIBRANT" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

### 5. Fetch Domain Leaderboard
```bash
curl "http://localhost:8787/api/leaderboard?domain=acme.com"
```

---

## 📁 Project Structure

- `src/index.ts`: Hono backend API, game state logic, CORS & KV storage
- `src/puzzles.ts`: Daily puzzle dataset & date-seeded lookup engine
- `src/email.html`: Interactive AMP for Email frontend
- `src/emailHtml.ts`: Exported AMP HTML string module for Worker rendering
- `wrangler.jsonc`: Cloudflare Workers & KV namespace configuration

---

## 🎯 Daily Puzzles & Scoring System

- **Base Score**: 1,000 Points
- **Guess Penalty**: -100 Points per additional guess
- **Letter Hint Penalty**: -75 Points per letter revealed
- **Minimum Score**: 100 Points upon solving

---

## 🚢 Deployment

Deploy to Cloudflare Workers:
```bash
npm run deploy
```
