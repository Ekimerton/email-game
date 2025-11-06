# Email Word Guessing Game

An interactive word-guessing game built with AMP for Email and Hono.

## 🎮 How It Works

- Users guess a 7-letter word
- The game validates guesses via API (server-side)
- Tracks the number of attempts
- Shows success message when correct
- Play again to reset

## 🚀 Getting Started

### 1. Start the Development Server

```bash
npm run dev
```

This will start the Hono server on `http://localhost:8787`

### 2. Access the Game

Open your browser and go to:
```
http://localhost:8787
```

The server will serve the email.html file with all the game functionality!

### 3. Play the Game

- Type a 7-letter word guess
- Click "Submit Guess"
- The API validates your guess server-side
- Keep trying until you get it right!

**Current word:** `TESTING`

## 🧪 Testing the API

Run the test script to verify the API endpoint:

```bash
./test-api.sh
```

Or manually test with curl:

```bash
# Test incorrect guess
curl -X POST http://localhost:8787/api/guess \
  -d "user-guess=WRONGGG" \
  -H "Content-Type: application/x-www-form-urlencoded"

# Test correct guess
curl -X POST http://localhost:8787/api/guess \
  -d "user-guess=TESTING" \
  -H "Content-Type: application/x-www-form-urlencoded"
```

## 📁 Project Structure

- `src/index.ts` - Hono API server with guess validation
- `src/email.html` - AMP email with game interface
- `wrangler.jsonc` - Cloudflare Workers configuration
- `test-api.sh` - API testing script

## 🔧 Key Features

### Server-Side (Hono API)
- ✅ POST `/api/guess` - Validates guess against target word
- ✅ CORS configured for AMP emails
- ✅ Serves the game at root URL for testing

### Client-Side (AMP Email)
- ✅ Interactive input with live uppercase conversion
- ✅ Submit button with loading state
- ✅ Real-time feedback from server
- ✅ Win detection and celebration
- ✅ Play again functionality
- ✅ Guess counter

## 🎯 Changing the Target Word

Edit `src/index.ts`:

```typescript
const TARGET_WORD = 'TESTING' // Change this to any word
```

Don't forget to update the `maxlength` in `email.html` if you change the word length!

## 🚢 Deployment

Deploy to Cloudflare Workers:

```bash
npm run deploy
```

Then update the `action-xhr` URL in `email.html` to point to your deployed worker URL.

## 💡 Why Use API Instead of Client-Side?

**With API (Current Implementation):**
- ✅ Answer is hidden from email source code
- ✅ Server validates guesses
- ✅ Can add complex logic (hints, scoring, leaderboards)
- ✅ Can track analytics
- ✅ More secure

**Without API (Pure Client-Side):**
- ❌ Answer visible in HTML source
- ❌ Limited to simple comparisons
- ❌ No persistence
- ✅ Works offline
- ✅ No server needed

## 📧 Testing in Real Email Clients

**Supported Email Clients:**
- Gmail (Web, Android, iOS)
- Yahoo Mail
- Mail.ru
- FairEmail

**Note:** Most email clients have strict requirements for AMP emails:
1. Must be sent from verified sender
2. Requires SPF/DKIM/DMARC setup
3. Recipient must have enabled dynamic emails
4. Needs special MIME structure

For local testing, use the browser at `http://localhost:8787`!

