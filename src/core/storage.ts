// Persistent memory store for development fallback & 429 rate limit protection
export const MEMORY_STORE = new Map<string, any>()

export async function kvGet(kv: KVNamespace | undefined, key: string): Promise<any> {
  if (kv) {
    try {
      const val = await kv.get(key, { type: 'json' })
      if (val !== null) {
        MEMORY_STORE.set(key, val)
        return val
      }
    } catch (err) {
      console.warn(`[KV 429 Rate Limit Warning] Failed reading ${key} from KV, falling back to memory:`, err)
    }
  }
  return MEMORY_STORE.get(key) || null
}

export async function kvPut(kv: KVNamespace | undefined, key: string, value: any): Promise<void> {
  MEMORY_STORE.set(key, value)
  if (kv) {
    try {
      await kv.put(key, JSON.stringify(value))
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
