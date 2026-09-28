import type { StorageBackend } from './types'

// Persistent memory store for development fallback & 429 rate limit protection
export const MEMORY_STORE = new Map<string, any>()

function extractBackends(storage?: StorageBackend) {
  let db: D1Database | undefined
  let kv: KVNamespace | undefined

  if (storage) {
    if ('prepare' in storage && typeof (storage as any).prepare === 'function') {
      db = storage as D1Database
    } else if ('get' in storage && typeof (storage as any).get === 'function') {
      kv = storage as KVNamespace
    } else if (typeof storage === 'object') {
      const obj = storage as any
      if (obj.DB && typeof obj.DB.prepare === 'function') {
        db = obj.DB
      } else if (obj.db && typeof obj.db.prepare === 'function') {
        db = obj.db
      }
      if (obj.GAME_STATE_KV && typeof obj.GAME_STATE_KV.get === 'function') {
        kv = obj.GAME_STATE_KV
      } else if (obj.kv && typeof obj.kv.get === 'function') {
        kv = obj.kv
      }
    }
  }

  return { db, kv }
}

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

export async function kvGet(storage: StorageBackend, key: string): Promise<any> {
  const { db, kv } = extractBackends(storage)

  // 1. Prioritize D1 for strong read-after-write consistency
  if (db) {
    try {
      const row = await db
        .prepare('SELECT value FROM kv_store WHERE key = ?')
        .bind(key)
        .first<{ value: string }>()

      if (row && row.value !== undefined && row.value !== null) {
        try {
          const parsed = JSON.parse(row.value)
          MEMORY_STORE.set(key, safeClone(parsed))
          return safeClone(parsed)
        } catch {
          MEMORY_STORE.set(key, row.value)
          return row.value
        }
      }

      // Auto-heal / backfill from KV if key not yet present in D1
      if (kv) {
        const kvVal = await withTimeout(kv.get(key, { type: 'json' }), 2500)
        if (kvVal !== null && kvVal !== undefined) {
          const safeVal = safeClone(kvVal)
          MEMORY_STORE.set(key, safeVal)
          db.prepare(
            'INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
          )
            .bind(key, JSON.stringify(safeVal), new Date().toISOString())
            .run()
            .catch((err) => console.warn(`[Auto-heal D1 error for ${key}]:`, err))
          return safeVal
        }
      }

      return null
    } catch (err) {
      console.warn(`[D1 Read Warning] Failed reading ${key} from D1, falling back to KV/memory:`, err)
    }
  }

  // 2. Fallback to KV if D1 was not provided or encountered an error
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

  // 3. Fallback to MEMORY_STORE (used in unit tests / offline)
  const memVal = MEMORY_STORE.get(key)
  return memVal !== undefined && memVal !== null ? safeClone(memVal) : null
}

export async function kvPut(storage: StorageBackend, key: string, value: any): Promise<void> {
  const cloned = safeClone(value)
  MEMORY_STORE.set(key, cloned)
  const { db, kv } = extractBackends(storage)

  // 1. Write to D1 (primary strongly consistent store)
  if (db) {
    try {
      const valStr = JSON.stringify(cloned)
      await db
        .prepare(
          'INSERT INTO kv_store (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at'
        )
        .bind(key, valStr, new Date().toISOString())
        .run()
    } catch (err) {
      console.error(`[D1 Write Error] Failed writing ${key} to D1:`, err)
    }
  }

  // 2. Dual-write to KV (as safe backup during transition)
  if (kv) {
    try {
      await withTimeout(kv.put(key, JSON.stringify(cloned)), 2500)
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed writing ${key} to KV:`, err)
    }
  }
}

export async function kvDelete(storage: StorageBackend, key: string): Promise<void> {
  MEMORY_STORE.delete(key)
  const { db, kv } = extractBackends(storage)

  if (db) {
    try {
      await db.prepare('DELETE FROM kv_store WHERE key = ?').bind(key).run()
    } catch (err) {
      console.error(`[D1 Delete Error] Failed deleting ${key} from D1:`, err)
    }
  }

  if (kv) {
    try {
      await kv.delete(key)
    } catch (err) {
      console.warn(`[KV Error] Failed deleting ${key} from KV:`, err)
    }
  }
}

// Aliases for clear semantic usage
export const dbGet = kvGet
export const dbPut = kvPut
export const dbDelete = kvDelete


