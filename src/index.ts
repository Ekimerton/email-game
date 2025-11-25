import { Hono } from 'hono'
import { OAuth2Client } from 'google-auth-library'

type GameState = {
  guessCount: number;
  currentGuess: string;
  currentInput: string;
  hasWon: boolean;
  lastMessage: string;
  isSubmitting: boolean;
};

type Bindings = {
  GAME_STATE_KV: KVNamespace;
};

const app = new Hono<{ Bindings: Bindings }>()
const client = new OAuth2Client()

const getDefaultGameState = (): GameState => ({
  guessCount: 0,
  currentGuess: '',
  currentInput: '',
  hasWon: false,
  lastMessage: '',
  isSubmitting: false,
})

// Function to get user email from AMP token
async function getUserEmail(authorizationHeader: string | undefined): Promise<string> {
  if (!authorizationHeader) {
    return 'dev'
  }

  try {
    const token = authorizationHeader.split(' ')[1]
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: 'https://' + new URL(process.env.URL as string).hostname,
    })
    const payload = ticket.getPayload()
    return payload?.email || 'dev'
  } catch (error) {
    console.error('Token verification failed:', error)
    return 'dev'
  }
}

// Get game state
// Enable CORS for AMP emails
app.use('/api/*', async (c, next) => {
  const origin = c.req.header('Origin') || 'null'

  // Helper to set CORS headers
  const setCorsHeaders = (headers: Headers) => {
    headers.set('Access-Control-Allow-Origin', origin)
    headers.set('Vary', 'Origin')
    headers.set('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Content-Type, AMP-Same-Origin, Authorization')
    headers.set('Access-Control-Expose-Headers', 'AMP-Access-Control-Allow-Source-Origin')
    headers.set('Access-Control-Allow-Credentials', 'true')

    const ampSourceOrigin = c.req.query('__amp_source_origin')
    if (ampSourceOrigin) {
      headers.set('AMP-Access-Control-Allow-Source-Origin', ampSourceOrigin)
    }
  }

  // Respond to preflight requests
  if (c.req.method === 'OPTIONS') {
    const response = c.body(null, 204)
    setCorsHeaders(response.headers)
    return response
  }

  await next()

  // Add CORS headers to the response
  if (c.res) {
    setCorsHeaders(c.res.headers)
  }
})

app.get('/api/state', async (c) => {
  const userEmail = await getUserEmail(c.req.header('Authorization'));
  const gameId = `1-${userEmail}`; // Game #1 for this user

  const storedState = await c.env.GAME_STATE_KV.get(gameId, { type: 'json' }) as GameState | null;
  const gameState = storedState ? { ...getDefaultGameState(), ...storedState } : getDefaultGameState();

  return c.json(gameState);
});

// Game configuration
const TARGET_WORD = 'TESTING'

// Root endpoint
app.get('/', (c) => {
  return c.json({
    message: 'Email Word Game API',
    endpoints: {
      validateGuess: 'POST /api/guess'
    }
  })
})

// Validate guess endpoint
app.post('/api/guess', async (c) => {
  try {
    const userEmail = await getUserEmail(c.req.header('Authorization'))
    const gameId = `1-${userEmail}`;

    const storedState = await c.env.GAME_STATE_KV.get(gameId, { type: 'json' }) as GameState | null;
    const gameState = storedState ? { ...getDefaultGameState(), ...storedState } : getDefaultGameState();

    if (gameState.hasWon) {
      return c.json({
        correct: true,
        message: 'You have already won!',
        guess: gameState.currentGuess,
        guessCount: gameState.guessCount,
        currentInput: gameState.currentInput,
        isSubmitting: false,
      });
    }

    const body = await c.req.parseBody()
    const guess = (body['user-guess'] as string || '').toUpperCase().trim()

    if (!guess) {
      return c.json({
        success: false,
        error: 'No guess provided'
      }, 400)
    }

    const isCorrect = guess === TARGET_WORD

    // Update game state
    gameState.guessCount += 1;
    gameState.currentGuess = guess;
    gameState.currentInput = isCorrect ? guess : '';
    gameState.hasWon = isCorrect;
    gameState.lastMessage = isCorrect
      ? `🎉 Correct! The word was ${TARGET_WORD}!`
      : `❌ Incorrect. Try again!`;
    gameState.isSubmitting = false;

    // Save the new state
    await c.env.GAME_STATE_KV.put(gameId, JSON.stringify(gameState));

    return c.json({
      correct: gameState.hasWon,
      guess: gameState.currentGuess,
      message: gameState.lastMessage,
      guessCount: gameState.guessCount,
      currentInput: gameState.currentInput,
      isSubmitting: false,
    })
  } catch (error) {
    console.error('Error processing guess:', error);
    return c.json({
      success: false,
      error: 'Failed to process guess'
    }, 500)
  }
})

export default app
