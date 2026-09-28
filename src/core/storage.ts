// Persistent memory store for development fallback & 429 rate limit protection
export const MEMORY_STORE = new Map<string, any>()

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T | null> {
  let timer: any
  const timeoutPromise = new Promise<null>((resolve) => {
    timer = setTimeout(() => resolve(null), ms)
  })
  try {
    return await Promise.race([promise, timeoutPromise])
  } finally {
    if (timer) clearTimeout(timer)
  }
}

function safeClone<T>(val: T): T {
  if (val === null || val === undefined || typeof val !== 'object') {
    return val
  }
  try {
    return structuredClone(val)
  } catch {
    return JSON.parse(JSON.stringify(val))
  }
}

// Active lock promises per resource key
const keyLocks = new Map<string, Promise<void>>()

/**
 * Executes an async task while holding an exclusive lock on the given key.
 * Subsequent operations on the same key wait for preceding operations to complete,
 * preventing lost updates and race conditions across concurrent requests.
 */
export async function withKeyLock<T>(key: string, fn: () => Promise<T>): Promise<T> {
  const previousLock = keyLocks.get(key) || Promise.resolve()
  let releaseLock: () => void
  const currentLock = new Promise<void>((resolve) => {
    releaseLock = resolve
  })

  keyLocks.set(key, currentLock)

  try {
    await previousLock
  } catch {
    // Continue even if the previous task encountered an error
  }

  try {
    return await fn()
  } finally {
    releaseLock!()
    if (keyLocks.get(key) === currentLock) {
      keyLocks.delete(key)
    }
  }
}

export async function kvGet(kv: KVNamespace | undefined, key: string): Promise<any> {
  if (kv) {
    try {
      // 2500ms timeout prevents KV cold-start lag from timing out the client
      const val = await withTimeout(kv.get(key, { type: 'json' }), 2500)
      if (val !== null && val !== undefined) {
        MEMORY_STORE.set(key, safeClone(val))
        return safeClone(val)
      }
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed reading ${key} from KV, falling back to memory:`, err)
    }
  }
  const memVal = MEMORY_STORE.get(key)
  return memVal !== undefined && memVal !== null ? safeClone(memVal) : null
}

export async function kvPut(kv: KVNamespace | undefined, key: string, value: any): Promise<void> {
  const cloned = safeClone(value)
  MEMORY_STORE.set(key, cloned)
  if (kv) {
    try {
      await withTimeout(kv.put(key, JSON.stringify(cloned)), 2500)
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed writing ${key} to KV:`, err)
    }
  }
}

export async function kvDelete(kv: KVNamespace | undefined, key: string): Promise<void> {
  MEMORY_STORE.delete(key)
  if (kv) {
    try {
      await kv.delete(key)
    } catch (err) {
      console.warn(`[KV Error] Failed deleting ${key} from KV:`, err)
    }
  }
}

